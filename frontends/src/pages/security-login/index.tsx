import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, AlertTriangle, Radio } from "lucide-react";
import api from "@/services/api";
import logo from "@/assets/logo.png";

export default function SecurityLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const SECURITY_ROLES = ["SECURITY_GUARD", "SECURITY_SUPERVISOR", "CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const fullEmail = email.includes("@") ? email : `${email}@igl.com`;
      const res = await api.post("/api/auth/login", { email: fullEmail, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Decode token to check role
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      const role = payload.role || "";

      if (!SECURITY_ROLES.includes(role)) {
        setError("Access denied. This portal is for Security Personnel only.");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return;
      }

      navigate("/security-ops");
    } catch (err: any) {
      setError("Wrong credential");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A14] flex items-center justify-center relative overflow-hidden">
      {/* Animated background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(0,91,172,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,91,172,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#003366] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F7931E] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="IGL Logo" className="h-12 w-auto drop-shadow-lg" />
            <div className="text-left">
              <p className="text-[#F7931E] text-xs font-bold tracking-[0.3em] uppercase">Indian Glycol Limited</p>
              <h1 className="text-white text-xl font-black tracking-tight">IGLGATE</h1>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-mono tracking-widest uppercase">Security Operations Portal</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0A1628]/80 backdrop-blur-xl border border-[#1A2E4A] rounded-2xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#1A2E4A]">
            <div className="w-10 h-10 bg-[#F7931E]/10 border border-[#F7931E]/30 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#F7931E]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">SECURITY ACCESS</h2>
              <p className="text-slate-500 text-xs">Authorized Personnel Only</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2.5 mb-5 text-red-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-2">Security ID / Email</label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="security.guard"
                  className="w-full bg-[#050A14] border border-[#1A2E4A] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:border-[#005BAC] focus:outline-none focus:ring-1 focus:ring-[#005BAC]/50 transition-all pr-24"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 font-bold text-sm">
                  @igl.com
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block">Password</label>
                <button
                  type="button"
                  onClick={() => setError("Contact to admin")}
                  className="text-[#F7931E] hover:text-[#e8841a] text-xs font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#050A14] border border-[#1A2E4A] rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:border-[#005BAC] focus:outline-none focus:ring-1 focus:ring-[#005BAC]/50 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#F7931E] hover:bg-[#e8841a] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#F7931E]/20"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Secure Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1A2E4A] text-center">
            <button
              onClick={() => navigate("/")}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              ← Return to Main Portal
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-6 font-mono">
          IGLGATE v2.0 · Authorized Access Only · All Activity Monitored
        </p>
      </motion.div>
    </div>
  );
}
