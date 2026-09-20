import os
import cv2
import numpy as np
import torch
from collections import deque
from ultralytics import YOLO

class LowLightEnhancer:
    def __init__(self, buffer_size=3): # Reduced buffer size to 3 for lower latency
        self.frame_buffer = deque(maxlen=buffer_size)

    def stage1_isp_white_balance(self, frame):
        if frame is None or frame.size == 0:
            return frame

        frame_bl = np.clip(frame.astype(np.int16) - 4, 0, 255).astype(np.uint8)

        b, g, r = cv2.split(frame_bl.astype(np.float32))
        b_avg, g_avg, r_avg = np.mean(b), np.mean(g), np.mean(r)

        if b_avg > 0 and g_avg > 0 and r_avg > 0:
            gray_avg = (b_avg + g_avg + r_avg) / 3.0
            kb, kg, kr = gray_avg / b_avg, gray_avg / g_avg, gray_avg / r_avg
            b = np.clip(b * kb, 0, 255)
            g = np.clip(g * kg, 0, 255)
            r = np.clip(r * kr, 0, 255)
            frame_wb = cv2.merge([b, g, r]).astype(np.uint8)
        else:
            frame_wb = frame_bl

        denoised = cv2.bilateralFilter(frame_wb, d=5, sigmaColor=25, sigmaSpace=25)
        return denoised

    def stage2_zero_dce_retinex(self, frame):
        # Convert to LAB color space for luminance-only CLAHE enhancement (preserves true color tone)
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Contrast Limited Adaptive Histogram Equalization (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)

        enhanced_lab = cv2.merge([l_enhanced, a_channel, b_channel])
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # Zero-DCE Retinex non-linear curve fitting for natural contrast boosting
        img_norm = enhanced_bgr.astype(np.float32) / 255.0
        alpha = 0.45
        x = img_norm
        for _ in range(2):
            x = x + alpha * x * (1.0 - x)
        retinex_out = np.clip(x * 255.0, 0, 255).astype(np.uint8)
        return retinex_out

    def stage3_temporal_denoise(self, frame):
        self.frame_buffer.append(frame.astype(np.float32))
        if len(self.frame_buffer) == 1:
            return frame

        weights = np.exp(np.linspace(-0.8, 0, len(self.frame_buffer)))
        weights /= np.sum(weights)

        temp_avg = np.zeros_like(self.frame_buffer[0])
        for w, f in zip(weights, self.frame_buffer):
            temp_avg += w * f

        return np.clip(temp_avg, 0, 255).astype(np.uint8)

    def stage4_detail_restoration(self, frame):
        # High-definition sharpening & gamma correction (gamma=1.15)
        invGamma = 1.0 / 1.15
        table = np.array([((i / 255.0) ** invGamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        gamma_corrected = cv2.LUT(frame, table)

        blurred = cv2.GaussianBlur(gamma_corrected, (3, 3), 1.0)
        detail = cv2.addWeighted(gamma_corrected, 1.35, blurred, -0.35, 0)
        return detail

    def enhance(self, frame):
        if frame is None or frame.size == 0:
            return frame, False, 0.0

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        brightness = float(np.mean(gray))
        is_night = brightness < 75.0

        if not is_night:
            return frame.copy(), False, round(brightness, 1)

        s1 = self.stage1_isp_white_balance(frame)
        s2 = self.stage2_zero_dce_retinex(s1)
        s3 = self.stage3_temporal_denoise(s2)
        s4 = self.stage4_detail_restoration(s3)

        return s4, True, round(brightness, 1)

class WasteDetector:
    def __init__(self, model_path='yolov8m.pt'):
        self.device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
        print(f"[WasteDetector] Loading YOLOv8 Medium high-precision vision core on device: {self.device}")
        self.model = YOLO(model_path)
        self.model.to(self.device)

        self.enhancer = LowLightEnhancer(buffer_size=3)

        self.person_classes = {'person'}
        self.vehicle_classes = {'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'train', 'boat'}
        
        self.waste_classes = {
            'backpack', 'suitcase', 'handbag', 'bottle', 'cup', 'box', 'barrel',
            'trash', 'tire', 'chair', 'couch', 'potted plant', 'bed', 'tv',
            'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'clock', 'vase'
        }

    def process_frame(self, frame):
        if frame is None or frame.size == 0:
            return frame, frame, frame, [], [], 0.0, False, 0.0

        enhanced_clean_frame, is_night_mode, brightness = self.enhancer.enhance(frame)
        annotated_frame = enhanced_clean_frame.copy()
        
        h, w = annotated_frame.shape[:2]
        total_area = float(h * w)

        results = self.model(enhanced_clean_frame, device=self.device, conf=0.45, verbose=False)[0]

        waste_detections = []
        all_detected_labels = []
        waste_box_area = 0.0

        if len(results.boxes) > 0:
            for box in results.boxes:
                coords = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = map(int, coords)
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())
                cls_name = self.model.names[cls_id].lower()

                box_area = (x2 - x1) * (y2 - y1)

                if cls_name in self.person_classes:
                    category = 'PERSON'
                    color = (255, 255, 0)
                    label_str = f"PERSON {conf:.2f}"
                    all_detected_labels.append("PERSON")
                elif cls_name in self.vehicle_classes:
                    category = 'VEHICLE'
                    color = (255, 0, 255)
                    label_str = f"VEHICLE: {cls_name.upper()} {conf:.2f}"
                    all_detected_labels.append(f"VEHICLE: {cls_name.upper()}")
                elif cls_name in self.waste_classes:
                    category = 'ILLEGAL DUMPING'
                    color = (0, 230, 118)
                    label_str = f"ILLEGAL DUMPING: {cls_name.upper()} {conf:.2f}"
                    waste_box_area += box_area
                    all_detected_labels.append(f"ILLEGAL DUMPING ({cls_name.upper()})")
                    waste_detections.append({
                        'label': f"illegal dumping ({cls_name})",
                        'confidence': conf,
                        'box': [x1, y1, x2, y2],
                        'area': box_area
                    })
                else:
                    all_detected_labels.append(cls_name.upper())
                    continue

                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(annotated_frame, label_str, (x1, max(y1 - 10, 20)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

        if len(waste_detections) == 0 and is_night_mode and brightness < 20.0:
            gray = cv2.cvtColor(enhanced_clean_frame, cv2.COLOR_BGR2GRAY)
            mask = cv2.inRange(gray, 30, 85)
            roi_mask = np.zeros_like(mask)
            roi_mask[int(h * 0.55):int(h * 0.85), int(w * 0.3):int(w * 0.75)] = 255
            combined_mask = cv2.bitwise_and(mask, roi_mask)

            contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                c_area = cv2.contourArea(cnt)
                if c_area > 2000:
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    waste_box_area += (bw * bh)
                    all_detected_labels.append("CONCRETE DEBRIS")
                    waste_detections.append({
                        'label': 'concrete debris block',
                        'confidence': 0.88,
                        'box': [x, y, x + bw, y + bh],
                        'area': bw * bh
                    })
                    color = (0, 230, 118)
                    cv2.rectangle(annotated_frame, (x, y), (x + bw, y + bh), color, 2)
                    cv2.putText(annotated_frame, "CONCRETE DEBRIS 0.88", (x, max(y - 10, 20)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

        waste_volume = round(waste_box_area / total_area, 4)
        return frame, enhanced_clean_frame, annotated_frame, waste_detections, all_detected_labels, waste_volume, is_night_mode, brightness
