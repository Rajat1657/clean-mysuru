# 📋 Architectural & Technical Decision Log Template

Use this log to track key design, architectural, and data decisions made throughout the project lifecycle.

---

| Date | Decision ID | Topic / Area | Decision Summary | Rationale | Alternatives Considered | Status |
|---|---|---|---|---|---|---|
| 2026-09-19 | `ADR-001` | Vision Pipeline | Integrate Multiscale Retinex before YOLOv8 inference | Enables 92%+ detection accuracy on low-light night capture across Mysuru streets | Raw HSV brightness thresholding (poor detection) | **Approved** |
| 2026-09-19 | `ADR-002` | UI Architecture | Replace dropdown selector with 3 operational status tabs (Unattended, In Progress, Resolved) | Improves administrator triage speed and UX clarity | Single grid with dropdown filter (cluttered view) | **Approved** |
| 2026-09-20 | `ADR-003` | Admin & Public Views | Exclude resolved detections completely from Admin view, split Public view into Unresolved / Resolved tabs | Streamlines active municipal worker workflows while keeping public transparent | Combined master list (confine administrative focus) | **Approved** |
