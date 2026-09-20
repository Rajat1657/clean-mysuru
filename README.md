# Clean Mysuru — Autonomous Anomaly Detection & Dynamic Jurisdictional Routing

> HackMysuru 1.0 · Phase 1 · Civic Governance & Clean Mysuru
> Team Clean Mysuru (Team ID: #HM-502)

| 📎 Submission links | 📋 Templates | 🏗️ Architecture | 🛡️ Hard constraints | ⚙️ Setup | 🤖 AI usage | ⚠️ Limitations |
|---|---|---|---|---|---|---|
| [resource.md](./resource.md) | [resource-templates/](./resource-templates/) | [docs/architecture.md](./docs/architecture.md) | [docs/constraints.md](./docs/constraints.md) | [docs/setup.md](./docs/setup.md) | [ai.md](./ai.md) | [docs/limitations.md](./docs/limitations.md) |

---

## 1. Problem Understanding

**Chosen sub-problem:** `Sub-Problem 5: Detection Without Reporting (Autonomous Anomaly Detection & Dynamic Routing)`

- **The gap we saw:** Civic garbage dumping and low-light night hazards across Mysuru City Corporation (MCC) boundaries traditionally rely on manual citizen complaints, causing delayed municipal responses, misplaced jurisdictional disputes between MCC wards and Panchayats, and lost public trust.
- **Why it matters:** Construction debris and overflowing waste on roadside corridors create severe health hazards, block drain channels during monsoons, and damage public hygiene. Manual complaint reporting suffers from delay, zero verification, and bounce-backs when boundaries are ambiguous.
- **Why we chose this over the others:** We chose Sub-Problem 5 because automation eliminates the friction of human reporting. By deploying dashcam AI vision directly on municipal waste vehicles and street surveillance, illegal dumping is caught the exact moment it occurs.
- **What "solved" looks like for us:** A fully autonomous edge pipeline where civic dumping is detected in real time (even in pitch darkness), auto-verified with locked multi-frame photo proofs, instantly geo-routed to the correct ward office, and tracked on an executive dashboard without requiring a single citizen click.

## 2. Target Users & Mysuru Context

| User | Their situation | What they need from us |
|---|---|---|
| Resident in Mysuru Ward / Panchayat Edge | Unaware of exact jurisdictional boundaries (MCC Ward vs. Gram Panchayat); pitch-black roads at night | Automated zero-reporting detection with immediate municipal dispatch and proof transparency |
| MCC & Panchayat Ward Engineers | Overwhelmed by duplicate complaints and disputed boundary incidents | Auto-routed incidents verified with locked Retinex photo proofs and exact GPS polygons |
| Sanitation & Fleet Workers | Operating garbage collection trucks across city routes | Real-time dashcam vision node running autonomously at 30 FPS without manual input |

**Local context we designed for:** Dual MCC Ward & Gram Panchayat Shapely GeoJSON boundary polygons, zero-light monsoon nights using 5-Stage Retinex + CLAHE enhancement, zero video streaming delay, and localized Kannada/English ward authority mapping.

## 3. Solution Overview

**Clean Mysuru** is an edge-AI civic monitoring platform that combines ROS 2 dashcam stream ingestion, PyTorch YOLOv8 object detection, 5-Stage Retinex low-light vision enhancement, Shapely spatial jurisdiction routing, and a zero-flicker React + Leaflet glassmorphic web dashboard.

**Core flow:**
1. Dashcam / ROS 2 node streams raw video (`/dashcam/image_raw`) from municipal vehicles at 30 FPS.
2. Vision Core evaluates lighting conditions; if pitch dark, it triggers 5-Stage Retinex + CLAHE enhancement before running YOLOv8 detection.
3. Jurisdiction Router matches GPS coordinates against Mysuru boundary polygons and Nominatim reverse geocoding to assign exact municipal ownership.
4. Municipal officers view incidents on the interactive Detections Console, verify authenticity using locked photo proofs, assign crew dispatches, and save decisions locally/cloud-synced.

## 4. Architecture

`ROS 2 (Humble) Image Publisher -> PyTorch YOLOv8 + 5-Stage Retinex Vision Engine -> Python HTTP API (Port 5000) -> HTML5 Canvas 2D React PWA + Leaflet Maps.`

➡️ Diagram, components, data model and APIs: **[docs/architecture.md](./docs/architecture.md)**

## 5. Tech Stack & AI Usage

**Stack:** `React 18 · Vite · TailwindCSS · Leaflet Maps · ROS 2 Humble · Python 3.10 · PyTorch · OpenCV · Ultralytics YOLOv8 · Shapely` (full rationale in [docs/architecture.md](./docs/architecture.md#tech-stack))

**AI tools used in development:** `Google Antigravity AI, GitHub Copilot`
**AI inside the product:** `PyTorch YOLOv8 Medium (yolov8m.pt) multi-class detection (Waste, Debris, Person, Vehicle) + 5-Stage Retinex Zero-DCE Curve Fitting for low-light enhancement.`

➡️ Full disclosure: **[ai.md](./ai.md)**

## 6. Decision Log (Summary)

- **Chose:** HTML5 Canvas 2D frame rendering over native React `<img>` src polling.
- **Because:** Direct canvas drawing eliminates DOM unmounting flicker and screen blinking during 40ms stream refreshes.
- **First thing to break at city scale:** Nominatim reverse-geocoding API rate limits under multi-vehicle simultaneous streaming (mitigated via local Shapely GeoJSON boundary polygons).

➡️ Full decision log: **[resource.md](./resource.md#4-submission-artifacts-google-drive)** · Template: **[decision-log-template.md](./resource-templates/decision-log-template.md)**

## 7. Setup & Run

```bash
git clone https://github.com/Rajat1657/clean-mysuru.git && cd clean-mysuru
./start_all.sh
```

➡️ Prerequisites, environment variables, seed data and offline testing: **[docs/setup.md](./docs/setup.md)**

## 8. Known Limitations

- YOLOv8 Medium relies on CUDA GPU for optimal 30 FPS inference; falls back to 12 FPS on CPU.
- Reverse geocoding requires initial internet connection before falling back to cached Shapely GeoJSON polygons.
- Video stream simulation requires OpenCV video file input or connected USB webcam `/dev/video0`.

➡️ Full list, edge cases and scaling roadmap: **[docs/limitations.md](./docs/limitations.md)**

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Rajat M | Lead Systems Architect & Vision Engineer (ROS 2, YOLOv8, Retinex Vision Engine) | [@Rajat1657](https://github.com/Rajat1657) |
| Siddartha Sivakumar | Lead Frontend Developer & Geospatial Architect (React Dashboard, Leaflet Routing) | [@hotice301](https://github.com/hotice301) |

## License

MIT License. You retain full ownership of your code.
