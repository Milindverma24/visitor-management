import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  QrCode,
  Building,
  ShieldCheck,
  Clock,
  Activity,
  ArrowRight,
  Shield,
  Users,
  Info,
  Settings,
  ExternalLink
} from "lucide-react";
import logo from "@/assets/logo.png";
import demoVideo from "@/assets/vid1.mov";

export default function LandingPage() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const accessCards = [
    {
      title: "VISITOR PASS",
      icon: QrCode,
      color: "from-[#2563EB] to-indigo-700",
      glowColor: "rgba(37, 99, 235, 0.4)",
      badge: "Kiosk self-entry",
      description: [
        "Register New Visitor Pass",
        "Form Entry",
        "Generate Entry Request",
        "Track Live Approval Status"
      ],
      btnText: "Enter Visitor Portal",
      route: "/visitor"
    },
    {
      title: "COMPANY EMPLOYEES",
      icon: Building,
      color: "from-[#0F172A] to-slate-900",
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
      color: "from-[#FBBF24] to-amber-600",
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
    <div className="min-h-screen w-screen bg-[#F8FAFC] text-[#0F172A] relative overflow-x-hidden industrial-grid font-sans flex flex-col selection:bg-[#FBBF24] selection:text-primary">

      {/* Background glow filters */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-[#FBBF24]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER NAVBAR */}
      <header className="z-50 w-full glass-premium border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0">
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

      {/* MAIN CONTENT - SINGLE SCREEN, NO SCROLL */}
      <main className="flex-1 flex flex-col items-center justify-start md:justify-center p-6 w-full max-w-7xl mx-auto z-10 pt-12 md:pt-6">
        <div className="flex flex-col items-center mb-8 shrink-0">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase mb-2">
            SELECT ACCESS POINT
          </span>
          <h3 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-3">
            Visitor Management Portal
          </h3>
          <p className="text-sm text-slate-500 font-medium max-w-md text-center">
            Select your entry route to begin check-in, issue meeting invitations, or audit visitor passes at terminal gates.
          </p>
        </div>

        {/* Access Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto h-auto md:min-h-[360px]">
          {accessCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => navigate(card.route)}
                className="bg-white rounded-3xl p-6 md:p-8 text-left shadow-lg shadow-slate-200/50 border border-slate-200/80 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden h-full"
              >
                <div
                  className="absolute -right-20 -top-20 w-44 h-44 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ backgroundColor: card.glowColor }}
                />

                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase">
                      {card.badge}
                    </span>
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${card.color} text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h4 className="text-xl font-extrabold text-[#0F172A] tracking-tight mb-4">
                    {card.title}
                  </h4>

                  <ul className="space-y-3 mb-6">
                    {card.description.map((desc, dIdx) => (
                      <li key={dIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span>{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold transition-all duration-300 shadow-md group-hover:shadow-lg cursor-pointer text-center relative overflow-hidden mt-auto"
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    {card.btnText} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* SYSTEM DEMONSTRATION VIDEO */}
        <section className="w-full max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/60 mt-16 text-center">
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] font-mono tracking-widest text-[#2563EB] font-bold uppercase mb-2">
              Demonstration
            </span>
            <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-3">
              How the System Works
            </h3>
            <p className="text-xs text-slate-500 font-semibold max-w-md">
              Watch this walkthrough video to understand the seamless visitor registration, employee approval, and security clearance workflow.
            </p>
          </div>

          <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-200 shadow-2xl max-w-3xl mx-auto aspect-video">
            <video 
              className="w-full h-full object-cover" 
              controls
              preload="metadata"
            >
              <source src={demoVideo} type="video/quicktime" />
              <source src={demoVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </section>

        {/* ABOUT & SYSTEM DETAILS SECTION */}
        <section className="w-full max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/60 mt-12 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* About Column */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <span className="text-[10px] font-mono tracking-widest text-[#2563EB] font-bold uppercase mb-2">
                System Overview
              </span>
              <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-4 uppercase">
                IGLGATE Enterprise VMS
              </h3>
              <p className="text-slate-650 text-xs font-semibold leading-relaxed mb-4">
                Developed and designed by <strong>Milind Verma</strong> for the corporate headquarters and manufacturing plants of <strong>Indian Glycol Limited</strong>, IGLGATE v3.0 is an enterprise-grade digital check-in and visitor auditing platform.
              </p>
              <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                Replacing conventional register books with an audited, secure, and touchless ecosystem, the system guarantees that all entrants undergo comprehensive clearance checks, real-time host validation, and compliance verification.
              </p>
            </div>

            {/* Uses & Features Column */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex gap-3.5 hover:shadow-md transition-shadow">
                <div className="p-2.5 h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">
                    Visitor Self-Entry
                  </h5>
                  <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                    Kiosk mode allows visitors to quickly register, capture a verification photo, select hosts, and request digital gate passes.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex gap-3.5 hover:shadow-md transition-shadow">
                <div className="p-2.5 h-10 w-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">
                    Security Screening
                  </h5>
                  <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                    Security guards scan QR codes instantly at plant gates to cross-verify clearance status, department listings, and active check-ins.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex gap-3.5 hover:shadow-md transition-shadow">
                <div className="p-2.5 h-10 w-10 rounded-xl bg-amber-50 text-[#FBBF24] flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">
                    Staff Host Controls
                  </h5>
                  <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                    Employees log in to invite visitors, schedule department-wide visitor approvals, and receive instant arrival alerts.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex gap-3.5 hover:shadow-md transition-shadow">
                <div className="p-2.5 h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-[#0F172A] uppercase tracking-wider mb-1">
                    Emergency & Audits
                  </h5>
                  <p className="text-slate-500 text-[11px] font-semibold leading-normal">
                    Real-time occupancy tracking and emergency broadcast systems enable swift evacuation management and compliance reporting.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* PREMIUM FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-white/70 backdrop-blur-md px-6 py-6 mt-12 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-left">
            <img src={logo} alt="IGL Logo" className="h-8 w-auto object-contain bg-white border border-slate-200 rounded p-0.5" />
            <div>
              <span className="block text-xs font-black tracking-tight text-[#0F172A]">
                IGLGATE v3.0
              </span>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                © {new Date().getFullYear()} Indian Glycol Limited. All rights reserved.
              </span>
            </div>
          </div>

          {/* GitHub / Creator Credit */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Milindverma24"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-slate-900/10 cursor-pointer group"
            >
              <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform fill-current" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>Made with Milind</span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
