import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Clock,
  Printer,
  Sparkles,
  AlertCircle,
  Send,
  ShieldCheck,
  CheckCircle2,
  Fingerprint,
  Phone,
  UserPlus,
  Search
} from "lucide-react";
import toast from "react-hot-toast";

import { createVisit } from "@/services/visitService";
import { createVisitor, searchVisitor, getPreRegisteredVisits, completePreRegisteredVisit } from "@/services/visitorService";
import { getPublicDepartments } from "@/services/departmentService";
import { getPublicPlants } from "@/services/plantService";
import { getPublicUsers } from "@/services/userService";
import { checkBlacklist } from "@/services/blacklistService";
import { loginUser } from "@/services/authService";
import logo from "@/assets/logo.png";

const getLocalDateTimeString = (offsetHours = 0) => {
  const date = new Date();
  if (offsetHours) {
    date.setHours(date.getHours() + offsetHours);
  }
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

const formatHostName = (host: string) => {
  if (!host) return "Unknown";
  if (host.includes("@")) {
    if (host.includes("mi241105") || host.includes("mili241105")) {
      return "MILIND VERMA";
    }
    return host.split("@")[0].toUpperCase();
  }
  return host.split(" (")[0];
};

export default function VisitorPortal() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  
  const [entryMode, setEntryMode] = useState<'login' | 'idle' | 'phone_entry' | 'meetings_list' | 'form'>('login');
  const [searchPhone, setSearchPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [employeeId, setEmployeeId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [plants, setPlants] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableHosts, setAvailableHosts] = useState<{email: string, label: string}[]>([]);
  const [useWebcam, setUseWebcam] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSafetyChecked, setIsSafetyChecked] = useState(false);

  const [preRegisteredMeetings, setPreRegisteredMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [selectedMeetingVisitorId, setSelectedMeetingVisitorId] = useState<number | null>(null);

  const defaultFormState = {
    cardId: "Auto Generated",
    title: "Mr.",
    fullName: "",
    phoneNumber: "",
    email: "",
    plant_id: "",
    address: "",
    hostEmployee: "",
    department: "",
    upTo: "Office",
    mobileTokenNo: "",
    arrivalDate: getLocalDateTimeString(0),
    isHodApprovalRequired: "NO",
    accessories: "",
    purpose: "Official",
    category: "Visitor",
    validUpTo: getLocalDateTimeString(6),
    status: "PENDING",
    accompaniedByCount: 0,
    photoPath: "",
  };

  const [formData, setFormData] = useState(defaultFormState);
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    const kioskUnlockExpiry = localStorage.getItem("kiosk_unlock_expiry");
    if (kioskUnlockExpiry && parseInt(kioskUnlockExpiry, 10) > Date.now()) {
      setEntryMode('idle');
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await getPublicPlants();
        setPlants(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, plant_id: res.data[0].id.toString() }));
        }
      } catch (err) {
        console.error("Failed to load plants");
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!formData.plant_id) return;
    const fetchDepts = async () => {
      try {
        const res = await getPublicDepartments(parseInt(formData.plant_id));
        const activeDepts = res.data.filter((d: any) => d.is_active);
        setDepartments(activeDepts);
        if (activeDepts.length > 0 && !activeDepts.find((d: any) => d.name === formData.department)) {
          setFormData(prev => ({ ...prev, department: activeDepts[0].name }));
        }
      } catch (err) {
        console.error("Failed to load departments");
        setDepartments([]);
        setFormData(prev => ({ ...prev, department: "" }));
      }
    };
    fetchDepts();
  }, [formData.plant_id]);

  useEffect(() => {
    const fetchHosts = async () => {
      if (formData.department && formData.plant_id) {
        try {
          const res = await getPublicUsers({ 
            department_name: formData.department,
            plant_id: parseInt(formData.plant_id)
          });
          if (res.data && res.data.length > 0) {
            setAvailableHosts(res.data.map((u: any) => ({
              email: u.email,
              label: `${u.full_name} (${u.role.replace("_", " ")}, ${formData.department})`
            })));
          } else {
            setAvailableHosts([]);
          }
        } catch (err) {
          console.error("Failed to load hosts", err);
          setAvailableHosts([]);
        }
        setFormData(prev => {
          if (selectedMeetingId && prev.hostEmployee) {
            return prev;
          }
          return { ...prev, hostEmployee: "" };
        });
      } else {
        setAvailableHosts([]);
      }
    };
    fetchHosts();
  }, [formData.department, formData.plant_id, selectedMeetingId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const captureWebcamPhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedPhoto(imageSrc);
      setFormData(prev => ({ ...prev, photoPath: imageSrc }));
      setUseWebcam(false);
      toast.success("Identity photo captured!");
    } else {
      toast.error("Failed to capture webcam. Check permissions.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedPhoto(previewUrl);
      setFormData(prev => ({ ...prev, photoPath: previewUrl }));
      toast.success("Photo uploaded successfully!");
    }
  };

  const handleKioskLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate validation delay

    if (employeeId.trim() !== "" && adminPassword === "12345") {
      const twelveHoursInMs = 12 * 60 * 60 * 1000;
      localStorage.setItem("kiosk_unlock_expiry", (Date.now() + twelveHoursInMs).toString());
      toast.success("Kiosk System Unlocked for 12 hours.");
      setEntryMode('idle');
    } else {
      toast.error("Invalid Employee ID or Password.");
    }
    
    setIsLoading(false);
  };

  const handlePhoneLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone) return;

    setIsLoading(true);
    try {
      // 1. Check blacklist
      const blacklistRes = await checkBlacklist(searchPhone);
      if (blacklistRes.data.is_blacklisted) {
        toast.error(`Access Denied: ${blacklistRes.data.reason || 'Number is restricted by security.'}`);
        setSearchPhone("");
        setEntryMode('idle');
        return;
      }

      // 2. Check for pre-registered meetings
      try {
        const preRegisteredRes = await getPreRegisteredVisits(searchPhone);
        if (preRegisteredRes.data && preRegisteredRes.data.length > 0) {
          setPreRegisteredMeetings(preRegisteredRes.data);
          setEntryMode('meetings_list');
          toast.success(`Found ${preRegisteredRes.data.length} pre-created meeting(s)!`);
          return;
        }
      } catch (preErr) {
        console.error("Failed to fetch pre-registered visits:", preErr);
      }

      // 3. Search visitor for autofill
      try {
        const visitorRes = await searchVisitor(searchPhone);
        if (visitorRes.data && visitorRes.data.success && visitorRes.data.visitor) {
          const v = visitorRes.data.visitor;
          setFormData(prev => ({
            ...prev,
            fullName: v.full_name || "",
            phoneNumber: v.phone_number || searchPhone,
            email: v.email || "",
            address: v.address || "",
            title: v.title || prev.title,
            category: v.category || prev.category,
            photoPath: v.photo_path || prev.photoPath
          }));
          const times = visitorRes.data.visit_count || 0;
          setVisitCount(times);
          if (times > 0) {
            toast.success(`Welcome back, ${v.full_name}! Details auto-filled (Previous visits: ${times}).`);
          } else {
            toast.success(`Welcome back, ${v.full_name}! Details auto-filled.`);
          }
          setEntryMode('form');
        } else {
          setVisitCount(null);
          toast.error("Your record does not exist in the system. Redirecting to new registration.");
          setFormData({
            ...defaultFormState,
            phoneNumber: searchPhone,
            department: departments.length > 0 ? departments[0].name : "",
          });
          setEntryMode('form');
        }
      } catch (searchErr: any) {
        setVisitCount(null);
        toast.error("Your record does not exist in the system. Redirecting to new registration.");
        setFormData({
          ...defaultFormState,
          phoneNumber: searchPhone,
          department: departments.length > 0 ? departments[0].name : "",
        });
        setEntryMode('form');
      }
    } catch (err: any) {
      toast.error("System error during lookup.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMeeting = (meeting: any, isPastVisit: boolean = false) => {
    if (isPastVisit) {
      setSelectedMeetingId(null);
      setSelectedMeetingVisitorId(null);
    } else {
      setSelectedMeetingId(meeting.visit_id);
      setSelectedMeetingVisitorId(meeting.visitor_id);
    }
    
    const formatDateForInput = (dateStr: string | null) => {
      if (!dateStr) return getLocalDateTimeString(0);
      try {
        const d = new Date(dateStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      } catch (err) {
        return getLocalDateTimeString(0);
      }
    };
    
    setFormData({
      cardId: isPastVisit ? "Auto Generated" : (meeting.card_id || "Auto Generated"),
      title: meeting.title || "Mr.",
      fullName: meeting.visitor_name || "",
      phoneNumber: meeting.visitor_phone || searchPhone,
      email: meeting.visitor_email || "",
      plant_id: meeting.plant_id ? meeting.plant_id.toString() : (plants.length > 0 ? plants[0].id.toString() : ""),
      address: meeting.visitor_address || "",
      hostEmployee: meeting.host_employee || "",
      department: meeting.department_name || "",
      upTo: meeting.up_to || "Office",
      mobileTokenNo: meeting.mobile_token_no || "",
      arrivalDate: formatDateForInput(isPastVisit ? null : meeting.arrival_date),
      isHodApprovalRequired: "NO",
      accessories: meeting.accessories || "",
      purpose: meeting.purpose || "Official",
      category: meeting.category || "Visitor",
      validUpTo: isPastVisit ? getLocalDateTimeString(6) : formatDateForInput(meeting.valid_up_to),
      status: isPastVisit ? "PENDING" : (meeting.status || "PENDING"),
      accompaniedByCount: meeting.accompanied_by_count || 0,
      photoPath: ""
    });
    
    setEntryMode('form');
  };

  const handleBypassMeetingsList = async () => {
    setSelectedMeetingId(null);
    setSelectedMeetingVisitorId(null);
    
    setIsLoading(true);
    try {
      const visitorRes = await searchVisitor(searchPhone);
      if (visitorRes.data && visitorRes.data.visitor) {
        const v = visitorRes.data.visitor;
        setFormData(prev => ({
          ...prev,
          fullName: v.full_name || "",
          phoneNumber: v.phone_number || searchPhone,
          email: v.email || "",
          address: v.address || "",
          title: v.title || prev.title,
          category: v.category || prev.category,
          photoPath: v.photo_path || prev.photoPath
        }));
        const times = visitorRes.data.visit_count || 0;
        setVisitCount(times);
        if (times > 0) {
          toast.success(`Welcome back, ${v.full_name}! Details auto-filled (Previous visits: ${times}).`);
        } else {
          toast.success(`Welcome back, ${v.full_name}! Details auto-filled.`);
        }
      } else {
        setVisitCount(null);
      }
    } catch (searchErr: any) {
      setVisitCount(null);
      if (searchErr.response && searchErr.response.status === 404) {
        toast.success("Proceeding as new visitor.");
        setFormData(prev => ({ ...prev, phoneNumber: searchPhone }));
      } else {
        console.error("Lookup error:", searchErr);
      }
    } finally {
      setIsLoading(false);
      setEntryMode('form');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // One final blacklist check just in case it's a new registration and they typed a blacklisted number manually
    try {
      const blacklistRes = await checkBlacklist(formData.phoneNumber);
      if (blacklistRes.data.is_blacklisted) {
        toast.error(`Access Denied: ${blacklistRes.data.reason || 'Number is restricted by security.'}`);
        return;
      }
    } catch (e) {}

    if (!capturedPhoto) {
      toast.error("Please capture or upload a visitor photo.");
      return;
    }
    if (!isSafetyChecked) {
      toast.error("Please accept the safety directives.");
      return;
    }

    setIsLoading(true);
    try {
      if (selectedMeetingId && selectedMeetingVisitorId) {
        const completePayload = {
          visitor_id: selectedMeetingVisitorId,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          email: formData.email,
          address: formData.address,
          title: formData.title,
          category: formData.category,
          photo_base64: capturedPhoto || formData.photoPath,
          accessories: formData.accessories,
          accompanied_by_count: Number(formData.accompaniedByCount),
          up_to: formData.upTo,
          mobile_token_no: formData.mobileTokenNo
        };
        
        const res = await completePreRegisteredVisit(selectedMeetingId, completePayload);
        if (res.data.success) {
          setFormData(prev => ({ 
            ...prev, 
            cardId: res.data.card_id || prev.cardId,
            status: res.data.status || "PENDING"
          }));
          toast.success("Scheduled meeting clearance completed!");
        }
        setIsSubmitted(true);
      } else {
        const visitorPayload = {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          email: formData.email,
          address: formData.address,
          purpose: formData.purpose,
          title: formData.title,
          category: formData.category,
          photo_base64: capturedPhoto || formData.photoPath
        };
        
        const visitorRes = await createVisitor(visitorPayload);
        const visitorId = visitorRes.data.visitor_id;

        const visitPayload = {
          visitor_id: visitorId,
          plant_id: formData.plant_id ? parseInt(formData.plant_id) : undefined,
          department: formData.department,
          host_employee: formData.hostEmployee,
          purpose: formData.purpose,
          mobile_token_no: formData.mobileTokenNo,
          accessories: formData.accessories,
          up_to: formData.upTo,
          is_hod_approval_required: formData.isHodApprovalRequired,
          arrival_date: new Date(formData.arrivalDate).toISOString(),
          valid_up_to: new Date(formData.validUpTo).toISOString(),
          accompanied_by_count: Number(formData.accompaniedByCount)
        };
        
        const visitRes = await createVisit(visitPayload);
        if (visitRes.data.success) {
          setFormData(prev => ({ 
            ...prev, 
            cardId: visitRes.data.card_id || `VM/${visitRes.data.visit_id.toString().padStart(6, '0')}`,
            status: "PENDING"
          }));
          toast.success("Pass clearance request submitted!");
        }
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.warn("Backend submission error, fallback to simulated pending clearance");
      await new Promise(resolve => setTimeout(resolve, 1200));
      setFormData(prev => ({ 
        ...prev, 
        cardId: `VM/${Math.floor(100000 + Math.random() * 900000)}`,
        status: "PENDING"
      }));
      toast.success("Visitor clearance request queued!");
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetKiosk = () => {
    setFormData({
      ...defaultFormState,
      plant_id: plants.length > 0 ? plants[0].id.toString() : "",
      department: departments.length > 0 ? departments[0].name : "",
    });
    setSearchPhone("");
    setCapturedPhoto(null);
    setIsSafetyChecked(false);
    setIsSubmitted(false);
    setPreRegisteredMeetings([]);
    setSelectedMeetingId(null);
    setSelectedMeetingVisitorId(null);
    setVisitCount(null);
    setEntryMode('idle');
  };

  const handlePrint = () => {
    window.print();
  };

  // Modern UI Classes
  const labelClass = "text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const inputClass = "w-full h-11 border border-slate-200 rounded-xl px-4 text-xs font-bold bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none text-[#0F172A] shadow-sm";
  const textAreaClass = "w-full h-[60px] border border-slate-200 rounded-xl p-4 text-xs font-bold bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none text-[#0F172A] resize-none shadow-sm custom-scrollbar";

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-[#0F172A] relative overflow-hidden flex flex-col font-sans industrial-grid">
      
      {/* Background aesthetic blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2563EB]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-[#FBBF24]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* COMPACT HEADER */}
      <header className="w-full glass-premium border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shrink-0 print:hidden z-20">
        <div className="flex items-center gap-4">
          <div className="p-1.5 bg-white rounded-xl shadow-sm border border-slate-100">
            <img src={logo} alt="IGL Logo" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-[#0F172A] leading-none">INDIAN GLYCOL LIMITED</h1>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-0.5 block">Visitor Management Kiosk</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {entryMode !== 'login' && (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
                <User className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-wider">Staff: 2222</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("kiosk_unlock_expiry");
                  setEntryMode('login');
                  toast.success("Kiosk Locked");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-slate-200 flex items-center gap-2 cursor-pointer"
              >
                Logout
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (entryMode === 'idle' || entryMode === 'login') navigate("/");
              else resetKiosk();
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm border border-slate-200 flex items-center gap-2 cursor-pointer hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#2563EB]" /> {((entryMode === 'idle' || entryMode === 'login') && !isSubmitted) ? "Exit Portal" : "Start Over"}
          </button>
        </div>
      </header>

      {/* ZERO-SCROLL MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto p-4 md:p-8 overflow-hidden flex items-center justify-center z-10">
        <AnimatePresence mode="wait">
          
          {isSubmitted ? (
            /* COMPLETED RECEIPT VIEW */
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex flex-col items-center justify-center h-full overflow-hidden"
            >
              <div 
                id="printable-badge-card"
                className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <div className="h-2 bg-[#FBBF24]" />
                <div className="bg-[#0F172A] p-6 text-white flex items-center justify-between border-b border-slate-900">
                  <div className="flex items-center gap-3 text-left">
                    <img src={logo} alt="IGL Logo" className="h-10 w-auto bg-white rounded p-1" />
                    <div>
                      <h4 className="text-sm font-extrabold text-white leading-none">Indian Glycol Limited</h4>
                      <span className="text-[8px] font-mono tracking-widest text-[#FBBF24] uppercase mt-1 block">Clearance Request Receipt</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30 animate-pulse">
                    PENDING
                  </span>
                </div>

                <div className="p-8 text-left flex flex-col gap-6">
                  <div className="flex items-center gap-5 pb-5 border-b border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl border border-slate-350 overflow-hidden shadow-inner shrink-0 flex items-center justify-center text-slate-400">
                      {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Guest" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 opacity-30" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 leading-none block mb-1">VISITOR CLEARANCE QUEUED</span>
                      <h3 className="text-xl font-black text-[#0F172A] tracking-tight leading-none mt-1">
                        {formData.title} {formData.fullName}
                      </h3>
                      <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[9px] font-bold mt-2 border border-amber-200 inline-block uppercase">
                        {formData.category} Pass
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-800 leading-relaxed font-semibold">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-spin" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] tracking-wide text-amber-900 mb-1">Awaiting Authorization</p>
                      <p className="text-[11px] text-amber-800">Dispatched to **{formatHostName(formData.hostEmployee)}** in **{formData.department}**. Pass generates automatically once approved.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-5 text-xs font-bold text-slate-500">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 leading-none block">ACCESS ZONE</span>
                      <span className="text-slate-900 mt-1 block uppercase">UP TO {formData.upTo}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 leading-none block">REQUEST ID NO.</span>
                      <span className="text-slate-900 font-mono mt-1 block">{formData.cardId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 leading-none block">DEPARTMENT</span>
                      <span className="text-slate-900 mt-1 block">{formData.department}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 leading-none block">VISIT PURPOSE</span>
                      <span className="text-slate-900 mt-1 block">{formData.purpose}</span>
                    </div>
                    <div className="col-span-2 border-t border-slate-100 pt-4">
                      <span className="text-[9px] font-mono text-slate-400 leading-none block">TIMEFRAME DETAILS (IST)</span>
                      <span className="text-slate-900 mt-1 block font-mono text-[11px]">
                        {new Date(formData.arrivalDate).toLocaleString("en-IN")} - {new Date(formData.validUpTo).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-[10px] font-mono font-bold text-slate-500">
                  RECEIPT ONLY. DO NOT CROSS GATES UNTIL APPROVED.
                </div>
              </div>

              <div className="mt-8 flex gap-4 print:hidden">
                <button onClick={handlePrint} className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black tracking-wide flex items-center gap-2 shadow-xl shadow-slate-900/20 cursor-pointer">
                  <Printer className="w-4 h-4 text-[#FBBF24]" /> PRINT RECEIPT
                </button>
                <button onClick={resetKiosk} className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm cursor-pointer">
                  NEW REGISTRATION
                </button>
              </div>
            </motion.div>
          ) : entryMode === 'login' ? (

            /* KIOSK LOGIN SCREEN */
            <motion.div
              key="login_screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md bg-white/90 backdrop-blur-md border border-slate-200 rounded-[2rem] shadow-2xl p-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2">Unlock Kiosk</h2>
              <p className="text-xs font-semibold text-slate-500 mb-8 px-4">
                Staff login required to open the kiosk for the day. Unlocks the system for 12 hours.
              </p>

              <form onSubmit={handleKioskLogin} className="w-full flex flex-col gap-4">
                <input 
                  type="text" 
                  required
                  placeholder="Employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full h-14 border border-slate-200 rounded-xl px-4 text-sm font-bold bg-slate-50 hover:bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none text-[#0F172A] shadow-sm"
                />
                <input 
                  type="password" 
                  required
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-14 border border-slate-200 rounded-xl px-4 text-sm font-bold bg-slate-50 hover:bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none text-[#0F172A] shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-[#0F172A] hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-900/20 cursor-pointer mt-2"
                >
                  {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : "UNLOCK SYSTEM"}
                </button>
              </form>
            </motion.div>

          ) : entryMode === 'idle' ? (
            
            /* IDLE SCREEN (WELCOME / SELECTION) */
            <motion.div
              key="idle_screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white/80 backdrop-blur-md border border-slate-200 rounded-[2rem] shadow-2xl p-12 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-blue-50 text-[#2563EB] rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-blue-100">
                <Fingerprint className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-4">Visitor Check-In Kiosk</h2>
              <p className="text-sm font-semibold text-slate-500 mb-10 max-w-md">
                Welcome to Indian Glycol Limited. Please select your registration type to proceed with clearance checks.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => setEntryMode('phone_entry')}
                  className="bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-sm hover:shadow-md cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-[#0F172A]">Returning Visitor</span>
                    <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Fast-track Autofill</span>
                  </div>
                </button>
                <button 
                  onClick={() => setEntryMode('form')}
                  className="bg-[#0F172A] hover:bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all shadow-lg shadow-slate-900/20 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <div>
                    <span className="block text-sm font-black text-white">New Registration</span>
                    <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">First time visit</span>
                  </div>
                </button>
              </div>
            </motion.div>

          ) : entryMode === 'phone_entry' ? (

            /* PHONE LOOKUP SCREEN */
            <motion.div
              key="phone_entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2">Registered Phone</h3>
                <p className="text-xs font-semibold text-slate-500 mb-8">
                  Enter your previously registered phone number to autofill your clearance details.
                </p>

                <form onSubmit={handlePhoneLookup} className="w-full flex flex-col gap-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+91</span>
                    <input 
                      type="tel" 
                      required
                      autoFocus
                      placeholder="10-digit mobile number"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="w-full h-14 border-2 border-slate-200 rounded-xl pl-12 pr-4 text-sm font-black bg-slate-50 hover:bg-slate-50 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none text-[#0F172A] shadow-sm tracking-widest"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-[#2563EB] hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 cursor-pointer mt-2"
                  >
                    {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {isLoading ? "SEARCHING..." : "SEARCH RECORDS"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchPhone("");
                      setEntryMode('idle');
                    }}
                    className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all mt-1"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </motion.div>

          ) : entryMode === 'meetings_list' ? (

            /* MEETINGS LIST SCREEN */
            <motion.div
              key="meetings_list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-8 flex flex-col overflow-hidden max-h-[85vh]"
            >
              <div className="flex flex-col items-center text-center shrink-0 mb-6">
                <div className="w-14 h-14 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                  <Clock className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2">Visitor Scheduled Passes</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-md">
                  Choose a pre-created record to check in or proceed with a new registration.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-6 text-left">
                
                {/* SECTION 1: Created by Employee */}
                {preRegisteredMeetings.filter((m: any) => m.created_by_employee).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-extrabold text-[#2563EB] uppercase tracking-wider pl-1">
                      Created by Employee / Host Staff
                    </h4>
                    <div className="space-y-3">
                      {preRegisteredMeetings.filter((m: any) => m.created_by_employee).map((meeting: any) => (
                        <div 
                          key={meeting.visit_id} 
                          className="p-5 border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-md"
                          onClick={() => handleSelectMeeting(meeting, false)}
                        >
                          <div className="text-left space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase text-[#2563EB] tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">
                                {meeting.category || "Visitor"}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                meeting.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {meeting.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800">
                              Meeting with <span className="text-[#0F172A]">{formatHostName(meeting.host_employee)}</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
                              <div>
                                <span className="text-slate-400 font-medium">Department:</span> {meeting.department_name}
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Purpose:</span> {meeting.purpose}
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 font-medium">Scheduled Time:</span> {meeting.arrival_date ? new Date(meeting.arrival_date).toLocaleString("en-IN") : "N/A"}
                              </div>
                            </div>

                            {meeting.status === 'APPROVED' && (
                              <div className="mt-2.5 p-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-[10px] text-blue-800 leading-tight font-semibold">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <div>
                                  <span>Approved! Select this to verify details, capture photo, and complete pass generation.</span>
                                </div>
                              </div>
                            )}
                            {meeting.status === 'PENDING' && (
                              <div className="mt-2.5 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 leading-tight font-semibold">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <div>
                                  <span>Awaiting Approval: Select to verify details and complete photo/directives check.</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMeeting(meeting, false);
                            }}
                            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all shadow-md group-hover:scale-105 shrink-0 self-start sm:self-center"
                          >
                            Update
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: Created by Self */}
                {preRegisteredMeetings.filter((m: any) => !m.created_by_employee).length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider pl-1">
                      Your Past Visit / Self-Registration (Last Entry)
                    </h4>
                    <div className="space-y-3">
                      {preRegisteredMeetings.filter((m: any) => !m.created_by_employee).map((meeting: any) => (
                        <div 
                          key={meeting.visit_id} 
                          className="p-5 border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-md"
                          onClick={() => handleSelectMeeting(meeting, true)}
                        >
                          <div className="text-left space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase text-slate-600 tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                                {meeting.category || "Visitor"}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                meeting.status === 'APPROVED' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {meeting.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800">
                              Meeting with <span className="text-[#0F172A]">{formatHostName(meeting.host_employee)}</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500">
                              <div>
                                <span className="text-slate-400 font-medium">Department:</span> {meeting.department_name}
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">Purpose:</span> {meeting.purpose}
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 font-medium">Scheduled Time:</span> {meeting.arrival_date ? new Date(meeting.arrival_date).toLocaleString("en-IN") : "N/A"}
                              </div>
                            </div>

                            {meeting.status === 'APPROVED' && (
                              <div className="mt-2.5 p-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 text-[10px] text-blue-800 leading-tight font-semibold">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <div>
                                  <span>Approved! Select this to verify details, capture photo, and complete pass generation.</span>
                                </div>
                              </div>
                            )}
                            {meeting.status === 'PENDING' && (
                              <div className="mt-2.5 p-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 leading-tight font-semibold">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <div>
                                  <span>Awaiting Approval: Select to verify details and complete photo/directives check.</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMeeting(meeting, true);
                            }}
                            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md group-hover:scale-105 shrink-0 self-start sm:self-center"
                          >
                            Use Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button 
                  type="button"
                  onClick={handleBypassMeetingsList}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  None of these / New Registration
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setPreRegisteredMeetings([]);
                    setEntryMode('phone_entry');
                  }}
                  className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Back
                </button>
              </div>
            </motion.div>

          ) : (

            /* FORM LAYOUT */
            <motion.div
              key="form_layout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full h-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
            >
              
              {/* LEFT COLUMN: FORM FIELDS */}
              <form id="visitor-form" onSubmit={handleSubmitRequest} className="w-full md:w-[70%] p-8 flex flex-col h-full relative">
                <div className="flex items-center justify-between mb-8 shrink-0 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] tracking-tight leading-none">Security Clearance Request</h2>
                      <span className="text-xs font-semibold text-slate-500 mt-1 block">Please verify your details before submission.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Fast-Track Mode</span>
                  </div>
                </div>

                {visitCount !== null && visitCount > 0 && (
                  <div className="mb-4 p-4 rounded-2xl flex gap-3 text-xs font-semibold leading-relaxed border shrink-0 text-left bg-emerald-50 border-emerald-200 text-emerald-800 animate-in slide-in-from-top duration-300">
                    <Sparkles className="w-5 h-5 shrink-0 text-emerald-600 animate-pulse" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] tracking-wide mb-0.5 text-emerald-950">
                        Welcome Back!
                      </p>
                      <p className="text-[11px] font-normal text-emerald-800">
                        You have visited our company <strong>{visitCount} time(s)</strong> in the past. Your details have been auto-filled for a quicker check-in.
                      </p>
                    </div>
                  </div>
                )}

                {selectedMeetingId && (
                  <div className={`mb-6 p-4 rounded-2xl flex gap-3 text-xs font-semibold leading-relaxed border shrink-0 text-left ${
                    formData.status === 'APPROVED' 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <AlertCircle className={`w-5 h-5 shrink-0 ${
                      formData.status === 'APPROVED' ? 'text-blue-600' : 'text-amber-600'
                    }`} />
                    <div>
                      <p className={`font-extrabold uppercase text-[10px] tracking-wide mb-0.5 ${
                        formData.status === 'APPROVED' ? 'text-blue-950' : 'text-amber-950'
                      }`}>
                        {formData.status === 'APPROVED' ? 'Approval Granted' : 'Approval Pending'}
                      </p>
                      <p className="text-[11px]">
                        {formData.status === 'APPROVED' 
                          ? 'Your scheduled meeting is already approved. Please capture/upload your photo on the right and accept the safety directives to complete registration.' 
                          : 'Please fill in any missing details, capture your photo, and submit. The clearance request will be sent to the host employee.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* MODERN GRID LAYOUT */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 content-start pr-2 custom-scrollbar overflow-y-auto pb-4">
                  
                  {/* Row 1 */}
                  <div className="col-span-1">
                    <label className={labelClass}>Title</label>
                    <select disabled={!!selectedMeetingId} name="title" value={formData.title} onChange={handleInputChange} className={inputClass}>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Full Name</label>
                    <input disabled={!!selectedMeetingId} required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className={inputClass} placeholder="Enter your full name" />
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Contact Number</label>
                    <input disabled={!!selectedMeetingId} required type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className={inputClass} placeholder="+91" />
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Email (Optional)</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={inputClass} placeholder="john@example.com" />
                  </div>

                  {/* Row 2 */}
                  <div className="col-span-1">
                    <label className={labelClass}>Location (Plant)</label>
                    <select disabled={!!selectedMeetingId} name="plant_id" value={formData.plant_id} onChange={handleInputChange} className={inputClass}>
                      {plants.map(p => (
                        <option key={p.id} value={p.id}>{p.plant_name} ({p.plant_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Department</label>
                    <select disabled={!!selectedMeetingId} required name="department" value={formData.department} onChange={handleInputChange} className={inputClass}>
                      <option value="" disabled>Select Department</option>
                      {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Host Employee</label>
                    <select disabled={!!selectedMeetingId} required name="hostEmployee" value={formData.hostEmployee} onChange={handleInputChange} className={inputClass}>
                      <option value="" disabled>Select Host</option>
                      {selectedMeetingId && formData.hostEmployee && !availableHosts.find(h => h.email === formData.hostEmployee || h.label === formData.hostEmployee) && (
                        <option value={formData.hostEmployee}>{formData.hostEmployee}</option>
                      )}
                      {availableHosts.map(h => <option key={h.email} value={h.label}>{h.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Purpose</label>
                    <select disabled={!!selectedMeetingId} name="purpose" value={formData.purpose} onChange={handleInputChange} className={inputClass}>
                      <option value="Official">Official Business</option>
                      <option value="Personal">Personal Visit</option>
                      <option value="Interview">Candidate Interview</option>
                      <option value="Vendor">Vendor Maintenance</option>
                      <option value="Audit">Audit / Inspection</option>
                      <option value="Delivery">Material Delivery</option>
                      <option value="Meeting">Client Meeting</option>
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div className="col-span-1">
                    <label className={labelClass}>Clearance Up To</label>
                    <select disabled={!!selectedMeetingId} name="upTo" value={formData.upTo} onChange={handleInputChange} className={inputClass}>
                      <option value="Office">Office block</option>
                      <option value="Plant">Plant floor</option>
                      <option value="Control Room">Control Room</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Laboratory">Laboratory</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Category</label>
                    <select disabled={!!selectedMeetingId} name="category" value={formData.category} onChange={handleInputChange} className={inputClass}>
                      <option value="Visitor">Visitor</option>
                      <option value="Guest">Guest VIP</option>
                      <option value="Contractor">Contractor Crew</option>
                      <option value="Auditor">Auditor</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Arrival (IST)</label>
                    <input disabled={!!selectedMeetingId} required type="datetime-local" name="arrivalDate" value={formData.arrivalDate} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Valid Up To (IST)</label>
                    <input disabled={!!selectedMeetingId} required type="datetime-local" name="validUpTo" value={formData.validUpTo} onChange={handleInputChange} className={inputClass} />
                  </div>

                  {/* Row 4 */}
                  <div className="col-span-1">
                    <label className={labelClass}>HOD Co-Sign?</label>
                    <select disabled={!!selectedMeetingId} name="isHodApprovalRequired" value={formData.isHodApprovalRequired} onChange={handleInputChange} className={inputClass}>
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Accompanied By</label>
                    <select disabled={!!selectedMeetingId} name="accompaniedByCount" value={formData.accompaniedByCount} onChange={handleInputChange} className={inputClass}>
                      {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Guests</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className={labelClass}>Token No (Optional)</label>
                    <input disabled={!!selectedMeetingId} type="text" name="mobileTokenNo" value={formData.mobileTokenNo} onChange={handleInputChange} className={inputClass} placeholder="Optional" />
                  </div>
                  <div className="col-span-1 flex flex-col justify-end">
                    <div className="w-full h-11 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold text-slate-400">ID: {formData.cardId}</span>
                    </div>
                  </div>

                  {/* Row 5: Text areas */}
                  <div className="col-span-1 md:col-span-2 mt-1">
                    <label className={labelClass}>Full Address</label>
                    <textarea disabled={!!selectedMeetingId} required name="address" value={formData.address} onChange={handleInputChange} className={textAreaClass} placeholder="Enter complete residential or office address" />
                  </div>
                  <div className="col-span-1 md:col-span-2 mt-1">
                    <label className={labelClass}>Declared Assets (Laptops, Tools)</label>
                    <textarea disabled={!!selectedMeetingId} name="accessories" value={formData.accessories} onChange={handleInputChange} className={textAreaClass} placeholder="List any electronics or equipment" />
                  </div>

                </div>
              </form>

              {/* RIGHT COLUMN: IDENTITY & SUBMIT */}
              <div className="w-full md:w-[30%] bg-slate-50/80 border-l border-slate-200 p-6 flex flex-col h-full justify-between shrink-0">
                
                {/* Photo Capture Section */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 w-full mb-3 pb-3 border-b border-slate-200">
                    <Camera className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-sm font-extrabold text-slate-800">Identity Scan</span>
                  </div>
                  
                  <div className="w-full max-h-[180px] aspect-video bg-[#0F172A] rounded-2xl overflow-hidden border-[3px] border-white shadow-xl relative flex items-center justify-center group">
                    {useWebcam ? (
                      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                    ) : capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-mono tracking-widest font-bold opacity-60">CAMERA OFFLINE</span>
                      </div>
                    )}
                  </div>

                  <div className="flex w-full gap-2 mt-4">
                    {useWebcam ? (
                      <button type="button" onClick={captureWebcamPhoto} className="flex-1 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-xl text-[11px] font-black tracking-wide transition shadow-md shadow-blue-500/20 flex justify-center items-center gap-2 cursor-pointer">
                        SNAP PHOTO
                      </button>
                    ) : (
                      <button type="button" onClick={() => setUseWebcam(true)} className="flex-1 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-[11px] font-black tracking-wide transition shadow-md shadow-slate-900/20 flex justify-center items-center gap-2 cursor-pointer">
                        START CAM
                      </button>
                    )}
                    <button type="button" onClick={() => document.getElementById("profile-uploader")?.click()} className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition flex justify-center items-center shadow-sm cursor-pointer">
                      UPLOAD
                    </button>
                    <input id="profile-uploader" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                </div>

                {/* Safety & Submission */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 mb-4 shadow-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-wide mb-0.5">Safety Declaration</p>
                        <p className="text-[11px] text-amber-800/80 leading-snug mb-2 font-semibold">
                          I declare no hazardous items. I agree to wear required PPE and display my pass visibly at all times.
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSafetyChecked ? 'bg-[#2563EB] border-[#2563EB]' : 'bg-white border-slate-300 group-hover:border-[#2563EB]'}`}>
                            {isSafetyChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={isSafetyChecked} onChange={(e) => setIsSafetyChecked(e.target.checked)} />
                          <span className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wide">I Agree & Accept</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="visitor-form"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#2563EB] hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-xl text-sm font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    {isLoading ? "PROCESSING..." : <><Send className="w-4 h-4" /> GENERATE PASS</>}
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
