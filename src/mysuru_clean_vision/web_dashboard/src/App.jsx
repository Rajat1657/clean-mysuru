import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Eye, MapPin, Sliders, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Cpu, Camera, RefreshCw, 
  Filter, Search, Layers, FileText, ChevronRight, Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Mysore Palace Architectural Outline SVG Component
const MysorePalaceLogo = () => (
  <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Base Foundation */}
    <path d="M10 85 H90 V90 H10 Z" fill="currentColor" fillOpacity="0.1" />
    {/* Lower Arches Arcade */}
    <path d="M15 85 V65 H85 V85" />
    <path d="M20 85 V72 C20 68 28 68 28 72 V85" />
    <path d="M34 85 V72 C34 68 42 68 42 72 V85" />
    <path d="M48 85 V68 C48 62 52 62 52 68 V85" />
    <path d="M58 85 V72 C58 68 66 68 66 72 V85" />
    <path d="M72 85 V72 C72 68 80 68 80 72 V85" />
    {/* Middle Story & Pillars */}
    <path d="M18 65 V45 H82 V65" />
    <path d="M25 65 V50 M35 65 V50 M45 65 V50 M55 65 V50 M65 65 V50 M75 65 V50" strokeWidth="1.5" />
    {/* Central Grand Dome */}
    <path d="M42 45 C42 25 58 25 58 45 Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M50 25 V18" />
    <circle cx="50" cy="16" r="2" fill="currentColor" />
    {/* Left Flank Dome */}
    <path d="M15 45 C15 32 28 32 28 45 Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M21.5 32 V27" />
    {/* Right Flank Dome */}
    <path d="M72 45 C72 32 85 32 85 45 Z" fill="currentColor" fillOpacity="0.15" />
    <path d="M78.5 32 V27" />
  </svg>
);

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapResizer({ center }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map, center]);
  return null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [data, setData] = useState({ live_feed: {}, incidents: [] });
  const [loading, setLoading] = useState(true);

  const [selectedWard, setSelectedWard] = useState('All');
  const [minUrgency, setMinUrgency] = useState(0);
  const [verifFilter, setVerifFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // connecting
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 100); // 100ms polling for smooth stream
    return () => clearInterval(interval);
  }, []);

  const updateIncident = async (incidentId, newVerif, newStatus, newNotes) => {
    const updatedIncidents = data.incidents.map(inc => {
      if (inc.incident_id === incidentId) {
        return {
          ...inc,
          verification_status: newVerif,
          status: newStatus,
          officer_notes: newNotes
        };
      }
      return inc;
    });

    const updatedData = { ...data, incidents: updatedIncidents };
    setData(updatedData);

    try {
      await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
    } catch (e) {
      console.error("Failed to save update:", e);
    }
  };

  const liveFeed = data.live_feed || {};
  const incidents = data.incidents || [];
  const tally = liveFeed.tally || {};

  const filteredIncidents = incidents.filter(inc => {
    if (selectedWard !== 'All' && inc.jurisdiction !== selectedWard) return false;
    if ((inc.urgency_score || 0) < minUrgency) return false;
    if (verifFilter !== 'All' && inc.verification_status !== verifFilter) return false;
    if (statusFilter !== 'All' && inc.status !== statusFilter) return false;
    if (searchQuery && !inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) && !inc.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const centerLat = liveFeed.lat || 13.0895;
  const centerLon = liveFeed.lon || 80.2739;
  const isNight = liveFeed.is_night_mode || false;
  const brightness = liveFeed.brightness || 0.0;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      
      {/* HEADER NAVBAR WITH MYSORE PALACE OUTLINE LOGO */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <MysorePalaceLogo />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Clean Mysuru
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'live' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" /> Live Operations
          </button>
          <button
            onClick={() => setActiveTab('detections')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'detections' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Detections Console
            {incidents.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
                {incidents.length}
              </span>
            )}
          </button>
        </div>

        {/* System Telemetry Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-emerald"></span>
            ROS 2 Node Online
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            5-Stage Retinex Vision Core
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: LIVE OPERATIONS */}
        {activeTab === 'live' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lighting State</span>
                <div className="mt-3 flex items-center gap-2">
                  {isNight ? (
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                      🌙 NIGHT MODE (Bilateral Denoise Active)
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2">
                      ☀️ DAYLIGHT MODE (CLAHE Bypassed)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Luminance: {brightness} Lux</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unique Deduplicated Incidents</span>
                <span className="text-3xl font-extrabold text-cyan-400 mt-2">{incidents.length}</span>
                <span className="text-[11px] text-slate-500 mt-1">Spatial-Temporal Window (20s)</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High Priority Anomalies</span>
                <span className="text-3xl font-extrabold text-rose-500 mt-2">
                  {incidents.filter(i => (i.urgency_score || 0) >= 30).length}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Urgency Threshold ≥ 30</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stationary Frames Filtered</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {incidents.reduce((sum, i) => sum + (i.occurrences || 1), 0)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Truck lingering prevention</span>
              </div>
            </div>

            {/* Live Camera Feed & Interactive Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Dual Stream Video Feed */}
              <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" /> Real-Time Dashcam Stream & Vision Core
                    </h3>
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      30 FPS Ultra Stream
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">Raw Input Camera Stream</span>
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                        {liveFeed.raw_frame_b64 ? (
                          <img src={`data:image/jpeg;base64,${liveFeed.raw_frame_b64}`} alt="Raw Stream" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500 animate-pulse">Connecting to /dashcam/image_raw...</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">Vision Core Output (5-Stage Retinex)</span>
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                        {liveFeed.enhanced_frame_b64 ? (
                          <img src={`data:image/jpeg;base64,${liveFeed.enhanced_frame_b64}`} alt="Vision Output" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500 animate-pulse">Processing vision core output...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE OBJECT DETECTION TALLY TICKER (Under Camera Stream) */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> Live Detection Tally:
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(tally).length > 0 ? (
                      Object.entries(tally).map(([objLabel, count], idx) => (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                            objLabel.includes('ILLEGAL') || objLabel.includes('DEBRIS')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : objLabel.includes('PERSON')
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          <span>{objLabel}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-950 font-black text-white">{count}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 font-semibold px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
                        0 Objects Detected
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Leaflet Map & GPS Location */}
              <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" /> Municipal Location Telemetry
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Active GPS Jurisdiction</span>
                  <div className="text-sm font-bold text-cyan-300">
                    {liveFeed.jurisdiction || 'Detecting Live Micro-Jurisdiction...'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Coordinates: ({centerLat}, {centerLon})
                  </div>
                </div>

                {/* Leaflet Map Component with scrollWheelZoom and auto-invalidateSize */}
                <div className="w-full h-[360px] min-h-[360px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
                  <MapContainer 
                    center={[centerLat, centerLon]} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapResizer center={`${centerLat}_${centerLon}`} />
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {incidents.map((inc, i) => (
                      <Marker 
                        key={i} 
                        position={[inc.lat || centerLat, inc.lon || centerLon]}
                        icon={(inc.urgency_score || 0) >= 30 ? redIcon : orangeIcon}
                      >
                        <Popup>
                          <div className="text-xs text-slate-900 font-sans space-y-1">
                            <div className="font-bold text-sm">{inc.incident_id}</div>
                            <div><b>Authority:</b> {inc.jurisdiction}</div>
                            <div><b>Urgency:</b> {inc.urgency_score}</div>
                            <div><b>Status:</b> {inc.status}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: DETECTIONS CONSOLE */}
        {activeTab === 'detections' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Filter Bar */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-cyan-400" /> Incident Management & Verification Filters
                </h3>
                <span className="text-xs text-slate-400">Showing {filteredIncidents.length} of {incidents.length} Incident(s)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Search */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Search Incident ID / Ward</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Ward Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Jurisdiction / Ward</label>
                  <select
                    value={selectedWard}
                    onChange={e => setSelectedWard(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="All">All Jurisdictions</option>
                    {[...new Set(incidents.map(i => i.jurisdiction))].map((w, idx) => (
                      <option key={idx} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* Verification Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Verification Status</label>
                  <select
                    value={verifFilter}
                    onChange={e => setVerifFilter(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="All">All Verifications</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Verified Real Anomaly">Verified Real Anomaly</option>
                    <option value="Marked as False Positive (YOLO Misdetection)">Marked as False Positive</option>
                  </select>
                </div>

                {/* Workflow Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Workflow Status</label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Detected">Detected</option>
                    <option value="In Progress (Crew Dispatched)">In Progress (Crew Dispatched)</option>
                    <option value="Resolved (Cleaned)">Resolved (Cleaned)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Incident Cards List */}
            {filteredIncidents.length > 0 ? (
              <div className="space-y-6">
                {filteredIncidents.map((inc, idx) => {
                  const iid = inc.incident_id;
                  const vStatus = inc.verification_status || 'Pending Verification';
                  const status = inc.status || 'Detected';

                  const proof1 = inc.proof_raw_b64 || inc.raw_frame_b64;
                  const proof2 = inc.proof_enhanced_b64 || inc.enhanced_frame_b64;
                  const proof3 = inc.proof_bbox_b64 || inc.enhanced_frame_b64;

                  return (
                    <div key={idx} className="glass-panel p-6 rounded-2xl space-y-5">
                      
                      {/* Incident Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-extrabold text-white">{iid}</h3>
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                            (inc.urgency_score || 0) >= 30 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            URGENCY: {inc.urgency_score}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                            {inc.jurisdiction}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                            vStatus === 'Verified Real Anomaly' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            vStatus === 'Marked as False Positive (YOLO Misdetection)' ? 'bg-slate-700/50 text-slate-300 border border-slate-600' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {vStatus}
                          </span>
                          <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                            STATUS: {status}
                          </span>
                        </div>
                      </div>

                      {/* Details Meta */}
                      <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                        <div><b>First Detected:</b> {inc.first_detected}</div>
                        <div><b>Last Updated:</b> {inc.last_updated}</div>
                        <div><b>Stationary Frames Filtered:</b> <span className="text-emerald-400 font-bold">{inc.occurrences} frames</span></div>
                        <div><b>Debris Volume Ratio:</b> {(inc.waste_volume * 100).toFixed(1)}%</div>
                      </div>

                      {/* 3 Photo Proofs Gallery */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Multi-Frame Photo Proofs (Locked Detection Moment)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold">Proof 1: Raw Dashcam Capture (No Box)</span>
                            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                              {proof1 ? (
                                <img src={`data:image/jpeg;base64,${proof1}`} alt="Proof 1 Raw" className="w-full h-full object-cover" />
                              ) : <span className="text-xs text-slate-600 p-4 block">No image</span>}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold">Proof 2: 5-Stage Retinex View (No Box)</span>
                            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                              {proof2 ? (
                                <img src={`data:image/jpeg;base64,${proof2}`} alt="Proof 2 Enhanced Clean" className="w-full h-full object-cover" />
                              ) : <span className="text-xs text-slate-600 p-4 block">No image</span>}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-semibold">Proof 3: YOLO Bounding Box Overlay</span>
                            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                              {proof3 ? (
                                <img src={`data:image/jpeg;base64,${proof3}`} alt="Proof 3 Bounding Box" className="w-full h-full object-cover" />
                              ) : <span className="text-xs text-slate-600 p-4 block">No image</span>}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Official Verification & Workflow Action Controls */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Official Action & Verification Controls</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Verification Radio */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">1. Verify Detection Authenticity</label>
                            <div className="flex flex-col gap-2">
                              {[
                                'Pending Verification',
                                'Verified Real Anomaly',
                                'Marked as False Positive (YOLO Misdetection)'
                              ].map((option, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => updateIncident(iid, option, status, inc.officer_notes || '')}
                                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                                    vStatus === option 
                                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400' 
                                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  <span>{option}</span>
                                  {vStatus === option && <Check className="w-4 h-4 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Workflow Status Dropdown */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">2. Assign Progress Workflow</label>
                            <select
                              value={status}
                              onChange={e => updateIncident(iid, vStatus, e.target.value, inc.officer_notes || '')}
                              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                            >
                              <option value="Detected">Detected</option>
                              <option value="In Progress (Crew Dispatched)">In Progress (Crew Dispatched)</option>
                              <option value="Resolved (Cleaned)">Resolved (Cleaned)</option>
                            </select>

                            <div className="pt-2 space-y-1">
                              <label className="text-xs font-semibold text-slate-300">3. Officer Dispatch / Audit Notes</label>
                              <input
                                type="text"
                                placeholder="Add notes (e.g. Crew #4 dispatched at 08:30)..."
                                value={inc.officer_notes || ''}
                                onChange={e => updateIncident(iid, vStatus, status, e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 text-sm">
                No detection records matching active filter criteria.
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
