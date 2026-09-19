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

        # Auto-detect real-time GPS location of host machine (e.g. Chennai, Mysuru, Bengaluru)
        self.current_lat, self.current_lon = self.router.get_current_gps()
        self.current_authority = self.router.get_authority(self.current_lat, self.current_lon)
        self.get_logger().info(f"Live GPS Location: ({self.current_lat}, {self.current_lon}) | Jurisdiction: {self.current_authority}")

        # Active incident cache for spatial-temporal deduplication
        self.active_incidents = {}
        self.dedup_window_sec = 15.0

        if not os.path.exists(self.alerts_file):
            with open(self.alerts_file, 'w') as f:
                json.dump([], f)

    def image_callback(self, msg):
        frame = np.frombuffer(msg.data, dtype=np.uint8).reshape((msg.height, msg.width, 3))

        # Process frame with adaptive CLAHE + YOLO vision engine
        processed_frame, detections, waste_volume, is_night_mode, brightness = self.detector.process_frame(frame)

        current_time_str = time.strftime('%H:%M:%S')
        now_ts = time.time()

        _, raw_encoded = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        _, proc_encoded = cv2.imencode('.jpg', processed_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        raw_b64 = base64.b64encode(raw_encoded).decode('utf-8')
        proc_b64 = base64.b64encode(proc_encoded).decode('utf-8')

        alert_triggered = len(detections) > 0 and waste_volume > 0

        if alert_triggered:
            urgency_score = int(waste_volume * 100) + 15
            dedup_key = (round(self.current_lat, 4), round(self.current_lon, 4), self.current_authority)

            existing_incident = self.active_incidents.get(dedup_key)

            if existing_incident and (now_ts - existing_incident['last_seen_ts'] <= self.dedup_window_sec):
                existing_incident['last_updated'] = current_time_str
                existing_incident['last_seen_ts'] = now_ts
                existing_incident['occurrences'] += 1
                existing_incident['waste_volume'] = max(existing_incident['waste_volume'], float(waste_volume))
                existing_incident['urgency_score'] = max(existing_incident['urgency_score'], urgency_score)
                existing_incident['raw_frame_b64'] = raw_b64
                existing_incident['enhanced_frame_b64'] = proc_b64
                existing_incident['is_night_mode'] = is_night_mode
                existing_incident['brightness'] = brightness
            else:
                incident_id = f"INC-{int(now_ts) % 10000:04d}"
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
                    'raw_frame_b64': raw_b64,
                    'enhanced_frame_b64': proc_b64,
                    'is_night_mode': is_night_mode,
                    'brightness': brightness,
                    'alert_triggered': True,
                    'status': 'Active'
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

        incidents_list = list(self.active_incidents.values())
        incidents_list.sort(key=lambda x: x['urgency_score'], reverse=True)

        full_payload = {
            'live_feed': {
                'timestamp': current_time_str,
                'raw_frame_b64': raw_b64,
                'enhanced_frame_b64': proc_b64,
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
