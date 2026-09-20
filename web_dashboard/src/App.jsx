import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, Activity, Eye, MapPin, Sliders, CheckCircle2, 
  XCircle, Clock, AlertTriangle, Cpu, Camera, RefreshCw, 
  Filter, Search, Layers, FileText, ChevronRight, Check, Save, Trash2, List,
  Wifi, WifiOff, UploadCloud, PlusCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Accurate, standalone Mysore Palace Architectural Outline SVG
const MysorePalaceLogo = () => (
  <svg className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 88 H95 M5 92 H95" strokeWidth="1.5" />
    <path d="M8 88 V70 C8 63 16 63 16 70 V88" />
    <path d="M20 88 V70 C20 63 28 63 28 70 V88" />
    <path d="M32 88 V70 C32 63 40 63 40 70 V88" />
    <path d="M44 88 V66 C44 58 56 58 56 66 V88" strokeWidth="2.8" />
    <path d="M60 88 V70 C60 63 68 63 68 70 V88" />
    <path d="M72 88 V70 C72 63 80 63 80 70 V88" />
    <path d="M84 88 V70 C84 63 92 63 92 70 V88" />
    <path d="M10 63 H90 M10 48 H90" />
    <path d="M14 63 V48 M24 63 V48 M34 63 V48 M44 63 V48 M56 63 V48 M66 63 V48 M76 63 V48 M86 63 V48" strokeWidth="1.2" />
    <path d="M40 48 C40 22 60 22 60 48 Z" fill="currentColor" fillOpacity="0.25" strokeWidth="2.5" />
    <path d="M50 22 V14 M50 14 L47 18 M50 14 L53 18" strokeWidth="2" />
    <circle cx="50" cy="12" r="2.5" fill="currentColor" />
    <path d="M12 48 C12 34 26 34 26 48 Z" fill="currentColor" fillOpacity="0.18" />
    <path d="M19 34 V28" />
    <circle cx="19" cy="26" r="1.5" fill="currentColor" />
    <path d="M74 48 C74 34 88 34 88 48 Z" fill="currentColor" fillOpacity="0.18" />
    <path d="M81 34 V28" />
    <circle cx="81" cy="26" r="1.5" fill="currentColor" />
  </svg>
);

// Inline Vector Leaflet Icons for 100% Offline Map Marker Support
const createSvgMarker = (color) => L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<svg width="30" height="42" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="#090D16"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -38]
});

const redIcon = createSvgMarker('#EF4444');
const orangeIcon = createSvgMarker('#F97316');

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

// Initial Mock Seed Data for Mysuru Wards (Used if localStorage is empty)
const DEFAULT_INITIAL_DATA = {
  live_feed: {
    lat: 12.3052,
    lon: 76.6552,
    jurisdiction: "Ward 14 (Devaraja Market)",
    is_night_mode: true,
    brightness: 18.5,
    tally: { "ILLEGAL DUMPING DEBRIS": 3, "PLASTIC BOTTLES": 5, "STREET LITTER": 2 }
  },
  incidents: [
    {
      incident_id: "INC-MYS-0891",
      jurisdiction: "Ward 14 (Devaraja Market)",
      lat: 12.3052,
      lon: 76.6552,
      urgency_score: 42.5,
      waste_volume: 0.38,
      occurrences: 14,
      verification_status: "Pending Verification",
      status: "Detected",
      officer_notes: "Patrol vehicle #4 identified accumulation near flower market.",
      first_detected: "2026-09-20 13:40:12",
      last_updated: "2026-09-20 14:15:00"
    },
    {
      incident_id: "INC-MYS-0888",
      jurisdiction: "Ward 08 (Chamundi Hill Rd)",
      lat: 12.2980,
      lon: 76.6650,
      urgency_score: 28.0,
      waste_volume: 0.19,
      occurrences: 8,
      verification_status: "Verified Real Anomaly",
      status: "In Progress (Crew Dispatched)",
      officer_notes: "Cleanliness squad dispatched under Work Order #802.",
      first_detected: "2026-09-20 11:20:05",
      last_updated: "2026-09-20 13:50:22"
    },
    {
      incident_id: "INC-MYS-0875",
      jurisdiction: "Ward 22 (Gokulam 3rd Stage)",
      lat: 12.3210,
      lon: 76.6280,
      urgency_score: 15.2,
      waste_volume: 0.08,
      occurrences: 5,
      verification_status: "Verified Real Anomaly",
      status: "Resolved (Cleaned)",
      officer_notes: "Sanitation team completed clearance and photo verification logged.",
      first_detected: "2026-09-20 09:10:44",
      last_updated: "2026-09-20 10:30:15"
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('live');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('clean_mysuru_alerts');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return DEFAULT_INITIAL_DATA;
  });

  const [savedIncidentId, setSavedIncidentId] = useState(null);
  const [selectedWard, setSelectedWard] = useState('All');
  const [minUrgency, setMinUrgency] = useState(0);
  const [verifFilter, setVerifFilter] = useState('All');
  const [workflowTab, setWorkflowTab] = useState('Active Operational');
  const [publicTab, setPublicTab] = useState('Unresolved');
  const [searchQuery, setSearchQuery] = useState('');

  const rawCanvasRef = useRef(null);
  const enhancedCanvasRef = useRef(null);

  // Online / Offline Listeners & Auto-Sync Engine
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushOfflineSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("📴 Offline Mode Active: Detections logged to local storage!");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [data]);

  const showToast = (msg) => {
    setSyncStatusMsg(msg);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const saveToOfflineQueue = (payload) => {
    const queue = JSON.parse(localStorage.getItem('clean_mysuru_sync_queue') || '[]');
    queue.push({ timestamp: new Date().toISOString(), payload });
    localStorage.setItem('clean_mysuru_sync_queue', JSON.stringify(queue));
  };

  const flushOfflineSyncQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('clean_mysuru_sync_queue') || '[]');
    if (queue.length === 0) return;

    showToast(`🔄 Syncing ${queue.length} offline log(s) to cloud backend...`);
    try {
      const res = await fetch('http://localhost:5000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        localStorage.removeItem('clean_mysuru_sync_queue');
        showToast("✅ Offline detection logs successfully synced to server!");
      }
    } catch (e) {
      console.log("Cloud server offline, queue retained in LocalStorage.");
    }
  };

  // Synthetic Live AI Stream Canvas Generator for Offline / Local demo execution
  const drawOfflineSimulatedCamera = (time) => {
    const rCanvas = rawCanvasRef.current;
    const eCanvas = enhancedCanvasRef.current;
    if (!rCanvas || !eCanvas) return;

    const rCtx = rCanvas.getContext('2d');
    const eCtx = eCanvas.getContext('2d');
    if (!rCtx || !eCtx) return;

    const width = 480;
    const height = 270;
    rCanvas.width = width; rCanvas.height = height;
    eCanvas.width = width; eCanvas.height = height;

    // Draw dark road & curb background
    rCtx.fillStyle = '#0F172A';
    rCtx.fillRect(0, 0, width, height);
    rCtx.fillStyle = '#1E293B';
    rCtx.fillRect(0, height * 0.55, width, height * 0.45);
    
    // Draw lane lines
    rCtx.strokeStyle = '#475569';
    rCtx.setLineDash([15, 15]);
    rCtx.lineWidth = 3;
    rCtx.beginPath();
    rCtx.moveTo(width / 2, height * 0.55);
    rCtx.lineTo(width / 2, height);
    rCtx.stroke();

    // Copy raw feed to enhanced feed canvas
    eCtx.drawImage(rCanvas, 0, 0);

    // Enhanced Feed: AI Night Enhancement Shader effect + Bounding Boxes
    eCtx.fillStyle = 'rgba(14, 165, 233, 0.08)';
    eCtx.fillRect(0, 0, width, height);

    // Dynamic moving bounding box
    const boxX = 140 + Math.sin(time / 1000) * 15;
    const boxY = 120 + Math.cos(time / 1200) * 5;

    // Draw YOLO Bounding Box on Enhanced Stream
    eCtx.strokeStyle = '#00FFCC';
    eCtx.lineWidth = 2.5;
    eCtx.setLineDash([]);
    eCtx.strokeRect(boxX, boxY, 110, 80);

    // Label tag
    eCtx.fillStyle = '#00FFCC';
    eCtx.fillRect(boxX, boxY - 22, 165, 22);
    eCtx.fillStyle = '#000000';
    eCtx.font = 'bold 11px monospace';
    eCtx.fillText('ILLEGAL DEBRIS 94%', boxX + 4, boxY - 6);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/alerts');
      if (res.ok) {
        const json = await res.json();
        
        if (json.live_feed?.raw_frame_b64 && rawCanvasRef.current) {
          const img1 = new Image();
          img1.src = `data:image/jpeg;base64,${json.live_feed.raw_frame_b64}`;
          img1.onload = () => {
            const ctx1 = rawCanvasRef.current?.getContext('2d');
            if (ctx1) {
              rawCanvasRef.current.width = img1.width;
              rawCanvasRef.current.height = img1.height;
              ctx1.drawImage(img1, 0, 0);
            }
          };
        }

        if (json.live_feed?.enhanced_frame_b64 && enhancedCanvasRef.current) {
          const img2 = new Image();
          img2.src = `data:image/jpeg;base64,${json.live_feed.enhanced_frame_b64}`;
          img2.onload = () => {
            const ctx2 = enhancedCanvasRef.current?.getContext('2d');
            if (ctx2) {
              enhancedCanvasRef.current.width = img2.width;
              enhancedCanvasRef.current.height = img2.height;
              ctx2.drawImage(img2, 0, 0);
            }
          };
        }

        setData(prev => {
          const prevIncStr = JSON.stringify(prev.incidents);
          const newIncStr = JSON.stringify(json.incidents || []);
          if (prevIncStr === newIncStr) return { ...prev, live_feed: { ...prev.live_feed, ...json.live_feed } };
          return json;
        });
        localStorage.setItem('clean_mysuru_alerts', JSON.stringify(json));
      } else {
        drawOfflineSimulatedCamera(Date.now());
      }
    } catch (e) {
      // Offline fallback: draw animated client AI camera stream
      drawOfflineSimulatedCamera(Date.now());
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 100);
    return () => clearInterval(interval);
  }, []);

  const updateIncident = async (incidentId, newVerif, newStatus, newNotes) => {
    const updatedIncidents = data.incidents.map(inc => {
      if (inc.incident_id === incidentId) {
        return {
          ...inc,
          verification_status: newVerif,
          status: newStatus,
          officer_notes: newNotes,
          last_updated: new Date().toLocaleString()
        };
      }
      return inc;
    });

    const updatedData = { ...data, incidents: updatedIncidents };
    setData(updatedData);
    localStorage.setItem('clean_mysuru_alerts', JSON.stringify(updatedData));
    saveToOfflineQueue(updatedData);

    setSavedIncidentId(incidentId);
    setTimeout(() => setSavedIncidentId(null), 2500);

    if (navigator.onLine) {
      try {
        await fetch('http://localhost:5000/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        showToast("✅ Decision saved & synced to cloud backend!");
      } catch (e) {
        showToast("💾 Saved locally in browser storage (Sync queue ready)");
      }
    } else {
      showToast("📴 Saved in Offline Storage! Will auto-sync when online.");
    }
  };

  const deleteIncident = async (incidentId) => {
    const updatedIncidents = data.incidents.filter(inc => inc.incident_id !== incidentId);
    const updatedData = { ...data, incidents: updatedIncidents };
    setData(updatedData);
    localStorage.setItem('clean_mysuru_alerts', JSON.stringify(updatedData));
    saveToOfflineQueue(updatedData);

    if (navigator.onLine) {
      try {
        await fetch('http://localhost:5000/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        showToast("🗑️ Incident removed and synced.");
      } catch (e) {
        showToast("🗑️ Removed locally in offline mode.");
      }
    } else {
      showToast("🗑️ Incident deleted locally. (Queued for sync)");
    }
  };

  const triggerOfflineDetectionLog = () => {
    const newId = `INC-MYS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInc = {
      incident_id: newId,
      jurisdiction: "Ward 12 (KRS Road)",
      lat: 12.3120 + (Math.random() - 0.5) * 0.01,
      lon: 76.6400 + (Math.random() - 0.5) * 0.01,
      urgency_score: Math.floor(20 + Math.random() * 35),
      waste_volume: 0.25,
      occurrences: 1,
      verification_status: "Pending Verification",
      status: "Detected",
      officer_notes: "Logged via local mobile patrol camera detection engine.",
      first_detected: new Date().toLocaleString(),
      last_updated: new Date().toLocaleString()
    };

    const updatedIncidents = [newInc, ...data.incidents];
    const updatedData = { ...data, incidents: updatedIncidents };
    setData(updatedData);
    localStorage.setItem('clean_mysuru_alerts', JSON.stringify(updatedData));
    saveToOfflineQueue(updatedData);
    showToast(`⚡ New Anomaly Logged: ${newId} (Saved to Local Storage)`);
  };

  const liveFeed = data.live_feed || {};
  const incidents = data.incidents || [];
  const tally = liveFeed.tally || { "ILLEGAL DUMPING DEBRIS": 3, "PLASTIC BOTTLES": 5 };

  const filteredIncidents = incidents.filter(inc => {
    if (selectedWard !== 'All' && inc.jurisdiction !== selectedWard) return false;
    if ((inc.urgency_score || 0) < minUrgency) return false;
    if (verifFilter !== 'All' && inc.verification_status !== verifFilter) return false;
    
    const incStatus = inc.status || 'Detected';
    if (workflowTab === 'Active Operational' && incStatus === 'Resolved (Cleaned)') return false;
    if (workflowTab === 'Unattended' && incStatus !== 'Detected') return false;
    if (workflowTab === 'In Progress' && incStatus !== 'In Progress (Crew Dispatched)') return false;
    if (workflowTab === 'Resolved' && incStatus !== 'Resolved (Cleaned)') return false;
    
    if (searchQuery && !inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) && !inc.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const centerLat = liveFeed.lat || 12.3052;
  const centerLon = liveFeed.lon || 76.6552;
  const isNight = liveFeed.is_night_mode !== undefined ? liveFeed.is_night_mode : true;
  const brightness = liveFeed.brightness || 18.5;

  const countUnattended = incidents.filter(i => (i.status || 'Detected') === 'Detected').length;
  const countInProgress = incidents.filter(i => i.status === 'In Progress (Crew Dispatched)').length;
  const countResolved = incidents.filter(i => i.status === 'Resolved (Cleaned)').length;
  const countActiveOperational = countUnattended + countInProgress;

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Sync Notification */}
      {syncStatusMsg && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold shadow-2xl animate-fadeIn flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          {syncStatusMsg}
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MysorePalaceLogo />
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
            onClick={() => setActiveTab('public')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'public' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-4 h-4" /> Public Detections List
          </button>
          <button
            onClick={() => setActiveTab('detections')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'detections' 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Admin Console
            {incidents.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold">
                {incidents.length}
              </span>
            )}
          </button>
        </div>

        {/* Telemetry & Offline Status Badge */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online (Cloud Sync Active)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode (Local Storage & Auto-Sync)</span>
            </div>
          )}

          <button
            onClick={triggerOfflineDetectionLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Log Anomaly Spot</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">

        {/* TAB 1: LIVE OPERATIONS */}
        {activeTab === 'live' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment Mode</span>
                <div className="mt-3 flex items-center gap-2">
                  {isNight ? (
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                      🌙 Night Mode (AI Brightening Active)
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-2">
                      ☀️ Daylight Mode
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-2">Ambient Light: {brightness} Lux</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Incidents</span>
                <span className="text-3xl font-extrabold text-cyan-400 mt-2">{incidents.length}</span>
                <span className="text-[11px] text-slate-500 mt-1">Unique Verified Detections</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">High Priority Alerts</span>
                <span className="text-3xl font-extrabold text-rose-500 mt-2">
                  {incidents.filter(i => (i.urgency_score || 0) >= 30).length}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Immediate Action Required</span>
              </div>

              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Duplicate Shield</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {incidents.reduce((sum, i) => sum + (i.occurrences || 1), 0)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">Frames Consolidated</span>
              </div>
            </div>

            {/* Dual Video Stream & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-cyan-400" /> Live Vehicle Dashcam Feed
                    </h3>
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Real-time 30 FPS Stream
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">Standard Dashcam Feed</span>
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
                        <canvas ref={rawCanvasRef} className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400">AI Detection Feed (Enhanced)</span>
                      <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
                        <canvas ref={enhancedCanvasRef} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Object Radar Ticker */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> Live Object Radar:
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(tally).length > 0 ? (
                      Object.entries(tally).map(([objLabel, count], idx) => (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                            objLabel.includes('ILLEGAL') || objLabel.includes('DEBRIS')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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

              {/* Map Tracker */}
              <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-cyan-400" /> Mysuru City Incident Map
                  </h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Current Vehicle Jurisdiction</span>
                  <div className="text-sm font-bold text-cyan-300">
                    {liveFeed.jurisdiction || 'Ward 14 (Devaraja Market)'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Coordinates: ({centerLat}, {centerLon})
                  </div>
                </div>

                <div className="w-full h-[360px] min-h-[360px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
                  <MapContainer 
                    center={[centerLat, centerLon]} 
                    zoom={13} 
                    scrollWheelZoom={true} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <MapResizer center={`${centerLat}_${centerLon}`} />
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
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

        {/* TAB 2: ADMIN DETECTIONS CONSOLE */}
        {activeTab === 'detections' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-800">
              <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 flex-1 flex-wrap">
                <button
                  onClick={() => setWorkflowTab('Active Operational')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    workflowTab === 'Active Operational'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active Operational ({countActiveOperational})
                </button>

                <button
                  onClick={() => setWorkflowTab('Unattended')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    workflowTab === 'Unattended'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" /> Unattended / Detected
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-rose-300 font-extrabold text-[11px]">
                    {countUnattended}
                  </span>
                </button>

                <button
                  onClick={() => setWorkflowTab('In Progress')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    workflowTab === 'In Progress'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-black'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Clock className="w-4 h-4" /> In Progress (Crew Dispatched)
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-extrabold text-[11px]">
                    {countInProgress}
                  </span>
                </button>

                <button
                  onClick={() => setWorkflowTab('Resolved')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    workflowTab === 'Resolved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black'
                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Resolved Archive
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-emerald-300 font-extrabold text-[11px]">
                    {countResolved}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-cyan-400" /> Incident Management Filters
                </h3>
                <span className="text-xs text-slate-400">Showing {filteredIncidents.length} of {incidents.length} Incident(s)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                
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

              </div>
            </div>

            {/* Incidents List */}
            {filteredIncidents.length > 0 ? (
              <div className="space-y-6">
                {filteredIncidents.map((inc, idx) => {
                  const iid = inc.incident_id;
                  const vStatus = inc.verification_status || 'Pending Verification';
                  const status = inc.status || 'Detected';
                  const proof3 = inc.proof_bbox_b64 || inc.enhanced_frame_b64;

                  return (
                    <div key={idx} className="glass-panel p-6 rounded-2xl space-y-5">
                      
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

                      <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                        <div><b>First Detected:</b> {inc.first_detected}</div>
                        <div><b>Last Updated:</b> {inc.last_updated}</div>
                        <div><b>Stationary Frames Filtered:</b> <span className="text-emerald-400 font-bold">{inc.occurrences} frames</span></div>
                        <div><b>Debris Volume Ratio:</b> {((inc.waste_volume || 0.2) * 100).toFixed(1)}%</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 flex flex-col">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-cyan-400" /> Detection Proof
                          </span>
                          <div className="flex-1 aspect-video min-h-[220px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                            {proof3 ? (
                              <img src={`data:image/jpeg;base64,${proof3}`} alt="Detection Proof" className="w-full h-full object-cover" />
                            ) : (
                              <div className="p-6 text-center space-y-2">
                                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                                <span className="text-xs text-slate-400 block font-semibold">Live Camera Detection Active</span>
                                <span className="text-[11px] text-slate-500 block">Coordinates & Bounding Boxes Saved</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 flex flex-col">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-rose-400" /> Location Spot on Map
                          </span>
                          <div className="flex-1 aspect-video min-h-[220px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
                            <MapContainer 
                              center={[inc.lat || centerLat, inc.lon || centerLon]} 
                              zoom={15} 
                              scrollWheelZoom={true} 
                              style={{ height: '100%', width: '100%' }}
                            >
                              <MapResizer center={`${inc.lat || centerLat}_${inc.lon || centerLon}`} />
                              <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker 
                                position={[inc.lat || centerLat, inc.lon || centerLon]}
                                icon={(inc.urgency_score || 0) >= 30 ? redIcon : orangeIcon}
                              >
                                <Popup>
                                  <div className="text-xs font-sans text-slate-900 font-bold">
                                    {iid} - {inc.jurisdiction}
                                  </div>
                                </Popup>
                              </Marker>
                            </MapContainer>
                          </div>
                        </div>
                      </div>

                      {/* Official Verification Controls */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Official Action Controls</span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateIncident(iid, vStatus, status, inc.officer_notes || '')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                                savedIncidentId === iid 
                                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30' 
                                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                              }`}
                            >
                              {savedIncidentId === iid ? (
                                <>
                                  <Check className="w-4 h-4" /> Saved & Synced!
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" /> Save Decision
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => deleteIncident(iid)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">1. Verify Authenticity</label>
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

                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">2. Assign Workflow Status</label>
                            <div className="flex flex-col gap-2">
                              {[
                                { label: 'Detected', val: 'Detected' },
                                { label: 'In Progress (Crew Dispatched)', val: 'In Progress (Crew Dispatched)' },
                                { label: 'Resolved (Cleaned)', val: 'Resolved (Cleaned)' }
                              ].map((stOpt, stIdx) => (
                                <button
                                  key={stIdx}
                                  onClick={() => updateIncident(iid, vStatus, stOpt.val, inc.officer_notes || '')}
                                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all flex items-center justify-between ${
                                    status === stOpt.val 
                                      ? 'bg-teal-600 text-white border border-teal-400' 
                                      : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  <span>{stOpt.label}</span>
                                  {status === stOpt.val && <Check className="w-4 h-4 text-white" />}
                                </button>
                              ))}
                            </div>

                            <div className="pt-2 space-y-1">
                              <label className="text-xs font-semibold text-slate-300">3. Officer Audit Notes</label>
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

        {/* TAB 3: PUBLIC DETECTIONS LIST */}
        {activeTab === 'public' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-cyan-400" /> Public Detections Feed
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Live transparent view of all city detections and resolution status.</p>
              </div>

              <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPublicTab('Unresolved')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    publicTab === 'Unresolved'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                      : 'text-rose-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" /> Unresolved ({countActiveOperational})
                </button>
                <button
                  onClick={() => setPublicTab('Resolved')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                    publicTab === 'Resolved'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-black'
                      : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Resolved ({countResolved})
                </button>
              </div>
            </div>

            {incidents.filter(i => publicTab === 'Resolved' ? i.status === 'Resolved (Cleaned)' : i.status !== 'Resolved (Cleaned)').length > 0 ? (
              <div className="space-y-6">
                {incidents
                  .filter(i => publicTab === 'Resolved' ? i.status === 'Resolved (Cleaned)' : i.status !== 'Resolved (Cleaned)')
                  .map((inc, idx) => {
                    const iid = inc.incident_id;
                    const vStatus = inc.verification_status || 'Pending Verification';
                    const status = inc.status || 'Detected';
                    const proof3 = inc.proof_bbox_b64 || inc.enhanced_frame_b64;

                    return (
                      <div key={idx} className="glass-panel p-6 rounded-2xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-extrabold text-white">{iid}</h3>
                            <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                              {inc.jurisdiction}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                              status === 'Resolved (Cleaned)' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              status === 'In Progress (Crew Dispatched)' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                          <div><b>First Detected:</b> {inc.first_detected}</div>
                          <div><b>Last Updated:</b> {inc.last_updated}</div>
                          <div><b>Authenticity:</b> <span className="text-cyan-300 font-semibold">{vStatus}</span></div>
                          {inc.officer_notes && <div><b>Action Note:</b> <span className="text-slate-200 italic">{inc.officer_notes}</span></div>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 flex flex-col">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Camera className="w-4 h-4 text-cyan-400" /> Detection Snapshot
                            </span>
                            <div className="flex-1 aspect-video min-h-[200px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
                              {proof3 ? (
                                <img src={`data:image/jpeg;base64,${proof3}`} alt="Detection Snapshot" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs text-slate-500 font-semibold">Live Camera Detection Active</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 flex flex-col">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-rose-400" /> Location Map
                            </span>
                            <div className="flex-1 aspect-video min-h-[200px] rounded-xl overflow-hidden border border-slate-800 relative z-0">
                              <MapContainer 
                                center={[inc.lat || centerLat, inc.lon || centerLon]} 
                                zoom={15} 
                                scrollWheelZoom={true} 
                                style={{ height: '100%', width: '100%' }}
                              >
                                <MapResizer center={`${inc.lat || centerLat}_${inc.lon || centerLon}`} />
                                <TileLayer
                                  attribution='&copy; OpenStreetMap'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker 
                                  position={[inc.lat || centerLat, inc.lon || centerLon]}
                                  icon={(inc.urgency_score || 0) >= 30 ? redIcon : orangeIcon}
                                >
                                  <Popup>
                                    <div className="text-xs font-sans text-slate-900 font-bold">
                                      {iid} - {inc.jurisdiction}
                                    </div>
                                  </Popup>
                                </Marker>
                              </MapContainer>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center rounded-2xl text-slate-400 text-sm">
                No {publicTab.toLowerCase()} detections logged.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
