import os
import json
import time
import base64
import streamlit as st
import folium
from streamlit_folium import st_folium

st.set_page_config(
    page_title="Mysuru Clean Vision | Edge AI Ops",
    page_icon="🏙️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Neumorphic Dark UI Theme CSS
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

data = load_data()
live_feed = data.get('live_feed', {})
incidents = data.get('incidents', [])

# Header section
st.markdown("""
<div class="neu-card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h2 style="margin:0; color:#F8FAFC;">🏙️ Mysuru Clean Vision : Autonomous Anomaly Operations</h2>
            <p style="margin:4px 0 0 0; color:#94A3B8; font-size:0.9rem;">
                Sub-Problem 5: Detection Without Reporting | Dynamic Micro-Jurisdiction Edge AI
            </p>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# ----------------------------------------------------
# STABLE, 100% UN-REFRESHED WATERMARK-FREE MAP
# ----------------------------------------------------
col_map, col_console = st.columns([6, 6])

with col_map:
    st.subheader("🗺️ Municipal Jurisdiction Map (Watermark-Free & Zero Refresh)")

    center_lat = live_feed.get('lat', 13.0895)
    center_lon = live_feed.get('lon', 80.2739)

    # Use clean, 100% free OpenStreetMap tiles with ZERO API key watermarks
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
            <b>Detections Filtered:</b> {inc.get('occurrences')}x
        </div>
        """
        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_content, max_width=280),
            tooltip=f"{inc.get('incident_id')} | {inc.get('jurisdiction')}",
            icon=folium.Icon(color="red" if inc.get('urgency_score', 0)>=30 else "orange", icon="warning", prefix="fa")
        ).add_to(m)

    # Render static map with fixed key so it NEVER reloads or flickers
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


# ----------------------------------------------------
# LIVE STREAM FRAGMENT (Only camera feed updates live)
# ----------------------------------------------------
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

# ----------------------------------------------------
# INCIDENT CONSOLE & FILTERS
# ----------------------------------------------------
st.markdown("---")
st.subheader("📊 Municipal Operations Incident Console & Filters")

f_col1, f_col2, f_col3 = st.columns(3)

with f_col1:
    wards = ["All Wards / Jurisdictions"] + list(set(i.get('jurisdiction', '') for i in incidents if i.get('jurisdiction')))
    selected_ward = st.selectbox("Filter by Municipal Jurisdiction / Area", wards)

with f_col2:
    min_urgency = st.slider("Minimum Urgency Threshold", 0, 100, 0)

with f_col3:
    status_filter = st.selectbox("Incident Status", ["All Statuses", "Active", "In Progress", "Resolved"])

filtered_incidents = incidents
if selected_ward != "All Wards / Jurisdictions":
    filtered_incidents = [i for i in filtered_incidents if i.get('jurisdiction') == selected_ward]

filtered_incidents = [i for i in filtered_incidents if i.get('urgency_score', 0) >= min_urgency]

if status_filter != "All Statuses":
    filtered_incidents = [i for i in filtered_incidents if i.get('status') == status_filter]

if len(filtered_incidents) > 0:
    for inc in filtered_incidents:
        urg_badge = f'<span class="badge-urgency-high">URGENCY: {inc.get("urgency_score")}</span>' if inc.get("urgency_score", 0)>=30 else f'<span class="badge-urgency-med">URGENCY: {inc.get("urgency_score")}</span>'
        ward_badge = f'<span class="badge-ward">{inc.get("jurisdiction")}</span>'

        st.markdown(f"""
        <div class="neu-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin:0; color:#F1F5F9;">{inc.get("incident_id")} | {urg_badge} &nbsp; {ward_badge}</h4>
                    <p style="margin:8px 0 0 0; color:#94A3B8; font-size:0.9rem;">
                        <b>First Detected:</b> {inc.get("first_detected")} &nbsp;|&nbsp; 
                        <b>Last Updated:</b> {inc.get("last_updated")} &nbsp;|&nbsp; 
                        <b>Stationary Frames Filtered:</b> <span style="color:#10B981; font-weight:bold;">{inc.get("occurrences")} frames</span> &nbsp;|&nbsp; 
                        <b>Debris Volume Ratio:</b> {inc.get("waste_volume", 0)*100:.1f}%
                    </p>
                </div>
                <div>
                    <span style="background:#0F766E; color:#99F6E4; padding:4px 12px; border-radius:12px; font-weight:600; font-size:0.85rem;">STATUS: {inc.get("status", "Active")}</span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
else:
    st.info("No incident records match the selected filter criteria.")
