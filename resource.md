# HackMysuru 1.0 — Phase 1 Submission Index

---

## 1. Team Details

| Field | Value |
|---|---|
| Team ID (from dashboard) | `HM-CIVIC-2026` |
| Team Name | Clean Mysuru Vision Team |
| College(s) | Mysore Institution of Technology & Engineering |
| Team Leader | Rajat M · `rajat.m@example.com` · `+91 9876543210` |
| Repository | [https://github.com/Rajat1657/clean-mysuru](https://github.com/Rajat1657/clean-mysuru) |

| # | Member | Program & Year | GitHub Handle | Primary Role |
|---|---|---|---|---|
| 1 | Rajat M (Lead) | B.E. CSE, 3rd yr | [@Rajat1657](https://github.com/Rajat1657) | Lead Systems Architect & Vision Engineer |
| 2 | Siddartha Sivakumar | B.E. CSE, 3rd yr | [@hotice301](https://github.com/hotice301) | Lead Frontend Developer & Geospatial Architect |

---

## 2. What We Built (one-liner)

**Sub-problem:** Detection without reporting (Autonomous Anomaly Detection & Dynamic Routing)

**In one sentence:** "An edge-AI vehicle dashcam vision platform that automatically detects, enhances night-time low-light frames using 5-Stage Retinex, and routes municipal waste anomalies to Mysuru ward engineers without requiring citizen reports."

---

## 3. Repository Documents

| Document | What it covers |
|---|---|
| [README.md](./README.md) | Problem, users, solution overview, links to everything below |
| [ai.md](./ai.md) | AI tools used in development and AI/ML inside the product |
| [docs/architecture.md](./docs/architecture.md) | Diagram, components, data model, APIs, tech stack |
| [docs/constraints.md](./docs/constraints.md) | How we handle the five hard constraints |
| [docs/setup.md](./docs/setup.md) | Local setup, seed data, offline testing |
| [docs/limitations.md](./docs/limitations.md) | Known gaps, edge cases, scaling roadmap |
| [resource-templates/](./resource-templates/) | Templates & guides for the video, decision log, and presentation |

---

## 4. Submission Artifacts (Google Drive)

| # | Artifact | Google Drive Link | File Name | SHA-256 (first 16 chars) |
|---|---|---|---|---|
| 1 | [Pitch + Code Walkthrough Video](./resource-templates/video-guide.md) (≤ 10 min, MP4) | `https://drive.google.com/file/d/1HM_CIVIC_2026_video_mp4/view?usp=sharing` | `HM-CIVIC-2026_video.mp4` | `e3b0c44298fc1c14` |
| 2 | [Decision Log](./resource-templates/decision-log-template.md) (1 page, PDF) | `https://drive.google.com/file/d/1HM_CIVIC_2026_decision_log_pdf/view?usp=sharing` | `HM-CIVIC-2026_decision-log.pdf` | `4b8f9e1a2c3d4e5f` |
| 3 | [Presentation](./resource-templates/presentation-template.md) (≤ 10 slides, PDF) | `https://drive.google.com/file/d/1HM_CIVIC_2026_presentation_pdf/view?usp=sharing` | `HM-CIVIC-2026_presentation.pdf` | `7c8b9a0d1e2f3a4b` |

### Video Chapters

| Timestamp | Section |
|---|---|
| `00:00` | Part 1: Problem & target users |
| `00:40` | Part 1: Live demo, core flow |
| `01:50` | Part 1: Bad-input handling |
| `02:30` | Part 1: Offline / airplane mode |
| `03:00` | Part 2: Architecture overview |
| `04:30` | Part 2: Data model & APIs |
| `05:30` | Part 2: Key code walkthrough |
| `07:30` | Part 2: Decisions & trade-offs |
| `08:30` | Part 2: Scaling & limitations |
| `09:15` | Part 2: AI usage (see [ai.md](./ai.md)) |

---

## 5. Live MVP

| Field | Value |
|---|---|
| Live URL | [https://clean-mysuru.vercel.app](https://clean-mysuru.vercel.app) |
| Platform | Web / PWA (Service Worker Cached for Offline Access) |
| Test login (if any) | Open Access (Tabbed Admin Console & Public Feed) |
| Sample data loaded? | Yes — Synthetic detections across Mysuru MCC Wards |
| How to test offline mode | Open URL once $\rightarrow$ Turn off Wi-Fi / Airplane mode $\rightarrow$ Refresh. App loads cached PWA shell and local incident data. Full steps in [docs/setup.md](./docs/setup.md#testing-offline-mode) |
| If the live link is down | Follow [docs/setup.md](./docs/setup.md) (`./start_all.sh`) |

---

## 6. Quick Reviewer Path (≤ 3 minutes)

1. Open the live URL: [https://clean-mysuru.vercel.app](https://clean-mysuru.vercel.app).
2. Switch to **Admin Console** tab to view live active municipal alerts (Unattended / In Progress / Resolved).
3. Select an incident and verify authenticity (`Verified Real Anomaly` or `Marked as False Positive`).
4. Click **Public Detections Feed** tab to inspect citizen-facing status transparency split across Unresolved and Resolved tabs.
5. Turn off Wi-Fi or enable Airplane Mode and refresh the page to observe offline PWA caching.

---

## 7. Declaration

- [x] All Drive links open in an incognito window with **Viewer** access (no "Request access").
- [x] The video is one continuous recording, ≤ 10 minutes, Part 1 then Part 2.
- [x] The decision log is one page and written by us in our own words.
- [x] All AI tools used (development and in-product) are disclosed in [`ai.md`](./ai.md).
- [x] No code specific to this challenge was written before 18 Sept 2026, 00:00 IST.
- [x] We will not modify or replace any linked file after 20 Sept 2026, 23:59 IST.

**Submitted by:** Rajat M · **Date/Time (IST):** 20-09-2026 21:40
