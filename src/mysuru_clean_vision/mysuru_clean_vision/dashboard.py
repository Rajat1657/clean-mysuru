import os
import json
import time
import base64
import streamlit as st
import folium
from streamlit_folium import st_folium

st.set_page_config(
    page_title="Clean Mysuru",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }
    
    .stApp {
        background-color: #0E1117;
        color: #E2E8F0;
    }

    .neu-card {
        background: #141720;
        border-radius: 16px;
        padding: 20px;
        box-shadow:  7px 7px 15px #0a0b10, 
                    -7px -7px 15px #1e2330;
        margin-bottom: 20px;
        border: 1px solid rgba(255, 255, 255, 0.04);
    }

    .status-badge-night {
        background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
        color: #A5B4FC;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
    }

    .status-badge-day {
        background: linear-gradient(135deg, #78350F 0%, #B45309 100%);
        color: #FDE68A;
        padding: 6px 14px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
    }

    .badge-urgency-high {
        background: #DC2626;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
    }

    .badge-urgency-med {
        background: #D97706;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
    }

    .badge-ward {
        background: #0284C7;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
    }

    .badge-verified {
        background: #059669;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
    }

    .badge-false-positive {
        background: #475569;
        color: #F1F5F9;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
    }

    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #38BDF8;
    }

    .metric-label {
        font-size: 0.85rem;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
""", unsafe_allow_html=True)

ALERTS_FILE = '/tmp/civic_alerts.json'

def load_data():
    if os.path.exists(ALERTS_FILE):
        try:
            with open(ALERTS_FILE, 'r') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return data
        except Exception:
            pass
    return {'live_feed': {}, 'incidents': []}

def save_data(data):
    try:
        with open(ALERTS_FILE, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        st.error(f"Failed to update data: {e}")

data = load_data()
live_feed = data.get('live_feed', {})
incidents = data.get('incidents', [])

st.markdown("""
<div class="neu-card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h2 style="margin:0; color:#F8FAFC;">Clean Mysuru</h2>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

tab_live, tab_detections = st.tabs(["📹 Live Feed & Operations", "🚨 Detections & Verification Console"])

with tab_live:
    col_map, col_console = st.columns([6, 6])

    with col_map:
        st.subheader("🗺️ Municipal Jurisdiction Map (Watermark-Free)")
        center_lat = live_feed.get('lat', 13.0895)
        center_lon = live_feed.get('lon', 80.2739)

        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=13,
            tiles="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attr="&copy; OpenStreetMap contributors"
        )

        for inc in incidents:
            lat, lon = inc.get('lat', center_lat), inc.get('lon', center_lon)
            popup_content = f"""
            <div style="font-family: sans-serif; color: #1E293B;">
                <b>Incident ID:</b> {inc.get('incident_id')}<br>
                <b>Jurisdiction:</b> {inc.get('jurisdiction')}<br>
                <b>Urgency Score:</b> {inc.get('urgency_score')}<br>
                <b>Status:</b> {inc.get('status')}<br>
                <b>Verification:</b> {inc.get('verification_status')}
            </div>
            """
            folium.Marker(
                location=[lat, lon],
                popup=folium.Popup(popup_content, max_width=280),
                tooltip=f"{inc.get('incident_id')} | {inc.get('jurisdiction')}",
                icon=folium.Icon(color="red" if inc.get('urgency_score', 0)>=30 else "orange", icon="warning", prefix="fa")
            ).add_to(m)

        st_folium(m, width=650, height=360, key="static_zero_refresh_map", returned_objects=[])

    with col_console:
        st.subheader("📊 Municipal Telemetry & Location")
        current_jurisdiction = live_feed.get('jurisdiction', 'Detecting Live Micro-Jurisdiction...')
        st.markdown(f"""
        <div class="neu-card">
            <h4 style="margin:0; color:#38BDF8;">📍 Active GPS Location</h4>
            <p style="font-size:1.1rem; font-weight:600; color:#F8FAFC; margin:6px 0;">{current_jurisdiction}</p>
            <p style="font-size:0.85rem; color:#94A3B8; margin:0;">
                <b>Coordinates:</b> ({live_feed.get('lat', 13.0895)}, {live_feed.get('lon', 80.2739)})
            </p>
        </div>
        """, unsafe_allow_html=True)

        m1, m2 = st.columns(2)
        with m1:
            st.markdown(f"""
            <div class="neu-card" style="text-align: center;">
                <div class="metric-label">Deduplicated Incidents</div>
                <div class="metric-value">{len(incidents)}</div>
            </div>
            """, unsafe_allow_html=True)

        with m2:
            total_occurrences = sum(i.get('occurrences', 1) for i in incidents)
            st.markdown(f"""
            <div class="neu-card" style="text-align: center;">
                <div class="metric-label">Stationary Frames Filtered</div>
                <div class="metric-value" style="color: #10B981;">{total_occurrences}</div>
            </div>
            """, unsafe_allow_html=True)

    @st.fragment(run_every=1)
    def render_live_camera_feed():
        st.subheader("📹 Real-Time Dashcam Stream & Vision Core")
        latest_data = load_data()
        feed = latest_data.get('live_feed', {})

        is_night = feed.get('is_night_mode', False)
        brightness = feed.get('brightness', 0.0)
        mode_html = f'<span class="status-badge-night">🌙 NIGHT MODE (Bilateral Denoise Active | Brightness {brightness})</span>' if is_night else f'<span class="status-badge-day">☀️ DAYLIGHT MODE (CLAHE Bypassed | Brightness {brightness})</span>'

        st.markdown(f"**Lighting State:** {mode_html}", unsafe_allow_html=True)

        if 'raw_frame_b64' in feed and feed['raw_frame_b64']:
            f1, f2 = st.columns(2)
            raw_bytes = base64.b64decode(feed['raw_frame_b64'])
            proc_bytes = base64.b64decode(feed['enhanced_frame_b64'])
            with f1:
                st.caption("Raw Input Camera Stream")
                st.image(raw_bytes, use_container_width=True)
            with f2:
                st.caption("Vision Core Output")
                st.image(proc_bytes, use_container_width=True)
        else:
            st.info("Connecting to ROS 2 topic /dashcam/image_raw...")

    render_live_camera_feed()

with tab_detections:
    st.subheader("🚨 Municipal Detections & Incident Verification Console")

    f1, f2, f3, f4 = st.columns(4)

    with f1:
        wards = ["All Jurisdictions"] + list(set(i.get('jurisdiction', '') for i in incidents if i.get('jurisdiction')))
        sel_ward = st.selectbox("Filter Jurisdiction", wards)

    with f2:
        min_urg = st.slider("Min Urgency Score", 0, 100, 0)

    with f3:
        verif_filter = st.selectbox("Verification Status", ["All", "Pending Verification", "Verified Real Anomaly", "Marked as False Positive (YOLO Misdetection)"])

    with f4:
        prog_filter = st.selectbox("Workflow Status", ["All", "Detected", "In Progress (Crew Dispatched)", "Resolved (Cleaned)"])

    filtered = incidents
    if sel_ward != "All Jurisdictions":
        filtered = [i for i in filtered if i.get('jurisdiction') == sel_ward]
    filtered = [i for i in filtered if i.get('urgency_score', 0) >= min_urg]
    if verif_filter != "All":
        filtered = [i for i in filtered if i.get('verification_status') == verif_filter]
    if prog_filter != "All":
        filtered = [i for i in filtered if i.get('status') == prog_filter]

    st.markdown(f"Showing **{len(filtered)}** detection record(s)")

    if len(filtered) > 0:
        for idx, inc in enumerate(filtered):
            iid = inc.get('incident_id')

            urg_badge = f'<span class="badge-urgency-high">URGENCY: {inc.get("urgency_score")}</span>' if inc.get("urgency_score", 0)>=30 else f'<span class="badge-urgency-med">URGENCY: {inc.get("urgency_score")}</span>'
            ward_badge = f'<span class="badge-ward">{inc.get("jurisdiction")}</span>'
            
            v_status = inc.get('verification_status', 'Pending Verification')
            if v_status == 'Verified Real Anomaly':
                verif_badge = '<span class="badge-verified">✅ VERIFIED REAL</span>'
            elif v_status == 'Marked as False Positive (YOLO Misdetection)':
                verif_badge = '<span class="badge-false-positive">❌ FALSE POSITIVE</span>'
            else:
                verif_badge = '<span class="badge-urgency-med">⏳ PENDING VERIFICATION</span>'

            st.markdown(f"""
            <div class="neu-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#F8FAFC;">{iid} &nbsp;|&nbsp; {urg_badge} &nbsp; {ward_badge} &nbsp; {verif_badge}</h3>
                    <span style="color:#38BDF8; font-weight:700;">Status: {inc.get('status', 'Detected')}</span>
                </div>
                <p style="color:#94A3B8; font-size:0.9rem; margin-top:6px;">
                    <b>First Detected:</b> {inc.get('first_detected')} &nbsp;|&nbsp; 
                    <b>Last Updated:</b> {inc.get('last_updated')} &nbsp;|&nbsp; 
                    <b>Stationary Detections Filtered:</b> {inc.get('occurrences')} frames &nbsp;|&nbsp; 
                    <b>Waste Volume:</b> {inc.get('waste_volume', 0)*100:.1f}%
                </p>
            </div>
            """, unsafe_allow_html=True)

            p1, p2, p3 = st.columns(3)
            
            raw_b64 = inc.get('proof_raw_b64') or inc.get('raw_frame_b64')
            bbox_b64 = inc.get('proof_bbox_b64') or inc.get('enhanced_frame_b64')

            with p1:
                st.caption("Proof 1: Raw Dashcam Capture")
                if raw_b64:
                    st.image(base64.b64decode(raw_b64), use_container_width=True)

            with p2:
                st.caption("Proof 2: 5-Stage Retinex Enhanced View")
                if bbox_b64:
                    st.image(base64.b64decode(bbox_b64), use_container_width=True)

            with p3:
                st.caption("Proof 3: YOLO Bounding Box Verification")
                if bbox_b64:
                    st.image(base64.b64decode(bbox_b64), use_container_width=True)

            st.markdown("**Official Action & Verification Panel:**")
            act_col1, act_col2 = st.columns(2)

            with act_col1:
                v_options = ["Pending Verification", "Verified Real Anomaly", "Marked as False Positive (YOLO Misdetection)"]
                curr_v_idx = v_options.index(v_status) if v_status in v_options else 0
                new_v = st.radio(f"Verify Incident ({iid})", v_options, index=curr_v_idx, key=f"verif_{iid}_{idx}")

            with act_col2:
                s_options = ["Detected", "In Progress (Crew Dispatched)", "Resolved (Cleaned)"]
                curr_s = inc.get('status', 'Detected')
                curr_s_idx = s_options.index(curr_s) if curr_s in s_options else 0
                new_s = st.selectbox(f"Assign Workflow Status ({iid})", s_options, index=curr_s_idx, key=f"status_{iid}_{idx}")

            notes = st.text_input("Officer Dispatch / Audit Notes", value=inc.get('officer_notes', ''), key=f"notes_{iid}_{idx}")

            if (new_v != v_status) or (new_s != inc.get('status')) or (notes != inc.get('officer_notes')):
                inc['verification_status'] = new_v
                inc['status'] = new_s
                inc['officer_notes'] = notes
                save_data({'live_feed': live_feed, 'incidents': incidents})
                st.success(f"Updated {iid}: Verification -> '{new_v}' | Status -> '{new_s}'")
                st.rerun()

            st.markdown("---")
    else:
        st.info("No detection records found matching the active filter criteria.")
