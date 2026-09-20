# 🛡️ Hard Constraints & City Scale Assumptions

## 1. Technical Constraints
- **Zero Cloud Reliance (Edge Deployable)**: All retinex processing and YOLO inference must execute locally on edge hardware (e.g., Jetson / laptop GPU) without requiring active internet connectivity.
- **Latency Budget**: Detection frame rate must remain $\ge 15\text{ FPS}$ to support live stream monitoring.
- **Flicker-Free UI**: Dashboard updates must perform differential state polling without page reloads or screen blinking.

---

## 2. City Scale Assumptions (Mysuru Municipal Corporation)
- **Coverage Target**: 65 municipal wards across Mysuru.
- **Processing Capacity**: Up to 500 concurrent camera feeds aggregated at ward-level edge processing units.
- **Incident SLA**: High-confidence detections ($>85\%$) are automatically flagged for municipal dispatch within 30 seconds of occurrence.
