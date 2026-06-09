import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Building, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Hexagon 
} from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "@/services/authService";
import logo from "@/assets/logo.png";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fullEmail = email.includes("@") ? email : `${email}@igl.com`;
      const res = await loginUser({ email: fullEmail, password });
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        toast.success("Logged in successfully. Welcome to IGL Staff Portal!", { id: "auth-toast" });
        navigate("/dashboard");
      } else {
        toast.error("Wrong credential", { id: "auth-toast" });
      }
    } catch (error: any) {
      toast.error("Wrong credential", { id: "auth-toast" });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate floating chemical hexagons for background
  const hexElements = Array.from({ length: 8 });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden font-sans py-12 px-6 industrial-grid">
      
      {/* Background glow filters strictly utilizing primary IGL color scheme */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-[#2563EB]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FBBF24]/5 rounded-full blur-[120px]" />
        
        {hexElements.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 200 - 100, 
              y: Math.random() * 200 - 100,
              scale: Math.random() * 0.5 + 0.5,
              opacity: Math.random() * 0.1 + 0.05
            }}
            animate={{
              y: ["-20px", "20px", "-20px"],
              rotate: [0, 360],
              opacity: [0.03, 0.1, 0.03]
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute text-slate-200"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 90}%`
            }}
          >
            <Hexagon size={Math.random() * 60 + 30} strokeWidth={1} />
          </motion.div>
        ))}
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-all mb-8 shadow-sm bg-white border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Landing Page
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-white border border-slate-200 shadow-xl mb-4">
            <img src={logo} alt="IGL Logo" className="h-12 w-auto object-contain bg-white rounded p-1" />
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight leading-none uppercase">
            IGL EMPLOYEE ACCESS HUB
          </h2>
          <p className="text-xs font-bold text-[#2563EB] tracking-widest mt-2 uppercase">
            Indian Glycol Limited
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 border border-slate-250/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top colored accent stripe */}
          <div className="absolute top-0 inset-x-0 h-1 bg-[#2563EB]" />
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono tracking-widest text-[#2563EB] font-bold uppercase">Employee Portal</span>
              <h3 className="text-lg font-extrabold text-[#0F172A] mt-0.5">Sign In</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-[#2563EB] rounded-xl border border-blue-100">
              <Building className="w-5 h-5" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            
            {/* Email Field */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                Employee Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  required
                  type="text"
                  placeholder="name"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-24 text-sm font-semibold text-slate-900 focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors placeholder:text-slate-400"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  @igl.com
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() => toast.error("Contact to admin", { id: "auth-toast" })}
                  className="text-xs font-bold text-[#2563EB] hover:text-blue-700 transition-colors"
                >
                  Forgot?
                </button>
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
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-sm font-semibold text-slate-900 focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors placeholder:text-slate-400 font-sans"
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

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 bg-slate-50 border-slate-200 rounded text-[#2563EB] focus:ring-[#2563EB] focus:ring-offset-white focus:ring-2 accent-[#2563EB]"
                />
                <span>Remember this terminal</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#2563EB] hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer transition-colors"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

        </motion.div>
        
        {/* Compliance Footer */}
        <p className="text-[10px] text-slate-400 mt-6 text-center">
          © {new Date().getFullYear()} Indian Glycol Limited. All rights reserved.
        </p>
      </div>

    </div>
  );
}
