import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, Users, Camera, Upload, Trash2, CheckCircle2, Loader2, FileText, Search, User, Briefcase } from "lucide-react";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import api from "@/services/api";

const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const Interviews = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Webcam states
  const [useWebcam, setUseWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // Upload progress/loading flags
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Form State (includes empty candidate_aadhaar and aadhaar_doc_path for schema parity)
  const [formData, setFormData] = useState({
    candidate_name: "",
    candidate_email: "",
    candidate_mobile: "",
    candidate_aadhaar: "", // Omitted from form, sent as empty string
    candidate_address: "",
    candidate_photo_path: "",
    
    position: "",
    department: "",
    interview_type: "Offline",
    scheduled_time: "",
    interview_location: "",
    interviewer_name: "",
    interviewer_employee_id: "",
    
    resume_path: "",
    aadhaar_doc_path: "", // Omitted from uploads, sent as empty string
    educational_certificates_path: "",
    experience_documents_path: "",
  });

  const fetchInterviews = async () => {
    try {
      const res = await api.get("/api/interviews/");
      setInterviews(res.data);
    } catch (error) {
      toast.error("Failed to fetch interviews");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments/");
      const active = res.data.filter((d: any) => d.is_active);
      setDepartments(active);
      if (active.length > 0) {
        setFormData(prev => ({ ...prev, department: active[0].name }));
      }
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchDepartments();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Webcam Capture Handler
  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture screenshot. Check webcam permissions.");
      return;
    }

    setUploadingField("candidate_photo_path");
    try {
      const blob = dataURLtoBlob(imageSrc);
      const file = new File([blob], "webcam_photo.jpg", { type: "image/jpeg" });
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await api.post("/api/visitors/upload-doc", uploadData);
      setFormData(prev => ({ ...prev, candidate_photo_path: res.data.file_path }));
      toast.success("Photo captured and uploaded successfully!");
      setUseWebcam(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload captured photo");
    } finally {
      setUploadingField(null);
    }
  }, [webcamRef]);

  // File Upload Handler (for PDF/images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingField(fieldName);
      const uploadData = new FormData();
      uploadData.append("file", file);

      try {
        const res = await api.post("/api/visitors/upload-doc", uploadData);
        setFormData(prev => ({ ...prev, [fieldName]: res.data.file_path }));
        toast.success("Document uploaded successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Upload failed. Try again.");
      } finally {
        setUploadingField(null);
      }
    }
  };

  // Form Submit Handler
  const handleCreate = async (e: any) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
      };
      await api.post("/api/interviews/", payload);
      toast.success("Interview requested successfully and sent for approval");
      setShowModal(false);
      
      setFormData({
        candidate_name: "",
        candidate_email: "",
        candidate_mobile: "",
        candidate_aadhaar: "",
        candidate_address: "",
        candidate_photo_path: "",
        position: "",
        department: departments[0]?.name || "",
        interview_type: "Offline",
        scheduled_time: "",
        interview_location: "",
        interviewer_name: "",
        interviewer_employee_id: "",
        resume_path: "",
        aadhaar_doc_path: "",
        educational_certificates_path: "",
        experience_documents_path: "",
      });
      
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to schedule interview");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status label badge with styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case "HR_REVIEWED":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">HR Reviewed</Badge>;
      case "APPROVED":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      case "Checked-In":
        return <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-medium">Checked-In</Badge>;
      case "Checked-Out":
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Checked-Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter list
  const filteredInterviews = interviews.filter(i => {
    const q = searchQuery.toLowerCase();
    return (
      i.candidate_name?.toLowerCase().includes(q) ||
      i.position?.toLowerCase().includes(q) ||
      i.department?.toLowerCase().includes(q) ||
      i.interviewer_name?.toLowerCase().includes(q) ||
      i.pass_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <Users className="h-6 w-6 mr-2 text-violet-600" />
            Interview Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create, track, and manage official job candidate interview approvals.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-100 transition-all duration-200 justify-center">
          <Plus className="h-4 w-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      {/* Main List */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Interview Approvals & Passes
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search candidate, position, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200 rounded-xl focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 pl-6 whitespace-nowrap min-w-[240px]">Candidate Details</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Position & Dept</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Scheduled Time</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Interviewer</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Pass / QR Number</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterviews.map((i) => (
                  <TableRow key={i.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        {i.candidate_photo_path ? (
                          <img
                            src={i.candidate_photo_path}
                            alt={i.candidate_name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${i.candidate_name}`;
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold flex-shrink-0">
                            {i.candidate_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 break-words">{i.candidate_name}</div>
                          <div className="text-xs text-slate-500 break-words">{i.candidate_mobile}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-700">{i.position}</div>
                        <div className="text-xs text-slate-500">{i.department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-slate-700 font-medium">
                        {new Date(i.scheduled_time).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(i.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-slate-700">{i.interviewer_name}</div>
                      {i.interviewer_employee_id && (
                        <div className="text-xs text-slate-400">ID: {i.interviewer_employee_id}</div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {i.pass_number ? (
                        <span className="font-mono text-sm font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100">
                          {i.pass_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No pass generated yet</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 whitespace-nowrap">
                      {getStatusBadge(i.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInterviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No interview schedules match your search</p>
                      <p className="text-xs text-slate-400 mt-1">Try refining your terms or schedule a new candidate.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Interview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-4xl shadow-2xl border-slate-100 rounded-2xl my-auto">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex justify-between items-center gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center break-words">
                  <Users className="h-5 w-5 mr-2 text-violet-600 flex-shrink-0" />
                  Schedule Candidate Interview Request
                </CardTitle>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
              <form onSubmit={handleCreate} className="space-y-6">
                
                {/* SECTION 1: CANDIDATE INFO */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <User className="h-4 w-4 mr-1 text-slate-400" /> Candidate Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Candidate Full Name"
                      name="candidate_name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.candidate_name}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Email Address"
                      name="candidate_email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={formData.candidate_email}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Mobile Number"
                      name="candidate_mobile"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={formData.candidate_mobile}
                      onChange={handleInputChange}
                    />
                    <div className="md:col-span-3">
                      <Input
                        label="Full Residential Address"
                        name="candidate_address"
                        placeholder="e.g. Sector-62, Noida, UP"
                        value={formData.candidate_address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DOCUMENTS UPLOAD */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Upload className="h-4 w-4 mr-1 text-slate-400" /> Security Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    
                    {/* Resume Upload */}
                    <div className="flex flex-col space-y-2 border border-dashed border-slate-200 p-4 rounded-xl bg-slate-50/50">
                      <label className="text-sm font-semibold text-slate-700">Resume/CV (PDF) (Optional)</label>
                      <div className="flex flex-col items-center justify-center py-6 bg-white border border-slate-100 rounded-lg relative">
                        {formData.resume_path ? (
                          <div className="text-center">
                            <div className="h-10 w-10 bg-emerald-50 rounded-full text-emerald-600 flex items-center justify-center mx-auto">
                              <FileText className="h-5 w-5" />
                            </div>
                            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resume Uploaded
                            </p>
                            <button
                              type="button"
                              className="text-xs text-rose-500 hover:underline mt-1"
                              onClick={() => setFormData(prev => ({ ...prev, resume_path: "" }))}
                            >
                              Remove File
                            </button>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <label className="cursor-pointer group flex flex-col items-center">
                              <div className="h-10 w-10 bg-slate-50 group-hover:bg-violet-50 text-slate-500 group-hover:text-violet-600 rounded-full flex items-center justify-center transition-colors">
                                {uploadingField === "resume_path" ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Upload className="h-5 w-5" />
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-600 mt-2 hover:text-violet-700">
                                Click to Upload Resume
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "resume_path")}
                                disabled={!!uploadingField}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Optional Docs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Educational Certificates (Optional)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Degrees, marksheets or transcripts.</div>
                      </div>
                      {formData.educational_certificates_path ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-semibold flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Uploaded</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, educational_certificates_path: "" }))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center">
                          {uploadingField === "educational_certificates_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-violet-600" /> : <Upload className="h-3.5 w-3.5 mr-1 text-violet-600" />}
                          Choose File
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "educational_certificates_path")} disabled={!!uploadingField} />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Experience Documents (Optional)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Relieving letters, salary slips or contracts.</div>
                      </div>
                      {formData.experience_documents_path ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-semibold flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Uploaded</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, experience_documents_path: "" }))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center">
                          {uploadingField === "experience_documents_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-violet-600" /> : <Upload className="h-3.5 w-3.5 mr-1 text-violet-600" />}
                          Choose File
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "experience_documents_path")} disabled={!!uploadingField} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: INTERVIEW PARAMETERS */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Briefcase className="h-4 w-4 mr-1 text-slate-400" /> Interview & Host Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Position Applied For"
                      name="position"
                      required
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.position}
                      onChange={handleInputChange}
                    />

                    {/* Department Dropdown */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Target Department *</label>
                      <select
                        name="department"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        value={formData.department}
                        onChange={handleInputChange}
                        required
                      >
                        {departments.map((d: any) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Interview Type */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Interview Type *</label>
                      <select
                        name="interview_type"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                        value={formData.interview_type}
                        onChange={handleInputChange}
                      >
                        <option value="Offline">Offline (On-Premise Visit)</option>
                        <option value="Online">Online (Virtual Conference)</option>
                      </select>
                    </div>

                    <Input
                      label="Scheduled Date & Time"
                      name="scheduled_time"
                      type="datetime-local"
                      required
                      value={formData.scheduled_time}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Interview Location / Room"
                      name="interview_location"
                      placeholder="e.g. Meeting Room A (Admin Block)"
                      value={formData.interview_location}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Interviewer Name"
                      name="interviewer_name"
                      required
                      placeholder="e.g. Dr. Anil Verma"
                      value={formData.interviewer_name}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Interviewer Employee ID (Optional)"
                      name="interviewer_employee_id"
                      placeholder="e.g. EMP12345"
                      value={formData.interviewer_employee_id}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 sm:space-x-3 space-y-reverse">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 justify-center"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-100 justify-center"
                  >
                    Submit Request
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Interviews;
