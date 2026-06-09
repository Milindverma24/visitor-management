import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Camera, Search, Check, UploadCloud, UserPlus, ArrowLeft, Truck } from "lucide-react";
import Webcam from "react-webcam";
import { createVisit } from "@/services/visitService";
import { createVisitor } from "@/services/visitorService";
import { getDepartments } from "@/services/departmentService";
import { uploadAadhaar } from "@/services/ocrService";
import { getUsers } from "@/services/userService";
import toast from "react-hot-toast";

const VEHICLE_TYPES = ["TRUCK", "TANKER", "TEMPO", "MINI_TRUCK", "TRAILER", "CONTAINER", "VENDOR", "PRIVATE"];
const VEHICLE_PURPOSES = ["MATERIAL DELIVERY", "MATERIAL PICKUP", "WASTE DISPOSAL", "MAINTENANCE", "OTHER"];

const VisitorRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableHosts, setAvailableHosts] = useState<string[]>([]);
  
  const [registrationType, setRegistrationType] = useState<"visitor" | "vehicle">("visitor");

  const [formData, setFormData] = useState({
    cardId: "Auto Generated",
    title: "Mr.",
    fullName: "",
    phoneNumber: "",
    email: "",
    location: "Kashipur",
    address: "",
    hostEmployee: "",
    department: "",
    upTo: "Office",
    mobileTokenNo: "",
    arrivalDate: new Date().toISOString().slice(0, 16),
    isHodApprovalRequired: "NO",
    accessories: "",
    purpose: "Official",
    category: "Visitor",
    validUpTo: new Date(new Date().setHours(18, 0, 0, 0)).toISOString().slice(0, 16),
    status: "Open",
    accompaniedByCount: 0,
    photoPath: "",
    
    // Vehicle-specific fields
    vehicleNumber: "",
    vehicleType: "TRUCK",
    transportCompany: "",
    driverName: "",
    driverPhone: "",
    driverEmail: ""
  });

  const [useWebcam, setUseWebcam] = useState(false);

  // Load URL search parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get("type");
    
    if (typeParam === "vehicle") {
      setRegistrationType("vehicle");
      
      const vNum = searchParams.get("vehicle_number") || "";
      const vType = searchParams.get("vehicle_type") || "TRUCK";
      const dName = searchParams.get("driver_name") || "";
      const dPhone = searchParams.get("driver_mobile") || "";
      const dEmail = searchParams.get("driver_email") || "";
      const tCompany = searchParams.get("transport_company") || "";
      
      const nextDayStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      setFormData(prev => ({
        ...prev,
        category: "DRIVER",
        purpose: "MATERIAL DELIVERY",
        upTo: "Warehouse",
        validUpTo: nextDayStr,
        vehicleNumber: vNum.toUpperCase(),
        vehicleType: vType,
        driverName: dName,
        driverPhone: dPhone,
        driverEmail: dEmail,
        transportCompany: tCompany,
        fullName: dName,
        phoneNumber: dPhone,
        email: dEmail,
        company: tCompany
      }));
    } else {
      setRegistrationType("visitor");
    }
  }, []);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        const activeDepts = res.data.filter((d: any) => d.is_active);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          const searchParams = new URLSearchParams(window.location.search);
          const typeParam = searchParams.get("type");
          const targetDeptName = (typeParam === "vehicle" || registrationType === "vehicle") ? "Transport" : "";
          const defaultDept = activeDepts.find((d: any) => d.name.toLowerCase() === targetDeptName.toLowerCase()) || activeDepts[0];
          setFormData(prev => ({ ...prev, department: defaultDept.name }));
        }
      } catch (err) {
        console.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, [registrationType]);

  useEffect(() => {
    const fetchHosts = async () => {
      if (formData.department) {
        try {
          const res = await getUsers({ department_name: formData.department });
          if (res.data && res.data.length > 0) {
            const hostList = res.data.map((u: any) => `${u.full_name} (${u.role.replace("_", " ")}, ${formData.department})`);
            setAvailableHosts(hostList);
            setFormData(prev => {
              const currentInList = hostList.includes(prev.hostEmployee);
              return {
                ...prev,
                hostEmployee: currentInList ? prev.hostEmployee : hostList[0]
              };
            });
          } else {
            setAvailableHosts([]);
            setFormData(prev => ({ ...prev, hostEmployee: "" }));
          }
        } catch (err) {
          console.error("Failed to load hosts", err);
          setAvailableHosts([]);
          setFormData(prev => ({ ...prev, hostEmployee: "" }));
        }
      }
    };
    fetchHosts();
  }, [formData.department]);

  const capturePhoto = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFormData(prev => ({ ...prev, photoPath: imageSrc }));
      toast.success("Photo captured!");
      setUseWebcam(false);
    }
  }, [webcamRef]);

  const handleAadhaarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsLoading(true);
      
      const uploadData = new FormData();
      uploadData.append("file", file);
      
      try {
        const res = await uploadAadhaar(uploadData);
        if (res.data) {
          setFormData((prev) => ({
            ...prev,
            fullName: res.data.full_name || prev.fullName,
            photoPath: res.data.photo_path || prev.photoPath,
          }));
          toast.success("Aadhaar scanned successfully!");
        }
      } catch (error: any) {
        console.error("OCR Error:", error);
        toast.error("Failed to parse Aadhaar");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (registrationType === "vehicle") {
        if (!formData.vehicleNumber) {
          toast.error("Vehicle Number is mandatory!");
          setIsLoading(false);
          return;
        }
        if (!formData.driverName || !formData.driverPhone) {
          toast.error("Driver Name and Driver Phone are mandatory!");
          setIsLoading(false);
          return;
        }

        const visitorPayload = {
          full_name: formData.driverName,
          phone_number: formData.driverPhone,
          email: formData.driverEmail,
          address: formData.address || "KASHIPUR PLANT",
          purpose: formData.purpose,
          title: "Mr.",
          category: "DRIVER",
          photo_base64: formData.photoPath
        };
        
        const visitorRes = await createVisitor(visitorPayload);
        const visitorId = visitorRes.data.visitor_id;

        const visitPayload = {
          visitor_id: visitorId,
          department: formData.department,
          host_employee: formData.hostEmployee,
          purpose: `[${formData.vehicleNumber.toUpperCase()}] - ${formData.purpose}`,
          mobile_token_no: formData.mobileTokenNo,
          accessories: formData.accessories,
          up_to: formData.upTo,
          is_hod_approval_required: formData.isHodApprovalRequired,
          valid_up_to: new Date(formData.validUpTo).toISOString(),
          accompanied_by_count: 0,
          pass_type: "VENDOR_PASS"
        };
        
        await createVisit(visitPayload);
      } else {
        const visitorPayload = {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          email: formData.email,
          address: formData.address,
          purpose: formData.purpose,
          title: formData.title,
          category: formData.category,
          photo_base64: formData.photoPath
        };
        
        const visitorRes = await createVisitor(visitorPayload);
        const visitorId = visitorRes.data.visitor_id;

        const visitPayload = {
          visitor_id: visitorId,
          department: formData.department,
          host_employee: formData.hostEmployee,
          purpose: formData.purpose,
          mobile_token_no: formData.mobileTokenNo,
          accessories: formData.accessories,
          up_to: formData.upTo,
          is_hod_approval_required: formData.isHodApprovalRequired,
          valid_up_to: new Date(formData.validUpTo).toISOString(),
          accompanied_by_count: Number(formData.accompaniedByCount),
          pass_type: "VISITOR_PASS"
        };
        
        await createVisit(visitPayload);
      }
      setSubmitted(true);
      toast.success("Pass Request Submitted successfully!");
      
    } catch (error) {
      toast.error("Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cardId: "Auto Generated",
      title: "Mr.",
      fullName: "",
      phoneNumber: "",
      email: "",
      location: "Kashipur",
      address: "",
      hostEmployee: "",
      department: departments.length > 0 ? departments[0].name : "",
      upTo: "Office",
      mobileTokenNo: "",
      arrivalDate: new Date().toISOString().slice(0, 16),
      isHodApprovalRequired: "NO",
      accessories: "",
      purpose: registrationType === "vehicle" ? "MATERIAL DELIVERY" : "Official",
      category: registrationType === "vehicle" ? "DRIVER" : "Visitor",
      validUpTo: new Date(new Date().setHours(18, 0, 0, 0)).toISOString().slice(0, 16),
      status: "Open",
      accompaniedByCount: 0,
      photoPath: "",
      vehicleNumber: "",
      vehicleType: "TRUCK",
      transportCompany: "",
      driverName: "",
      driverPhone: "",
      driverEmail: ""
    });
    setSubmitted(false);
  };

  const handleBack = () => {
    window.location.href = "/approvals";
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <Card className="w-full max-w-md p-10 text-center shadow-xl border-0 rounded-2xl">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Submitted Successfully!</h2>
          <p className="text-slate-500 mb-8 text-lg">The pass request has been recorded and is pending approval.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={resetForm} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full text-white shadow-md">
              <UserPlus className="w-5 h-5 mr-2" /> Register Another {registrationType === "vehicle" ? "Vehicle" : "Visitor"}
            </Button>
            <Button variant="outline" onClick={handleBack} size="lg" className="w-full shadow-sm text-slate-700">
              <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const InputClass = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors";
  const LabelClass = "text-sm font-medium text-slate-700 mb-1.5 block";

  return (
    <div className="w-full max-w-5xl mx-auto py-6 animate-in fade-in duration-500">
      <Card className="shadow-lg border-0 bg-white rounded-xl overflow-hidden">
        {/* Modern Header */}
        <div className={`p-6 text-white flex items-center justify-between transition-all ${registrationType === "vehicle" ? "bg-gradient-to-r from-orange-600 to-amber-600" : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white rounded-lg p-1 shadow-sm flex items-center justify-center shrink-0">
              <img src="/uploads/company_logo.png" alt="IGL" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold tracking-tight">{registrationType === "vehicle" ? "Vehicle Pass Request Entry" : "Visitor Information Entry"}</h2>
              <p className="text-blue-50 mt-1 text-sm">Please provide the details below to initiate approval</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleBack} className="bg-white/10 hover:bg-white/20 border-white/20 text-white shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <CardContent className="p-8">
          {/* Segment Selector Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl w-full max-w-md mx-auto mb-8 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setRegistrationType("visitor");
                const firstDept = departments[0]?.name || "Human Resources";
                const endOfDayStr = new Date(new Date().setHours(18, 0, 0, 0)).toISOString().slice(0, 16);
                setFormData(prev => ({
                  ...prev,
                  category: "Visitor",
                  purpose: "Official",
                  upTo: "Office",
                  department: firstDept,
                  validUpTo: endOfDayStr
                }));
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${registrationType === "visitor" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
            >
              <UserPlus className="w-4 h-4" />
              Visitor Pass Form
            </button>
            <button
              type="button"
              onClick={() => {
                setRegistrationType("vehicle");
                const transDeptName = departments.find((d: any) => d.name.toLowerCase() === "transport")?.name || (departments[0]?.name || "Transport");
                const nextDayStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
                setFormData(prev => ({
                  ...prev,
                  category: "DRIVER",
                  purpose: "MATERIAL DELIVERY",
                  upTo: "Warehouse",
                  department: transDeptName,
                  validUpTo: nextDayStr
                }));
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${registrationType === "vehicle" ? "bg-white text-orange-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Truck className="w-4 h-4" />
              Vehicle Pass Form
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
              
              {/* LEFT COLUMN */}
              {registrationType === "visitor" ? (
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className={LabelClass}>Card ID</label>
                      <Input readOnly value={formData.cardId} className="h-10 bg-slate-50 text-slate-500 font-mono" />
                    </div>
                    <div className="w-2/3">
                      <label className={LabelClass}>Arrival Date <span className="text-red-500">*</span></label>
                      <Input required type="datetime-local" name="arrivalDate" value={formData.arrivalDate} onChange={handleInputChange} className={InputClass} />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className={LabelClass}>Title <span className="text-red-500">*</span></label>
                      <select name="title" value={formData.title} onChange={handleInputChange} className={InputClass}>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                    </div>
                    <div className="w-2/3">
                      <label className={LabelClass}>Visitor Name <span className="text-red-500">*</span></label>
                      <Input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full Name" className={InputClass} />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Contact No. <span className="text-red-500">*</span></label>
                      <Input required name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Phone" className={InputClass} />
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Email Address</label>
                      <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className={InputClass} />
                    </div>
                  </div>

                  <div>
                    <label className={LabelClass}>Address <span className="text-red-500">*</span></label>
                    <textarea required name="address" value={formData.address} onChange={handleInputChange} placeholder="Full Address" className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px] resize-y transition-colors" />
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Location</label>
                      <select name="location" value={formData.location} onChange={handleInputChange} className={InputClass}>
                        <option value="Kashipur">Kashipur</option>
                        <option value="Gorakhpur">Gorakhpur</option>
                        <option value="Noida">Noida</option>
                        <option value="Dehradun">Dehradun</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Department <span className="text-red-500">*</span></label>
                      <select name="department" value={formData.department} onChange={handleInputChange} className={InputClass} required>
                        <option value="" disabled>Select Dept</option>
                        {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LabelClass}>Person To Meet (Host) <span className="text-red-500">*</span></label>
                    <select required name="hostEmployee" value={formData.hostEmployee} onChange={handleInputChange} className={InputClass}>
                      <option value="" disabled>Select Host</option>
                      {availableHosts.map((h: any) => <option key={h} value={h}>{h}</option>)}
                      {availableHosts.length === 0 && (
                        <option value="" disabled>No hosts available in this department</option>
                      )}
                    </select>
                  </div>
                </div>
              ) : (
                /* VEHICLE FORM LEFT COLUMN */
                <div className="space-y-5">
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <label className={LabelClass}>Card ID</label>
                      <Input readOnly value="Auto Generated" className="h-10 bg-slate-50 text-slate-500 font-mono" />
                    </div>
                    <div className="w-2/3">
                      <label className={LabelClass}>Arrival Date <span className="text-red-500">*</span></label>
                      <Input required type="datetime-local" name="arrivalDate" value={formData.arrivalDate} onChange={handleInputChange} className={InputClass} />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Vehicle Number <span className="text-red-500">*</span></label>
                      <Input
                        required
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                        placeholder="e.g. DL 1M 1234"
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none uppercase font-mono font-bold"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Vehicle Type <span className="text-red-500">*</span></label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className={InputClass}
                      >
                        {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Driver Name <span className="text-red-500">*</span></label>
                      <Input
                        required
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleInputChange}
                        placeholder="Driver Name"
                        className={InputClass}
                      />
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Driver Phone <span className="text-red-500">*</span></label>
                      <Input
                        required
                        name="driverPhone"
                        value={formData.driverPhone}
                        onChange={handleInputChange}
                        placeholder="Driver Mobile"
                        className={InputClass}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Transport Company</label>
                      <Input
                        name="transportCompany"
                        value={formData.transportCompany}
                        onChange={handleInputChange}
                        placeholder="Transport Company"
                        className={InputClass}
                      />
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Driver Email</label>
                      <Input
                        type="email"
                        name="driverEmail"
                        value={formData.driverEmail}
                        onChange={handleInputChange}
                        placeholder="driver@example.com"
                        className={InputClass}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className={LabelClass}>Location</label>
                      <select name="location" value={formData.location} onChange={handleInputChange} className={InputClass}>
                        <option value="Kashipur">Kashipur</option>
                        <option value="Gorakhpur">Gorakhpur</option>
                        <option value="Noida">Noida</option>
                        <option value="Dehradun">Dehradun</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className={LabelClass}>Department <span className="text-red-500">*</span></label>
                      <select name="department" value={formData.department} onChange={handleInputChange} className={InputClass} required>
                        <option value="" disabled>Select Dept</option>
                        {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={LabelClass}>Person To Meet (Host) <span className="text-red-500">*</span></label>
                    <select required name="hostEmployee" value={formData.hostEmployee} onChange={handleInputChange} className={InputClass}>
                      <option value="" disabled>Select Host</option>
                      {availableHosts.map((h: any) => <option key={h} value={h}>{h}</option>)}
                      {availableHosts.length === 0 && (
                        <option value="" disabled>No hosts available in this department</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
              
              {/* RIGHT COLUMN (VISITOR VS VEHICLE) */}
              <div className="space-y-5">
                <div>
                  <label className={LabelClass}>Accessories (If Any)</label>
                  <textarea name="accessories" value={formData.accessories} onChange={handleInputChange} placeholder={registrationType === "vehicle" ? "Material papers, tools, etc." : "Laptops, tools, etc."} className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px] resize-y transition-colors" />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Up To</label>
                    <select name="upTo" value={formData.upTo} onChange={handleInputChange} className={InputClass}>
                      <option value="Office">Office</option>
                      <option value="Plant">Plant</option>
                      <option value="Control Room">Control Room</option>
                      <option value="Warehouse">Warehouse & Logistics</option>
                      <option value="Laboratory">Laboratory & R&D</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>Category</label>
                    {registrationType === "visitor" ? (
                      <select name="category" value={formData.category} onChange={handleInputChange} className={InputClass}>
                        <option value="Visitor">Visitor</option>
                        <option value="Guest">Guest VIP</option>
                        <option value="Contractor">Contractor Crew</option>
                        <option value="Auditor">Auditor / Inspector</option>
                        <option value="Delivery">Delivery / Courier</option>
                        <option value="Intern">Intern / Trainee</option>
                      </select>
                    ) : (
                      <select name="category" value="DRIVER" className={`${InputClass} bg-slate-50 text-slate-500`} disabled>
                        <option value="DRIVER">Driver / Transporter</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Purpose</label>
                    {registrationType === "visitor" ? (
                      <select name="purpose" value={formData.purpose} onChange={handleInputChange} className={InputClass}>
                        <option value="Official">Official Business</option>
                        <option value="Personal">Personal Visit</option>
                        <option value="Interview">HR Candidate Interview</option>
                        <option value="Vendor">Vendor Maintenance</option>
                        <option value="Audit">Audit / Inspection</option>
                        <option value="Delivery">Material Delivery</option>
                        <option value="Meeting">Client / Partner Meeting</option>
                        <option value="Training">Training Program</option>
                      </select>
                    ) : (
                      <select name="purpose" value={formData.purpose} onChange={handleInputChange} className={InputClass}>
                        {VEHICLE_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>Mobile Token No.</label>
                    <Input name="mobileTokenNo" value={formData.mobileTokenNo} onChange={handleInputChange} placeholder="Token" className={InputClass} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Valid Up To <span className="text-red-500">*</span></label>
                    <Input required type="datetime-local" name="validUpTo" value={formData.validUpTo} onChange={handleInputChange} className={InputClass} />
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>HOD Approval?</label>
                    <select name="isHodApprovalRequired" value={formData.isHodApprovalRequired} onChange={handleInputChange} className={InputClass}>
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className={`${InputClass} bg-amber-50`} disabled>
                      <option value="Open">Open</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>Accompanied By (Count)</label>
                    {registrationType === "visitor" ? (
                      <select name="accompaniedByCount" value={formData.accompaniedByCount} onChange={handleInputChange} className={InputClass}>
                        {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <select name="accompaniedByCount" value="0" className={`${InputClass} bg-slate-50 text-slate-500`} disabled>
                        <option value="0">0</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* PHOTO/VISUAL VERIFICATION BLOCK */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <label className="text-sm font-bold text-slate-800 mb-1 block">
                    {registrationType === "vehicle" ? "Driver Image Verification" : "Visitor Image Verification"}
                    <span className="text-slate-400 font-normal text-xs ml-2">(Optional for Admins)</span>
                  </label>
                  <div className="flex items-start gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50 text-left">
                    {useWebcam ? (
                      <div className="w-32 h-32 bg-black rounded-lg overflow-hidden relative shadow-inner shrink-0 border border-slate-300">
                         <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-white flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-xs overflow-hidden shrink-0">
                        {formData.photoPath ? (
                          <img src={formData.photoPath} alt="verification" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="w-6 h-6 mb-2 opacity-50" />
                            <span>No Photo</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 justify-center h-32">
                      {useWebcam ? (
                        <Button type="button" onClick={capturePhoto} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full">
                           <Camera className="w-4 h-4 mr-2" /> Capture
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={() => setUseWebcam(true)} className="bg-white shadow-sm w-full">
                          <Camera className="w-4 h-4 mr-2 text-blue-600" /> Live WebCam
                        </Button>
                      )}
                      
                      {registrationType === "visitor" && (
                        <div className="relative w-full">
                          <Button type="button" variant="outline" onClick={() => document.getElementById('aadhaar-upload')?.click()} className="bg-white shadow-sm w-full">
                            <UploadCloud className="w-4 h-4 mr-2 text-blue-600" /> Aadhaar Scan
                          </Button>
                          <input id="aadhaar-upload" type="file" accept="image/*" className="hidden" onChange={handleAadhaarUpload} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-10 flex justify-end items-center gap-4 border-t pt-6">
              <span className="text-red-500 text-xs font-medium mr-auto">* Mandatory Field</span>
              <Button type="submit" isLoading={isLoading} size="lg" className={`${registrationType === "vehicle" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"} text-white shadow-md px-8 rounded-lg`}>
                Submit Request
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorRegistration;