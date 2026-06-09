import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  QrCode, 
  Building, 
  ShieldCheck, 
  Clock, 
  Activity, 
  Radio, 
  Server, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import logo from "@/assets/logo.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [visitorCount, setVisitorCount] = useState(384);

  // Keep a ticking clock on screen to simulate a real plant control room
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Slowly increment visitor count to simulate real time traffic
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount(prev => prev + (Math.random() > 0.6 ? 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Split count into digits for the odometer display
  const countDigits = String(visitorCount).padStart(5, "0").split("");

  const accessCards = [
    {
      title: "VISITOR PASS",
      icon: QrCode,
      color: "from-[#2563EB] to-indigo-700", // Industrial Blue to deep blue
      glowColor: "rgba(37, 99, 235, 0.4)",
      badge: "Kiosk self-entry",
      description: [
        "Register New Visitor Pass",
        "Upload Aadhaar / Form Entry",
        "Generate Entry Request",
        "Track Live Approval Status"
      ],
      btnText: "Enter Visitor Portal",
      route: "/visitor"
    },
    {
      title: "COMPANY EMPLOYEES",
      icon: Building,
      color: "from-[#0F172A] to-slate-900", // Dark Navy
      glowColor: "rgba(15, 23, 42, 0.4)",
      badge: "Staff access",
      description: [
        "Create Meeting Invitations",
        "Review & Approve Visitors",
        "Schedule Department Passes",
        "Manage Plant Visit Logs"
      ],
      btnText: "Employee Login",
      route: "/employee-login"
    },
    {
      title: "SECURITY GUARDS",
      icon: ShieldCheck,
      color: "from-[#FBBF24] to-amber-600", // Safety Yellow / Amber
      glowColor: "rgba(251, 191, 36, 0.4)",
      badge: "Plant gates",
      description: [
        "Scan Approved Visitor QR Codes",
        "Verify Security Clearance",
        "Check-In Approved Guests",
        "Initiate Shift Emergency Alerts"
      ],
      btnText: "Security Login",
      route: "/security-login"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden industrial-grid font-sans selection:bg-[#FBBF24] selection:text-primary">
      
      {/* Background glow filters strictly utilizing primary IGL color scheme */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-[#FBBF24]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER NAVBAR */}
      <header className="sticky top-0 z-50 w-full glass-premium border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="IGL Logo" className="h-10 w-auto object-contain bg-white border border-slate-200 rounded p-1" />
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-[#0F172A] leading-none">
              INDIAN GLYCOL LIMITED
            </h1>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">
              IGL Enterprise Visitor Management
            </span>
          </div>
        </div>

        {/* Live Plant Telemetry Header Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              VMS SYSTEM: ONLINE
            </span>
          </div>
          
          <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
            <Clock className="w-4 h-4 text-[#2563EB] animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-700">
              {time.toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-[#0F172A] text-white rounded-full py-1.5 px-4 shadow-sm border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-[#FBBF24] animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase">
              PLANT SECURE
            </span>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-16 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Typography */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-xs font-extrabold mb-6 tracking-wide uppercase"
          >
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>IGL HIGH-SECURITY REFINERY & LOGISTICS PORTAL</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.05] mb-6"
          >
            Secure Visitor <br />
            <span className="bg-gradient-to-r from-[#2563EB] to-blue-700 bg-clip-text text-transparent">
              Access Management
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 font-medium max-w-xl mb-10 leading-relaxed"
          >
            Manage Indian Glycol Limited plant visitors, employee schedules, and security gate check-ins with real-time tracking, Aadhaar verification, and digital pass clearance workflow.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => navigate("/visitor")}
              className="px-8 py-4 bg-[#0F172A] hover:bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Visitor Pass <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate("/transporter")}
              className="px-8 py-4 bg-[#005BAC] hover:bg-[#003366] text-white rounded-xl font-bold shadow-lg shadow-[#005BAC]/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2 group cursor-pointer"
            >
              Transporter/Vehicle Pass <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>

        {/* Right Side: Interactive Refinery Graphic (Focal Element in IGL Blue Theme) */}
        <div className="lg:col-span-5 relative w-full h-[400px] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full max-w-[380px] h-[380px] rounded-3xl bg-[#0F172A] border-2 border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 text-white relative group"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950/90 to-slate-950 pointer-events-none" />
            
            {/* Technical grid and crosshairs overlay */}
            <div className="absolute inset-0 bg-grid-slate-900/50 opacity-20 pointer-events-none" />
            <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-slate-600" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-slate-600" />

            {/* Scanning line animation */}
            <div className="absolute left-0 w-full h-[2px] scanning-line pointer-events-none" />

            <div className="flex items-center justify-between z-10 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#FBBF24] animate-spin" />
                <span className="text-[10px] font-mono tracking-widest text-slate-400">VMS PORTAL</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] text-[8px] font-bold border border-[#22C55E]/30">
                ONLINE
              </span>
            </div>

            {/* VMS Status Cards */}
            <div className="flex-1 flex flex-col justify-center gap-3 my-4 z-10">
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <div className="text-left">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Visitor Registration</p>
                  <p className="text-sm font-bold text-white mt-0.5">Active &amp; Accepting</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E] animate-pulse" />
              </div>
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <div className="text-left">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Approval Workflow</p>
                  <p className="text-sm font-bold text-white mt-0.5">Host Notifications On</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB] animate-pulse" />
              </div>
              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <div className="text-left">
                  <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Security Gate Scan</p>
                  <p className="text-sm font-bold text-white mt-0.5">QR Verification Ready</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-[#FBBF24] animate-pulse" />
              </div>
            </div>

            <div className="z-10 bg-slate-950/80 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-left">
              <div>
                <p className="text-[10px] font-mono text-slate-400 leading-none">SYSTEM STATUS</p>
                <p className="text-xs font-bold text-white mt-1 leading-none">All Services Operational</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MECHANICAL TICKER SECTION (Active counts) */}
      <section className="bg-[#0F172A] py-12 px-6 border-y-2 border-slate-950 text-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="text-center md:text-left flex flex-col gap-2">
            <h3 className="text-2xl font-black tracking-tight text-white">
              Active Plant Entries Today
            </h3>
            <p className="text-xs font-medium text-slate-400 max-w-sm">
              Real-time audit log increments from all main gates, storage facilities, and administration blocks.
            </p>
          </div>

          {/* Odometer Counter in Safety Yellow / Dark Slate */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow-inner">
            {countDigits.map((digit, idx) => (
              <div 
                key={idx} 
                className="w-12 h-16 bg-[#0F172A] text-white font-mono text-3xl font-extrabold flex items-center justify-center rounded-xl border border-slate-800 shadow-md relative overflow-hidden"
              >
                {/* Mechanical lines styling */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-slate-700" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-950" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-950/50" />
                <span className="z-10 text-[#FBBF24] font-bold text-glow-yellow">{digit}</span>
              </div>
            ))}
            
            <div className="flex flex-col gap-0.5 text-left pl-3 text-[10px] font-mono text-slate-400 border-l border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                <span>GUEST: 112</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                <span>STAFF: 242</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FBBF24]" />
                <span>CONT: 30</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ACCESS PORTALS (THE 3 ACCESS CARDS) */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center" id="about">
        <div className="flex flex-col items-center mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-3">
            SELECT ACCESS POINT
          </span>
          <h3 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            Role-Based Portals
          </h3>
          <p className="text-sm text-slate-500 font-medium max-w-md mt-4">
            Select your entry route to begin check-in, issue meeting invitations, or audit visitor passes at terminal gates.
          </p>
        </div>

        {/* Access Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {accessCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => navigate(card.route)}
                className="glass-premium hover:bg-white rounded-3xl p-8 text-left shadow-lg shadow-slate-100 border border-slate-200/80 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                style={{
                  boxShadow: `0 10px 30px -10px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.01)`
                }}
              >
                {/* Background light glow on hover */}
                <div 
                  className="absolute -right-20 -top-20 w-44 h-44 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: card.glowColor }}
                />

                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                      {card.badge}
                    </span>
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h4 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-4">
                    {card.title}
                  </h4>

                  {/* List descriptions */}
                  <ul className="space-y-3 mb-8">
                    {card.description.map((desc, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  className={`w-full py-3.5 px-4 bg-[#0F172A] hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-all duration-300 group-hover:shadow-md cursor-pointer text-center relative overflow-hidden`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {card.btnText} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PLANT SAFETY WARNINGS & STANDARDS */}
      <section className="bg-slate-50 py-16 px-6 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                Aadhaar Required
              </h5>
              <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                National ID verification required for all non-employee plant floor visitors.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Server className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                Real-Time Auditing
              </h5>
              <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                All logins, check-ins, and clearances logged directly to ISO compliant systems.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                Approval Stepper
              </h5>
              <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                Digital Host authorization required via real-time dashboard notifications.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-1">
                Hazardous Areas
              </h5>
              <p className="text-[11px] font-semibold text-slate-500 leading-normal">
                Valid RFID passes are mandatory before crossing check-gates for all hazardous gas refinery zones.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] text-slate-400 py-16 px-6 border-t border-slate-900 text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-slate-900 pb-12 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="IGL Logo" className="h-8 w-auto object-contain bg-white rounded p-1" />
              <h4 className="text-white font-extrabold text-md tracking-tight">
                Indian Glycol Limited
              </h4>
            </div>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Industrial Grade Visitor Management Platform engineered for extreme-high security chemical manufacturing refineries, pipelines, and shipping bays.
            </p>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs tracking-wider uppercase mb-4">
              System Portals
            </h5>
            <ul className="space-y-2 text-xs font-bold text-slate-500">
              <li><a href="/visitor" className="hover:text-[#FBBF24] transition-colors">Visitor Kiosk Portal</a></li>
              <li><a href="/employee-login" className="hover:text-[#FBBF24] transition-colors">Employee Clearance Hub</a></li>
              <li><a href="/security-login" className="hover:text-[#FBBF24] transition-colors">Security Gate Control</a></li>
              <li><span className="text-slate-600 font-normal">Administrator Console</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs tracking-wider uppercase mb-4">
              Entry Compliance
            </h5>
            <ul className="space-y-2 text-xs font-bold text-slate-500">
              <li>National ID Verification</li>
              <li>Host Approval Requirement</li>
              <li>Safety Evacuation Briefing</li>
              <li>ISO-Compliant Security Logs</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold text-xs tracking-wider uppercase mb-4">
              Terminal Status
            </h5>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-4">
              Authorized access point. Live connections are secured and audited under enterprise security standards.
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#22C55E] uppercase">
                IGL Secure Terminal (Online)
              </span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 font-bold gap-4">
          <p>© {new Date().getFullYear()} Indian Glycol Limited (IGL). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#terms" className="hover:text-slate-400 transition-colors">Safety Regulations</a>
            <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy & Data Policy</a>
            <a href="#support" className="hover:text-slate-400 transition-colors">Terminal Helpdesk</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
