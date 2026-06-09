import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { Truck, CheckCircle, ChevronRight, User, Phone, MapPin, Building, Hash, Plus, ArrowLeft, Camera, ShieldCheck, Mail } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import axios from "axios";
import logo from "@/assets/logo.png";

export default function TransporterPortal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const webcamRef = React.useRef<any>(null);

  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "TRUCK",
    driver_name: "",
    driver_mobile: "",
    driver_email: "",
    transport_company: "",
    purpose: "MATERIAL_DELIVERY",
    host_employee: "",
  });

  const VEHICLE_TYPES = ["TRUCK", "TANKER", "TEMPO", "MINI_TRUCK", "TRAILER", "CONTAINER", "VENDOR", "PRIVATE"];
  const PURPOSES = ["MATERIAL_DELIVERY", "MATERIAL_PICKUP", "WASTE_DISPOSAL", "MAINTENANCE", "OTHER"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.toUpperCase() });
  };

  const capturePhoto = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setIsLoading(true);
        try {
          // Robust base64 to File conversion (avoids local fetch restrictions/CORS)
          const arr = imageSrc.split(',');
          const mime = arr[0].match(/:(.*?);/)![1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const file = new File([u8arr], `transporter_${Date.now()}.jpg`, { type: mime });

          const uploadData = new FormData();
          uploadData.append("file", file);
          const token = localStorage.getItem("token");
          const uploadRes = await axios.post("/api/visitors/photo", uploadData, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          });
          if (uploadRes.data.photo_path) {
            setCapturedPhoto(uploadRes.data.photo_path);
            toast.success("Photo captured successfully!");
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error("Failed to upload photo.");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Step 1: Register or Update Vehicle
      const vehiclePayload = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        driver_name: formData.driver_name,
        driver_mobile: formData.driver_mobile,
        driver_email: formData.driver_email,
        driver_photo_path: capturedPhoto,
        transport_company: formData.transport_company,
      };

      // API call to custom endpoint that handles vehicle creation AND pass generation
      const res = await api.post("/api/vehicles/transporter-pass", {
        ...vehiclePayload,
        purpose: formData.purpose,
        host_employee: formData.host_employee
      });

      setTicketId(res.data.pass_number || `REQ-${Math.floor(Math.random() * 100000)}`);
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#005BAC]/5 rounded-full blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-[#F7931E]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-xl shadow-[#003366]/5 inline-flex mb-4">
            <img src={logo} alt="IGL Logo" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-black text-[#003366] tracking-tight">Transporter Portal</h1>
          <p className="text-slate-500 mt-2">Register vehicles and request entry passes</p>
        </motion.div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-[#003366]/10 border border-slate-100 overflow-hidden">
          {/* Progress Bar */}
          <div className="flex">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 h-1.5 transition-colors duration-500 ${step >= i ? "bg-[#005BAC]" : "bg-slate-100"}`} />
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#005BAC]">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Vehicle Information</h2>
                      <p className="text-xs text-slate-500">Enter truck and transport details</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Vehicle Number *</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          name="vehicle_number"
                          required
                          value={formData.vehicle_number}
                          onChange={handleChange}
                          placeholder="e.g. DL 1M 1234"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:border-transparent outline-none transition-all uppercase font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Vehicle Type *</label>
                        <select
                          name="vehicle_type"
                          value={formData.vehicle_type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] focus:border-transparent outline-none transition-all"
                        >
                          {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Transport Co.</label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            name="transport_company"
                            value={formData.transport_company}
                            onChange={handleChange}
                            placeholder="Company Name"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!formData.vehicle_number) { toast.error("Vehicle Number is required"); return; }
                        setStep(2);
                      }}
                      className="w-full mt-6 bg-[#005BAC] hover:bg-[#003366] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#005BAC]/30"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => navigate("/")} className="w-full mt-3 text-slate-500 text-sm hover:text-slate-700 flex justify-center items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to Home
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F7931E]">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Driver & Visit Details</h2>
                      <p className="text-xs text-slate-500">Provide driver information</p>
                    </div>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Driver Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" name="driver_name" required value={formData.driver_name} onChange={handleChange} placeholder="Full Name" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="tel" name="driver_mobile" required value={formData.driver_mobile} onChange={handleChange} placeholder="10-digit number" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" name="driver_email" value={formData.driver_email} onChange={handleChange} placeholder="driver@example.com" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Purpose of Visit *</label>
                        <select name="purpose" value={formData.purpose} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none">
                          {PURPOSES.map(p => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Host Employee / Dept</label>
                        <input type="text" name="host_employee" value={formData.host_employee} onChange={handleChange} placeholder="Who are you visiting?" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#005BAC] outline-none" />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button type="button" onClick={() => setStep(1)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                        Back
                      </button>
                      <button type="submit" className="flex-1 bg-[#005BAC] hover:bg-[#003366] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#005BAC]/30">
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Visual Verification</h2>
                      <p className="text-xs text-slate-500">Please take a clear photo of the driver.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {!capturedPhoto ? (
                      <div className="bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg">
                        <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
                          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium">
                            <ShieldCheck className="w-4 h-4 text-green-400" />
                            Live Verification
                          </div>
                        </div>
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: "user" }}
                          className="w-full h-64 object-cover opacity-90"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={isLoading}
                            className="bg-white hover:bg-slate-100 text-slate-900 p-4 rounded-full shadow-2xl transition-transform active:scale-95 disabled:opacity-50"
                          >
                            <Camera className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-100">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-green-800 mb-1">Photo Captured Successfully</h3>
                        <p className="text-green-600/80 text-sm mb-4">Driver identity verified.</p>
                        <button
                          type="button"
                          onClick={() => setCapturedPhoto(null)}
                          className="text-sm text-green-700 font-medium hover:text-green-800 underline underline-offset-4"
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3 mt-8">
                      <button type="button" onClick={() => setStep(2)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!capturedPhoto || isLoading}
                        className="flex-1 bg-[#F7931E] hover:bg-[#e8841a] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#F7931E]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Submit Pass Request"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Request Submitted!</h2>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                    Your vehicle entry request has been submitted and is pending approval. You will receive an SMS/Email with the QR Pass once approved by the administrator.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 inline-block mb-8">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Request Reference ID</p>
                    <p className="text-2xl font-mono font-black text-[#005BAC] tracking-wider">{ticketId}</p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button onClick={() => navigate("/")} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
                      Return Home
                    </button>
                    <button onClick={() => {
                      setFormData({
                        vehicle_number: "", vehicle_type: "TRUCK", driver_name: "", driver_mobile: "",
                        driver_email: "", transport_company: "", purpose: "MATERIAL_DELIVERY", host_employee: ""
                      });
                      setCapturedPhoto(null);
                      setStep(1);
                    }} className="px-6 py-3 bg-[#005BAC] hover:bg-[#003366] text-white rounded-xl font-bold transition-colors shadow-lg shadow-[#005BAC]/20">
                      Register Another Vehicle
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          IGLGATE Enterprise Management • Indraprastha Gas Limited
        </p>
      </div>
    </div>
  );
}
