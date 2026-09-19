import os
import json
import time
import base64
import numpy as np
import cv2
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from std_msgs.msg import String

from mysuru_clean_vision.vision_engine import WasteDetector
from mysuru_clean_vision.jurisdiction_router import JurisdictionRouter

class DetectionNode(Node):
    def __init__(self):
        super().__init__('detection_node')
        self.subscription = self.create_subscription(
            Image,
            '/dashcam/image_raw',
            self.image_callback,
            10
        )
        self.alert_publisher = self.create_publisher(String, '/civic_alerts/construction_dumping', 10)

        self.detector = WasteDetector()
        self.router = JurisdictionRouter()
        self.alerts_file = '/tmp/civic_alerts.json'

        self.current_lat, self.current_lon = self.router.get_current_gps()
        self.current_authority = self.router.get_authority(self.current_lat, self.current_lon)
        self.get_logger().info(f"Live GPS Location: ({self.current_lat}, {self.current_lon}) | Jurisdiction: {self.current_authority}")

        self.active_incidents = {}
        self.dedup_window_sec = 20.0

        if not os.path.exists(self.alerts_file):
            with open(self.alerts_file, 'w') as f:
                json.dump({'live_feed': {}, 'incidents': []}, f)

    def load_existing_user_modifications(self):
        user_mods = {}
        if os.path.exists(self.alerts_file):
            try:
                with open(self.alerts_file, 'r') as f:
                    data = json.load(f)
                    for inc in data.get('incidents', []):
                        iid = inc.get('incident_id')
                        if iid:
                            user_mods[iid] = {
                                'verification_status': inc.get('verification_status', 'Pending Verification'),
                                'status': inc.get('status', 'Detected'),
                                'officer_notes': inc.get('officer_notes', ''),
                                'proof_raw_b64': inc.get('proof_raw_b64'),
                                'proof_enhanced_b64': inc.get('proof_enhanced_b64'),
                                'proof_bbox_b64': inc.get('proof_bbox_b64')
                            }
            except Exception:
                pass
        return user_mods

    def image_callback(self, msg):
        frame = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))

        # Process frame with 5-Stage Retinex + YOLO vision engine
        raw_frame, enhanced_clean_frame, annotated_frame, detections, waste_volume, is_night_mode, brightness = self.detector.process_frame(frame)

        current_time_str = time.strftime('%H:%M:%S')
        now_ts = time.time()

        # Generate base64 strings for live feed display
        _, live_raw_enc = cv2.imencode('.jpg', raw_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        _, live_ann_enc = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        live_raw_b64 = base64.b64encode(live_raw_enc).decode('utf-8')
        live_ann_b64 = base64.b64encode(live_ann_enc).decode('utf-8')

        user_mods = self.load_existing_user_modifications()

        alert_triggered = len(detections) > 0 and waste_volume > 0

        if alert_triggered:
            urgency_score = int(waste_volume * 100) + 15
            dedup_key = (round(self.current_lat, 4), round(self.current_lon, 4), self.current_authority)

            existing_incident = self.active_incidents.get(dedup_key)

            if existing_incident and (now_ts - existing_incident['last_seen_ts'] <= self.dedup_window_sec):
                # Truck is lingering: update timestamps and occurrences ONLY
                # DO NOT overwrite proof photos! They remain permanently locked!
                existing_incident['last_updated'] = current_time_str
                existing_incident['last_seen_ts'] = now_ts
                existing_incident['occurrences'] += 1
                existing_incident['waste_volume'] = max(existing_incident['waste_volume'], float(waste_volume))
                existing_incident['urgency_score'] = max(existing_incident['urgency_score'], urgency_score)
            else:
                # Capture 3 locked photo proofs from this EXACT SAME MOMENT IN TIME
                _, p1_enc = cv2.imencode('.jpg', raw_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                _, p2_enc = cv2.imencode('.jpg', enhanced_clean_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                _, p3_enc = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

                proof1_b64 = base64.b64encode(p1_enc).decode('utf-8') # Proof 1: Clean Raw (No BBox)
                proof2_b64 = base64.b64encode(p2_enc).decode('utf-8') # Proof 2: Clean Retinex Enhanced (NO BBox)
                proof3_b64 = base64.b64encode(p3_enc).decode('utf-8') # Proof 3: YOLO Bounding Box Overlay

                incident_id = f"INC-{int(now_ts) % 10000:04d}"
                mods = user_mods.get(incident_id, {})

                new_incident = {
                    'incident_id': incident_id,
                    'first_detected': current_time_str,
                    'last_updated': current_time_str,
                    'last_seen_ts': now_ts,
                    'occurrences': 1,
                    'jurisdiction': self.current_authority,
                    'urgency_score': urgency_score,
                    'waste_volume': float(waste_volume),
                    'detections_count': len(detections),
                    'detections': detections,
                    'lat': self.current_lat,
                    'lon': self.current_lon,
                    'proof_raw_b64': mods.get('proof_raw_b64') or proof1_b64,
                    'proof_enhanced_b64': mods.get('proof_enhanced_b64') or proof2_b64,
                    'proof_bbox_b64': mods.get('proof_bbox_b64') or proof3_b64,
                    'is_night_mode': is_night_mode,
                    'brightness': brightness,
                    'verification_status': mods.get('verification_status', 'Pending Verification'),
                    'status': mods.get('status', 'Detected'),
                    'officer_notes': mods.get('officer_notes', '')
                }
                self.active_incidents[dedup_key] = new_incident

                alert_msg = String()
                alert_msg.data = json.dumps({
                    'incident_id': incident_id,
                    'timestamp': current_time_str,
                    'jurisdiction': self.current_authority,
                    'urgency_score': urgency_score,
                    'waste_volume': waste_volume
                })
                self.alert_publisher.publish(alert_msg)
                self.get_logger().info(f"[NEW INCIDENT DETECTED] ID: {incident_id} | Urgency: {urgency_score} | Authority: {self.current_authority}")

        # Preserve officer edits
        for inc in self.active_incidents.values():
            iid = inc['incident_id']
            if iid in user_mods:
                inc['verification_status'] = user_mods[iid]['verification_status']
                inc['status'] = user_mods[iid]['status']
                inc['officer_notes'] = user_mods[iid]['officer_notes']
                if user_mods[iid].get('proof_raw_b64'):
                    inc['proof_raw_b64'] = user_mods[iid]['proof_raw_b64']
                if user_mods[iid].get('proof_enhanced_b64'):
                    inc['proof_enhanced_b64'] = user_mods[iid]['proof_enhanced_b64']
                if user_mods[iid].get('proof_bbox_b64'):
                    inc['proof_bbox_b64'] = user_mods[iid]['proof_bbox_b64']

        incidents_list = list(self.active_incidents.values())
        incidents_list.sort(key=lambda x: x['urgency_score'], reverse=True)

        full_payload = {
            'live_feed': {
                'timestamp': current_time_str,
                'raw_frame_b64': live_raw_b64,
                'enhanced_frame_b64': live_ann_b64,
                'is_night_mode': is_night_mode,
                'brightness': brightness,
                'detections_count': len(detections),
                'waste_volume': float(waste_volume),
                'lat': self.current_lat,
                'lon': self.current_lon,
                'jurisdiction': self.current_authority
            },
            'incidents': incidents_list
        }

        try:
            with open(self.alerts_file, 'w') as f:
                json.dump(full_payload, f)
        except Exception as e:
            self.get_logger().error(f"Failed writing alerts JSON: {str(e)}")

def main(args=None):
    rclpy.init(args=args)
    node = DetectionNode()
    try:
        rclpy.spin(node)
    except (KeyboardInterrupt, Exception):
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()
