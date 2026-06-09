import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, QrCode, LogIn, LogOut, AlertTriangle, Radio, RefreshCw, Search, X, Camera, CameraOff } from "lucide-react";
import api from "@/services/api";
import logo from "@/assets/logo.png";
import { QRScanner } from "@/components/ui/QRScanner";
import toast from "react-hot-toast";

interface OccupancyData {
  total_inside: number;
  visitors: number;
  interviews: number;
  meetings: number;
  contractors: number;
  vendors: number;
  temp_employees: number;
}

export default function SecurityOps() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"scan" | "checkin" | "checkout" | "blacklist" | "emergency">("scan");
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [time, setTime] = useState(new Date());
  
  // Scanner / Verification states
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [liveScanning, setLiveScanning] = useState(false);

  const handleQRScanSuccess = async (decodedText: string) => {
    let cleanText = decodedText.trim();
    if (cleanText.startsWith("VISIT_ID:")) {
      cleanText = cleanText.replace("VISIT_ID:", "").trim();
    }
    setScanInput(cleanText);
    setLiveScanning(false);
    toast.success(`Scanned Code: ${cleanText}`);
    
    // Automatically trigger verification
    setIsScanning(true);
    setScanError("");
    setScanResult(null);
    try {
      let url = `/api/search/latest-pass?pass_number=${encodeURIComponent(cleanText)}`;
      const digitsOnly = cleanText.replace(/\D/g, "");
      if (digitsOnly.length >= 10 && (cleanText.startsWith("+") || /^\d+$/.test(cleanText))) {
        url = `/api/search/latest-pass?phone=${encodeURIComponent(cleanText)}`;
      }
      
      const res = await api.get(url);
      if (res.data.found) {
        setScanResult(res.data.pass);
      } else {
        setScanError(`No active pass found for: ${cleanText}`);
      }
    } catch (err: any) {
      setScanError("Scan verification failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };
  
  // Directory Lists states
  const [pendingCheckins, setPendingCheckins] = useState<any[]>([]);
  const [checkedInVisitors, setCheckedInVisitors] = useState<any[]>([]);
  const [listFilterQuery, setListFilterQuery] = useState("");
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Blacklist states
  const [blacklistQuery, setBlacklistQuery] = useState("");
  const [blacklistResult, setBlacklistResult] = useState<any>(null);
  
  // Emergency states
  const [musterData, setMusterData] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<any>(null);
  
  const [gateNumber, setGateNumber] = useState("Gate 1");

  // Keep Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live counts inside the plant
  const fetchOccupancy = async () => {
    try {
      const res = await api.get("/api/occupancy/live");
      setOccupancy(res.data);
    } catch (err) {
      console.error("Occupancy fetch failed", err);
    }
  };

  // Fetch approved & inside lists for the gate directory
  const fetchLists = async () => {
    setIsLoadingLists(true);
    try {
      const [visitsRes, visitorsRes, meetingsRes, interviewsRes] = await Promise.all([
        api.get("/api/visitors/visits"),
        api.get("/api/visitors/"),
        api.get("/api/meetings/"),
        api.get("/api/interviews/")
      ]);

      const visitorsMap = new Map();
      if (Array.isArray(visitorsRes.data)) {
        visitorsRes.data.forEach((v: any) => {
          visitorsMap.set(v.id, v);
        });
      }

      const pending: any[] = [];
      const checkedIn: any[] = [];

      // 1. Map visits
      if (Array.isArray(visitsRes.data)) {
        visitsRes.data.forEach((visit: any) => {
          const visitor = visitorsMap.get(visit.visitor_id) || {};
          const mappedVisit = {
            id: visit.id,
            card_id: visit.card_id || `VISIT-${visit.id}`,
            visitor_name: visitor.full_name || "Unknown",
            company: visitor.company || "N/A",
            phone: visitor.phone_number || "",
            purpose: visit.purpose || "N/A",
            host_employee: visit.host_employee || "N/A",
            pass_type: visit.pass_type || "VISITOR_PASS",
            status: visit.status,
            check_in_time: visit.check_in_time,
            check_out_time: visit.check_out_time,
            gate_number: visit.gate_number
          };

          if (visit.status === "APPROVED" && !visit.check_in_time) {
            pending.push(mappedVisit);
          } else if (visit.check_in_time && !visit.check_out_time) {
            checkedIn.push(mappedVisit);
          }
        });
      }

      // 2. Map meetings
      if (Array.isArray(meetingsRes.data)) {
        meetingsRes.data.forEach((meeting: any) => {
          const mappedMeeting = {
            id: meeting.id,
            card_id: meeting.pass_number || `MTG-${meeting.id}`,
            visitor_name: meeting.visitor_name || "Unknown",
            company: meeting.company_name || "N/A",
            phone: meeting.visitor_mobile || "",
            purpose: meeting.title || "N/A",
            host_employee: meeting.host_employee || "N/A",
            pass_type: "MEETING_PASS",
            status: meeting.status,
            check_in_time: meeting.check_in_time,
            check_out_time: meeting.check_out_time,
            gate_number: meeting.entry_gate || meeting.exit_gate
          };

          if (meeting.status === "APPROVED" && !meeting.check_in_time) {
            pending.push(mappedMeeting);
          } else if (meeting.status === "Checked-In" || (meeting.check_in_time && !meeting.check_out_time)) {
            checkedIn.push(mappedMeeting);
          }
        });
      }

      // 3. Map interviews
      if (Array.isArray(interviewsRes.data)) {
        interviewsRes.data.forEach((interview: any) => {
          const mappedInterview = {
            id: interview.id,
            card_id: interview.pass_number || `INT-${interview.id}`,
            visitor_name: interview.candidate_name || "Unknown",
            company: "Candidate",
            phone: interview.candidate_mobile || "",
            purpose: `Interview: ${interview.position}`,
            host_employee: interview.interviewer_name || "N/A",
            pass_type: "INTERVIEW_PASS",
            status: interview.status,
            check_in_time: interview.check_in_time,
            check_out_time: interview.check_out_time,
            gate_number: interview.entry_gate || interview.exit_gate
          };

          if (interview.status === "APPROVED" && !interview.check_in_time) {
            pending.push(mappedInterview);
          } else if (interview.status === "Checked-In" || (interview.check_in_time && !interview.check_out_time)) {
            checkedIn.push(mappedInterview);
          }
        });
      }

      setPendingCheckins(pending);
      setCheckedInVisitors(checkedIn);
    } catch (err) {
      console.error("Failed to fetch lists", err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  // Fetch Muster evacuation list
  const fetchMuster = async () => {
    try {
      const res = await api.get("/api/emergency/muster");
      setMusterData(res.data);
    } catch (err) {
      console.error("Muster fetch failed", err);
    }
  };

  // Fetch Emergency Alarm Active status
  const fetchAlertStatus = async () => {
    try {
      const res = await api.get("/api/emergency/alert");
      setActiveAlerts(res.data);
    } catch (err) {
      console.error("Alert status fetch failed", err);
    }
  };

  // Live Sync Effect
  useEffect(() => {
    fetchOccupancy();
    fetchLists();

    const interval = setInterval(() => {
      fetchOccupancy();
      if (activeTab === "checkin" || activeTab === "checkout") {
        fetchLists();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Special poll for Emergency Tab
  useEffect(() => {
    if (activeTab === "emergency") {
      fetchMuster();
      fetchAlertStatus();
      const intv = setInterval(() => {
        fetchMuster();
        fetchAlertStatus();
      }, 5000);
      return () => clearInterval(intv);
    }
  }, [activeTab]);

  // QR / Code Scanner input submit handler
  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setIsScanning(true);
    setScanError("");
    setScanResult(null);
    try {
      let url = `/api/search/latest-pass?pass_number=${encodeURIComponent(scanInput.trim())}`;
      const digitsOnly = scanInput.replace(/\D/g, "");
      if (digitsOnly.length >= 10 && (scanInput.startsWith("+") || /^\d+$/.test(scanInput))) {
        url = `/api/search/latest-pass?phone=${encodeURIComponent(scanInput.trim())}`;
      }

      const res = await api.get(url);
      if (res.data.found) {
        setScanResult(res.data.pass);
      } else {
        setScanError("No active pass found for this ID.");
      }
    } catch (err: any) {
      setScanError("Scan verification failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  // Handle confirm check-in
  const handleCheckIn = async (passId: number) => {
    try {
      const type = scanResult?.pass_type;
      if (type === "INTERVIEW_PASS") {
        await api.post(`/api/interviews/${passId}/checkin`, { gate_number: gateNumber });
        toast.success("Interview Candidate checked in!");
      } else if (type === "MEETING_PASS") {
        await api.post(`/api/meetings/${passId}/checkin`, { gate_number: gateNumber });
        toast.success("Meeting Visitor checked in!");
      } else {
        await api.put(`/api/visitors/checkin/${passId}`);
        toast.success("Visitor checked in!");
      }
      setScanResult(null);
      setScanInput("");
      fetchOccupancy();
      fetchLists();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Check-in failed";
      setScanError(msg);
      toast.error(msg);
    }
  };

  // Handle confirm check-out
  const handleCheckOut = async (passId: number) => {
    try {
      const type = scanResult?.pass_type;
      if (type === "INTERVIEW_PASS") {
        await api.post(`/api/interviews/${passId}/checkout`, { gate_number: gateNumber });
        toast.success("Interview Candidate checked out!");
      } else if (type === "MEETING_PASS") {
        await api.post(`/api/meetings/${passId}/checkout`, { gate_number: gateNumber });
        toast.success("Meeting Visitor checked out!");
      } else {
        await api.put(`/api/visitors/checkout/${passId}`);
        toast.success("Visitor checked out!");
      }
      setScanResult(null);
      setScanInput("");
      fetchOccupancy();
      fetchLists();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Check-out failed";
      setScanError(msg);
      toast.error(msg);
    }
  };

  // Trigger Evacuation alarm
  const handleEmergencyTrigger = async (type: "FIRE" | "GAS_LEAK" | "GENERAL", action: "TRIGGER" | "CLEAR") => {
    try {
      const message = action === "TRIGGER"
        ? `EMERGENCY ALERT: ${type} evacuation protocol initiated at ${gateNumber}!`
        : `Emergency alert cleared at ${gateNumber}.`;

      const res = await api.post("/api/emergency/broadcast", {
        type,
        action,
        message
      });

      if (res.data.success) {
        setActiveAlerts(res.data.state);
        if (action === "TRIGGER") {
          toast.error(`${type} Evacuation Broadcast Triggered!`, { duration: 5000 });
        } else {
          toast.success("Emergency Alerts Cleared.");
        }
      }
    } catch (err) {
      console.error("Evacuation broadcast failed", err);
      toast.error("Failed to update emergency alarm state");
    }
  };

  // Blacklist query handler
  const handleBlacklistCheck = async () => {
    if (!blacklistQuery.trim()) return;
    try {
      const res = await api.post(`/api/blacklist/check?identifier=${blacklistQuery.trim()}`);
      setBlacklistResult(res.data);
    } catch (err) {
      setBlacklistResult({ is_blacklisted: false, error: true });
    }
  };

  // Click on a row to verify the pass
  const selectPass = (item: any) => {
    setScanResult(item);
    setScanInput(item.card_id);
    setScanError("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/security-login");
  };

  const statusColor: Record<string, string> = {
    APPROVED: "text-green-400 border-green-500/50 bg-green-900/20",
    PENDING: "text-yellow-400 border-yellow-500/50 bg-yellow-900/20",
    CHECKED_IN: "text-blue-400 border-blue-500/50 bg-blue-900/20",
    CHECKED_OUT: "text-slate-400 border-slate-500/50 bg-slate-900/20",
    "Checked-In": "text-blue-400 border-blue-500/50 bg-blue-900/20",
    "Checked-Out": "text-slate-400 border-slate-500/50 bg-slate-900/20",
    REJECTED: "text-red-400 border-red-500/50 bg-red-900/20",
  };

  const tabs = [
    { id: "scan", label: "QR Verify", icon: QrCode },
    { id: "checkin", label: "Check-In", icon: LogIn },
    { id: "checkout", label: "Check-Out", icon: LogOut },
    { id: "blacklist", label: "Blacklist", icon: AlertTriangle },
    { id: "emergency", label: "Emergency", icon: Radio },
  ] as const;

  // Filters for lists
  const filteredPendingCheckins = pendingCheckins.filter(item =>
    item.visitor_name.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.card_id.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.company.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.phone.toLowerCase().includes(listFilterQuery.toLowerCase())
  );

  const filteredCheckedInVisitors = checkedInVisitors.filter(item =>
    item.visitor_name.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.card_id.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.company.toLowerCase().includes(listFilterQuery.toLowerCase()) ||
    item.phone.toLowerCase().includes(listFilterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* Blinking Emergency Bar */}
      {activeAlerts && (activeAlerts.fire_alert || activeAlerts.gas_leak_alert || activeAlerts.general_alert) && (
        <div className="bg-red-650 text-white font-bold py-2.5 px-4 text-center text-xs tracking-wider flex items-center justify-center gap-2 animate-pulse sticky top-0 z-[60] bg-red-700 shadow-md">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>CRITICAL SITE ALARM ACTIVE: {activeAlerts.alert_message || "IMMEDIATE EVACUATION IN PROGRESS!"}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-[#0A1628]/90 backdrop-blur-xl border-b border-[#1A2E4A] px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logo} alt="IGL" className="h-8 w-auto" />
          <div>
            <span className="text-[#F7931E] text-xs font-bold tracking-widest uppercase">IGLGATE</span>
            <p className="text-white font-black text-sm leading-none">Security Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-mono text-xs">LIVE</span>
          </div>
          <span className="text-slate-400 font-mono text-xs sm:text-sm">{time.toLocaleTimeString("en-IN")}</span>
          <select
            value={gateNumber}
            onChange={(e) => setGateNumber(e.target.value)}
            className="bg-[#0A1628] border border-[#1A2E4A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option>Gate 1</option>
            <option>Gate 2</option>
            <option>Gate 3</option>
            <option>Gate 4 (Emergency)</option>
          </select>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Occupancy Strip */}
        {occupancy && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "TOTAL INSIDE", value: occupancy.total_inside, color: "text-[#F7931E]" },
              { label: "VISITORS", value: occupancy.visitors, color: "text-blue-400" },
              { label: "INTERVIEWS", value: occupancy.interviews, color: "text-purple-400" },
              { label: "MEETINGS", value: occupancy.meetings, color: "text-cyan-400" },
              { label: "CONTRACTORS", value: occupancy.contractors, color: "text-yellow-400" },
              { label: "VENDORS", value: occupancy.vendors, color: "text-emerald-400" },
              { label: "TEMP EMP", value: occupancy.temp_employees, color: "text-pink-400" },
            ].map((item) => (
              <div key={item.label} className="bg-[#0A1628] border border-[#1A2E4A] rounded-xl p-3 text-center">
                <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                <div className="text-slate-600 text-[9px] font-mono tracking-widest mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 bg-[#0A1628] border border-[#1A2E4A] rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setListFilterQuery("");
                setLiveScanning(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all min-w-[80px] ${
                activeTab === tab.id
                  ? "bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* QR Scan / Verify / Checkin / Checkout Tabs */}
        {(activeTab === "scan" || activeTab === "checkin" || activeTab === "checkout") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Directory list (for checkin/checkout) or scan input (for scan) */}
            <div className={activeTab === "scan" ? "lg:col-span-6" : "lg:col-span-7"}>
              {activeTab === "scan" ? (
                /* Scanner Input Card for Scan tab */
                <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6 h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#F7931E]" /> QR Verification
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-slate-500 text-xs font-mono uppercase tracking-widest block mb-2">Pass Number / Phone / QR ID</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleScan()}
                            placeholder="Scan QR or enter pass number..."
                            className="flex-1 bg-[#050A14] border border-[#1A2E4A] rounded-xl px-4 py-3 text-white placeholder-slate-700 text-sm focus:border-[#005BAC] focus:outline-none"
                          />
                          <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className="px-5 py-3 bg-[#005BAC] hover:bg-[#003366] rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setLiveScanning(!liveScanning)}
                            className={`px-4 py-3 rounded-xl text-white text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                              liveScanning ? "bg-red-600 hover:bg-red-700" : "bg-[#F7931E] hover:bg-[#D97706]"
                            }`}
                          >
                            {liveScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className={`mt-4 border border-[#1A2E4A] rounded-xl p-3 bg-[#050A14] ${liveScanning ? "" : "hidden"}`}>
                        <p className="text-[10px] text-[#F7931E] mb-2 font-mono text-center flex items-center justify-center gap-1.5 animate-pulse">
                          <Radio className="w-3 h-3" /> CAMERA LIVE — SCAN VISIT/MEET/INT PASS QR
                        </p>
                        <QRScanner isScanning={liveScanning} onScanSuccess={handleQRScanSuccess} />
                        <button
                          onClick={() => setLiveScanning(false)}
                          className="mt-3 w-full py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CameraOff className="w-3.5 h-3.5" /> Stop Camera
                        </button>
                      </div>
                      {scanError && (
                        <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" /> {scanError}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-8 text-center text-slate-650 text-xs font-mono">
                    Verify visitor status, host details, and pass validity instantly.
                  </div>
                </div>
              ) : activeTab === "checkin" ? (
                /* Approved Passes Awaiting Check-In */
                <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-green-400" /> Awaiting Check-In ({pendingCheckins.length})
                    </h3>
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter list..."
                        value={listFilterQuery}
                        onChange={(e) => setListFilterQuery(e.target.value)}
                        className="w-full bg-[#050A14] border border-[#1A2E4A] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[420px] pr-2 space-y-2 custom-scrollbar">
                    {isLoadingLists ? (
                      <div className="text-center py-12 text-slate-600 text-xs font-mono flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#F7931E]" /> Loading gate directories...
                      </div>
                    ) : filteredPendingCheckins.length === 0 ? (
                      <div className="text-center py-12 text-slate-650 text-xs font-mono">
                        No approved passes found.
                      </div>
                    ) : (
                      filteredPendingCheckins.map((item) => (
                        <div
                          key={item.card_id}
                          onClick={() => selectPass(item)}
                          className={`p-3 bg-[#050A14]/60 border rounded-xl cursor-pointer hover:border-[#F7931E]/50 hover:bg-[#0A1628]/80 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                            scanResult?.card_id === item.card_id ? "border-[#F7931E] bg-[#0A1628]" : "border-[#1A2E4A]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#F7931E] font-mono text-xs font-bold">{item.card_id}</span>
                              <span className="text-[9px] bg-[#1A2E4A] text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                                {item.pass_type.replace("_PASS", "").replace("_", " ")}
                              </span>
                            </div>
                            <h4 className="text-white font-bold text-sm mt-1">{item.visitor_name}</h4>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Host: <span className="text-slate-300 font-medium">{item.host_employee}</span> | Co: <span className="text-slate-300 font-medium">{item.company}</span>
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectPass(item);
                            }}
                            className="px-4 py-2 bg-[#005BAC] hover:bg-[#003366] text-white text-[10px] font-bold uppercase rounded-lg transition-colors w-full sm:w-auto text-center"
                          >
                            Verify
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* On-Premise Visitors Awaiting Check-Out */
                <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-red-400" /> On-Premise Visitors ({checkedInVisitors.length})
                    </h3>
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Filter list..."
                        value={listFilterQuery}
                        onChange={(e) => setListFilterQuery(e.target.value)}
                        className="w-full bg-[#050A14] border border-[#1A2E4A] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[420px] pr-2 space-y-2 custom-scrollbar">
                    {isLoadingLists ? (
                      <div className="text-center py-12 text-slate-650 text-xs font-mono flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#F7931E]" /> Loading live records...
                      </div>
                    ) : filteredCheckedInVisitors.length === 0 ? (
                      <div className="text-center py-12 text-slate-650 text-xs font-mono">
                        No checked-in visitors inside the plant.
                      </div>
                    ) : (
                      filteredCheckedInVisitors.map((item) => (
                        <div
                          key={item.card_id}
                          onClick={() => selectPass(item)}
                          className={`p-3 bg-[#050A14]/60 border rounded-xl cursor-pointer hover:border-[#F7931E]/50 hover:bg-[#0A1628]/80 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                            scanResult?.card_id === item.card_id ? "border-[#F7931E] bg-[#0A1628]" : "border-[#1A2E4A]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#F7931E] font-mono text-xs font-bold">{item.card_id}</span>
                              <span className="text-[9px] bg-[#1A2E4A] text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                                {item.pass_type.replace("_PASS", "").replace("_", " ")}
                              </span>
                            </div>
                            <h4 className="text-white font-bold text-sm mt-1">{item.visitor_name}</h4>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                              Check-In: <span className="text-slate-300 font-medium">{item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString("en-IN") : "Unknown"}</span> | Gate: <span className="text-slate-300 font-medium">{item.gate_number || "Gate 1"}</span>
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectPass(item);
                            }}
                            className="px-4 py-2 bg-[#005BAC] hover:bg-[#003366] text-white text-[10px] font-bold uppercase rounded-lg transition-colors w-full sm:w-auto text-center"
                          >
                            Verify
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Scanner Input + Verification Result */}
            <div className={activeTab === "scan" ? "lg:col-span-6" : "lg:col-span-5"}>
              <div className="space-y-6">
                {/* Secondary Scan input (only for checkin/checkout, since we need search/verify capabilities) */}
                {activeTab !== "scan" && (
                  <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-4 shadow-lg">
                    <label className="text-slate-500 text-[10px] font-mono uppercase tracking-widest block mb-1.5">Quick Scan / Search Pass ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleScan()}
                        placeholder="Scan QR or pass code..."
                        className="flex-1 bg-[#050A14] border border-[#1A2E4A] rounded-xl px-3 py-2 text-white placeholder-slate-700 text-xs focus:border-[#005BAC] focus:outline-none"
                      />
                      <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className="px-4 py-2 bg-[#005BAC] hover:bg-[#003366] rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setLiveScanning(!liveScanning)}
                        className={`px-3 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center ${
                          liveScanning ? "bg-red-600 hover:bg-red-700" : "bg-[#F7931E] hover:bg-[#D97706]"
                        }`}
                      >
                        {liveScanning ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className={`mt-3 border border-[#1A2E4A] rounded-xl p-2.5 bg-[#050A14] ${liveScanning ? "" : "hidden"}`}>
                      <p className="text-[9px] text-[#F7931E] mb-1.5 font-mono text-center flex items-center justify-center gap-1.5 animate-pulse">
                        <Radio className="w-2.5 h-2.5" /> CAMERA LIVE — SCAN PASS QR
                      </p>
                      <QRScanner isScanning={liveScanning} onScanSuccess={handleQRScanSuccess} />
                      <button
                        onClick={() => setLiveScanning(false)}
                        className="mt-2.5 w-full py-1.5 bg-red-650 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CameraOff className="w-3.5 h-3.5" /> Stop Camera
                      </button>
                    </div>
                    {scanError && (
                      <div className="flex items-center gap-1.5 mt-2 text-red-400 text-[11px] font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" /> {scanError}
                      </div>
                    )}
                  </div>
                )}

                {/* Result Card */}
                <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F7931E]" /> Verification Result
                  </h3>

                  {!scanResult ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-750">
                      <QrCode className="w-10 h-10 mb-3" />
                      <p className="text-xs font-mono">Awaiting scan input...</p>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`border rounded-xl px-3 py-1 font-bold text-xs uppercase ${statusColor[scanResult.status] || statusColor.PENDING}`}>
                          {scanResult.status}
                        </div>
                        <button
                          onClick={() => {
                            setScanResult(null);
                            setScanInput("");
                            setScanError("");
                          }}
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="col-span-2 border-b border-[#1A2E4A]/30 pb-2">
                          <span className="text-slate-650 font-mono uppercase block text-[10px] tracking-wider">Visitor Name</span>
                          <p className="text-white text-base font-black mt-0.5">{scanResult.visitor_name}</p>
                        </div>
                        <div>
                          <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Pass ID</span>
                          <p className="text-[#F7931E] font-mono font-bold mt-0.5">{scanResult.card_id || scanResult.id}</p>
                        </div>
                        <div>
                          <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Type</span>
                          <p className="text-white font-bold mt-0.5">{String(scanResult.pass_type).replace("_PASS", "").replace("_", " ")}</p>
                        </div>
                        <div>
                          <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Company</span>
                          <p className="text-white font-bold mt-0.5">{scanResult.company || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Mobile</span>
                          <p className="text-white font-bold mt-0.5">{scanResult.phone || "N/A"}</p>
                        </div>
                        <div className="col-span-2 border-t border-[#1A2E4A]/30 pt-2 grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Host</span>
                            <p className="text-slate-200 font-semibold mt-0.5">{scanResult.host_employee}</p>
                          </div>
                          <div>
                            <span className="text-slate-655 font-mono uppercase block text-[10px] tracking-wider">Purpose</span>
                            <p className="text-slate-200 font-semibold mt-0.5">{scanResult.purpose}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-[#1A2E4A]/40">
                        {(!scanResult.check_in_time || scanResult.status === "APPROVED") && (
                          <button
                            onClick={() => handleCheckIn(scanResult.id)}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/25"
                          >
                            <LogIn className="w-4 h-4" /> Confirm Check-In @ {gateNumber}
                          </button>
                        )}
                        {scanResult.check_in_time && !scanResult.check_out_time && (
                          <button
                            onClick={() => handleCheckOut(scanResult.id)}
                            className="w-full py-3 bg-red-650 hover:bg-red-500 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-950/25 bg-red-600"
                          >
                            <LogOut className="w-4 h-4" /> Confirm Check-Out @ {gateNumber}
                          </button>
                        )}
                        {scanResult.check_out_time && (
                          <div className="text-center text-slate-500 text-xs font-mono bg-slate-900/50 p-3 rounded-xl border border-[#1A2E4A]">
                            Visit completed & checked out.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blacklist Check Tab */}
        {activeTab === "blacklist" && (
          <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6 max-w-2xl shadow-xl">
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Blacklist Verification
            </h3>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={blacklistQuery}
                onChange={(e) => setBlacklistQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBlacklistCheck()}
                placeholder="Name, phone, vehicle, company..."
                className="flex-1 bg-[#050A14] border border-[#1A2E4A] rounded-xl px-4 py-3 text-white placeholder-slate-700 text-sm focus:border-red-750 focus:outline-none"
              />
              <button
                onClick={handleBlacklistCheck}
                className="px-5 py-3 bg-red-700 hover:bg-red-600 rounded-xl text-white text-sm font-bold transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {blacklistResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-5 ${
                  blacklistResult.is_blacklisted
                    ? "bg-red-900/20 border-red-700/50"
                    : "bg-green-900/20 border-green-700/50"
                }`}
              >
                {blacklistResult.is_blacklisted ? (
                  <div>
                    <div className="flex items-center gap-2 text-red-400 font-black text-lg mb-3">
                      <AlertTriangle className="w-5 h-5" /> ⛔ BLACKLISTED — DENY ENTRY
                    </div>
                    <p className="text-slate-350 text-sm">
                      <span className="text-slate-500 font-mono">Reason:</span> {blacklistResult.reason}
                    </p>
                    <p className="text-slate-500 text-xs font-mono mt-2">
                      Blacklisted on: {new Date(blacklistResult.blacklisted_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" /> ✅ NOT BLACKLISTED — Clear for entry
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* Emergency Muster Tab */}
        {activeTab === "emergency" && (
          <div className="space-y-6">
            {/* Live Command Station Controls */}
            <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl p-6 shadow-xl">
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" /> Emergency Command Station
              </h4>
              <p className="text-slate-500 text-xs mb-5">
                Broadcast site-wide evacuation protocols instantly. Active alarms will trigger Telegram broadcasts to safety supervisors, visual web alerts, and SMS alerts.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleEmergencyTrigger("FIRE", "TRIGGER")}
                  className="py-3 px-4 bg-red-900/30 hover:bg-red-900/50 border border-red-650 hover:border-red-500 rounded-xl text-red-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  🔥 Trigger Fire Alarm
                </button>
                <button
                  onClick={() => handleEmergencyTrigger("GAS_LEAK", "TRIGGER")}
                  className="py-3 px-4 bg-orange-950/30 hover:bg-orange-900/50 border border-orange-650 hover:border-orange-500 rounded-xl text-orange-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  💨 Trigger Gas Leak
                </button>
                <button
                  onClick={() => handleEmergencyTrigger("GENERAL", "TRIGGER")}
                  className="py-3 px-4 bg-yellow-950/30 hover:bg-yellow-900/50 border border-yellow-650 hover:border-yellow-500 rounded-xl text-yellow-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  📢 General Evacuation
                </button>
                <button
                  onClick={() => handleEmergencyTrigger("GENERAL", "CLEAR")}
                  className="py-3 px-4 bg-green-950/30 hover:bg-green-900/50 border border-green-650 hover:border-green-500 rounded-xl text-green-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  ✅ Clear All Alarms
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" /> Emergency Muster Report
              </h3>
              <button onClick={fetchMuster} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs border border-[#1A2E4A] px-3 py-1.5 rounded-lg transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            {musterData ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-red-950/20 border border-red-700/30 rounded-xl p-4 text-center">
                    <div className="text-3xl font-black text-red-400">{musterData.total_inside}</div>
                    <div className="text-red-500 text-[10px] font-mono tracking-widest mt-1">TOTAL INSIDE PLANT</div>
                  </div>
                  <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-xl p-4 text-center sm:col-span-2 flex flex-col justify-center">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Breakdown by Pass Category</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {Object.entries(musterData.breakdown_by_type || {}).map(([type, count]) => (
                        <span key={type} className="bg-[#1D324F] px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 border border-[#1A2E4A]/40 font-mono">
                          {type.replace("_PASS", "")}: {count as number}
                        </span>
                      ))}
                      {Object.keys(musterData.breakdown_by_type || {}).length === 0 && (
                        <span className="text-slate-600 text-xs font-mono">Plant is empty.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#0A1628] border border-[#1A2E4A] rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1A2E4A] bg-[#0D1F35]">
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Pass ID</th>
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Name</th>
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Type</th>
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Check-In</th>
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Duration</th>
                          <th className="px-4 py-3 text-left text-slate-500 font-mono uppercase tracking-widest">Gate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {musterData.entries?.map((entry: any) => (
                          <tr key={entry.pass_id} className="border-b border-[#1A2E4A]/50 hover:bg-[#1A2E4A]/30 transition-colors">
                            <td className="px-4 py-3 text-[#F7931E] font-mono">{entry.card_id || entry.pass_id}</td>
                            <td className="px-4 py-3 text-white font-bold">{entry.visitor_name}</td>
                            <td className="px-4 py-3 text-slate-400">{String(entry.pass_type).replace("_PASS", "")}</td>
                            <td className="px-4 py-3 text-slate-400">{entry.check_in_time ? new Date(entry.check_in_time).toLocaleTimeString("en-IN") : "—"}</td>
                            <td className="px-4 py-3 text-yellow-400 font-mono">{entry.duration_minutes}m</td>
                            <td className="px-4 py-3 text-slate-400">{entry.gate_number || "—"}</td>
                          </tr>
                        ))}
                        {(!musterData.entries || musterData.entries.length === 0) && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-600 font-mono">
                              No visitors currently inside the plant.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-700">
                <Radio className="w-10 h-10 mx-auto mb-3 animate-pulse" />
                <p className="text-sm font-mono">Loading muster data...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
