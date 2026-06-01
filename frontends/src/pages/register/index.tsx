import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Camera, Search, Check, UploadCloud, UserPlus, ArrowLeft } from "lucide-react";
import Webcam from "react-webcam";
import { createVisit } from "@/services/visitService";
import { createVisitor } from "@/services/visitorService";
import { getDepartments } from "@/services/departmentService";
import { uploadAadhaar } from "@/services/ocrService";
import toast from "react-hot-toast";

const VisitorRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const webcamRef = React.useRef<Webcam>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableHosts, setAvailableHosts] = useState<string[]>([]);
  
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
  });

  const [useWebcam, setUseWebcam] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        const activeDepts = res.data.filter((d: any) => d.is_active);
        setDepartments(activeDepts);
        if (activeDepts.length > 0) {
          setFormData(prev => ({ ...prev, department: activeDepts[0].name }));
        }
      } catch (err) {
        console.error("Failed to load departments");
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (formData.department) {
      setAvailableHosts([
        `Manager 1 (${formData.department})`,
        `Manager 2 (${formData.department})`,
        `Executive (${formData.department})`
      ]);
      setFormData(prev => ({ ...prev, hostEmployee: "" }));
    }
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
        accompanied_by_count: Number(formData.accompaniedByCount)
      };
      
      await createVisit(visitPayload);
      setSubmitted(true);
      toast.success("Visit Request Submitted!");
      
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
      purpose: "Official",
      category: "Visitor",
      validUpTo: new Date(new Date().setHours(18, 0, 0, 0)).toISOString().slice(0, 16),
      status: "Open",
      accompaniedByCount: 0,
      photoPath: "",
    });
    setSubmitted(false);
  };

  const handleBack = () => {
    // If we're logged in, go to approvals, otherwise back to login
    if (localStorage.getItem("token")) {
      window.history.back();
    } else {
      window.location.href = "/login";
    }
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
        <Card className="w-full max-w-md p-10 text-center shadow-xl border-0 rounded-2xl">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Submitted Successfully!</h2>
          <p className="text-slate-500 mb-8 text-lg">The visitor request has been recorded and is pending approval.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={resetForm} size="lg" className="bg-blue-600 hover:bg-blue-700 w-full text-white shadow-md">
              <UserPlus className="w-5 h-5 mr-2" /> Register Another Visitor
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white rounded-lg p-1 shadow-sm flex items-center justify-center shrink-0">
              <img src="/uploads/company_logo.png" alt="IGL" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Visitor Information Entry</h2>
              <p className="text-blue-100 mt-1 text-sm">Please provide the visitor details below</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleBack} className="bg-white/10 hover:bg-white/20 border-white/20 text-white shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
              
              {/* LEFT COLUMN */}
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
                    <div className="flex gap-2">
                      <Input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="Full Name" className={InputClass} />
                      <Button type="button" variant="outline" className="h-10 shrink-0">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
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
                  </select>
                </div>

              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">

                <div>
                  <label className={LabelClass}>Accessories (If Any)</label>
                  <textarea name="accessories" value={formData.accessories} onChange={handleInputChange} placeholder="Laptops, tools, etc." className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[80px] resize-y transition-colors" />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Up To</label>
                    <select name="upTo" value={formData.upTo} onChange={handleInputChange} className={InputClass}>
                      <option value="Office">Office</option>
                      <option value="Plant">Plant</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>Category</label>
                    <select name="category" value={formData.category} onChange={handleInputChange} className={InputClass}>
                      <option value="Visitor">Visitor</option>
                      <option value="Guest">Guest</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className={LabelClass}>Purpose</label>
                    <select name="purpose" value={formData.purpose} onChange={handleInputChange} className={InputClass}>
                      <option value="Official">Official</option>
                      <option value="Personal">Personal</option>
                      <option value="Interview">Interview</option>
                      <option value="Vendor">Vendor</option>
                    </select>
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
                    <select name="status" value={formData.status} onChange={handleInputChange} className={`${InputClass} bg-amber-50`}>
                      <option value="Open">Open</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className={LabelClass}>Accompanied By (Count)</label>
                    <select name="accompaniedByCount" value={formData.accompaniedByCount} onChange={handleInputChange} className={InputClass}>
                      {[0,1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {/* VISITOR IMAGE BLOCK */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <label className="text-sm font-bold text-slate-800 mb-1 block">Visitor Image Verification <span className="text-slate-400 font-normal text-xs ml-2">(Optional for Admins)</span></label>
                  <div className="flex items-start gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    
                    {useWebcam ? (
                      <div className="w-32 h-32 bg-black rounded-lg overflow-hidden relative shadow-inner shrink-0 border border-slate-300">
                         <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-white flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-xs overflow-hidden shrink-0">
                        {formData.photoPath ? (
                          <img src={formData.photoPath.startsWith('http') || formData.photoPath.startsWith('data:') ? formData.photoPath : formData.photoPath} alt="visitor" className="w-full h-full object-cover" />
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
                      
                      <div className="relative w-full">
                        <Button type="button" variant="outline" onClick={() => document.getElementById('aadhaar-upload')?.click()} className="bg-white shadow-sm w-full">
                          <UploadCloud className="w-4 h-4 mr-2 text-blue-600" /> Aadhaar Scan
                        </Button>
                        <input id="aadhaar-upload" type="file" accept="image/*" className="hidden" onChange={handleAadhaarUpload} />
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-10 flex justify-end items-center gap-4 border-t pt-6">
              <span className="text-red-500 text-xs font-medium mr-auto">* Mandatory Field</span>
              <Button type="submit" isLoading={isLoading} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md px-8 rounded-lg">
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