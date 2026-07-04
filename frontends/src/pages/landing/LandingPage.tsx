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
} from "lucide-react";
import logo from "@/assets/logo.png";

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
      </main>
    </div>
  );
}
