import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Terminal,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "@/services/authService";
import logo from "@/assets/logo.png";

export default function SecurityLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        toast.success("Security Session Authenticated!");
        navigate("/dashboard");
      } else {
        toast.error("Invalid security badge credentials");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials or terminal offline");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans py-12 px-6 industrial-grid">
      
      {/* Alert Warning Stripe Accent at Top and Bottom strictly using IGL Safety Yellow (#FBBF24) */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FBBF24] via-slate-255 to-[#FBBF24] bg-[size:40px_40px] animate-[pulse_2s_infinite]" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#FBBF24] via-slate-255 to-[#FBBF24] bg-[size:40px_40px] animate-[pulse_2s_infinite]" />

      {/* Grid overlay for radar look */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.01)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Background glow filters */}
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#FBBF24]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all mb-8 shadow-sm bg-white border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Exit to IGL Terminal
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-white border border-slate-200 shadow-xl mb-4">
            <img src={logo} alt="IGL Logo" className="h-12 w-auto object-contain bg-white rounded p-1" />
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight leading-none uppercase">
            IGL Security Control
          </h2>
          <p className="text-xs font-mono font-bold text-[#FBBF24] tracking-widest mt-2 uppercase">
            Indian Glycol Limited
          </p>
        </div>

        {/* High Security Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white/80 border border-slate-250/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top visual warning card accent */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[#FBBF24]" />

          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#2563EB] font-bold uppercase">Security Personnel</span>
              <h3 className="text-base font-extrabold text-[#0F172A] mt-0.5">Sign In</h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-[#FBBF24] rounded-xl border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Email field */}
            <div>
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="email"
                  placeholder="badge@igl.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm font-mono text-slate-900 focus:border-[#FBBF24] focus:bg-white focus:outline-none transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Password
                </label>
                <a href="#forgot" className="text-[10px] font-mono font-bold text-[#2563EB] hover:text-blue-700">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-mono text-slate-900 focus:border-[#FBBF24] focus:bg-white focus:outline-none transition-colors placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Shift and Time Stat */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-650 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2563EB] animate-spin" />
                <span>SYS TIME: {time.toLocaleTimeString()}</span>
              </div>
              <span className="text-[#2563EB] font-bold uppercase">SHIFT A ACTIVE</span>
            </div>

            {/* Remember terminal */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 bg-slate-50 border-slate-200 rounded text-[#FBBF24] focus:ring-[#FBBF24] focus:ring-offset-white focus:ring-2 accent-[#FBBF24]"
                />
                <span>Authorize gate station</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#FBBF24] hover:bg-amber-400 disabled:bg-[#FBBF24]/50 text-slate-950 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer transition-colors"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <Terminal className="w-4 h-4" />
                </span>
              )}
            </button>
            </form>

        </motion.div>
        
        {/* Compliance Footer */}
        <p className="text-[10px] text-slate-400 mt-6 text-center">
          © {new Date().getFullYear()} Indian Glycol Limited. Authorized Personnel Only.
        </p>
      </div>

    </div>
  );
}
