import React, { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, Calendar, Camera, Upload, Trash2, CheckCircle2, Loader2, FileText, Search, User, Briefcase, MapPin, Clock, Users, Building, ShieldAlert } from "lucide-react";
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

const Meetings = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Webcam states
  const [useWebcam, setUseWebcam] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  // Upload progress/loading flags
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Form State (includes empty visitor_aadhaar and aadhaar_doc_path for schema parity)
  const [formData, setFormData] = useState({
    title: "",
    purpose: "BUSINESS MEETING",
    description: "",
    meeting_type: "Offline",
    scheduled_time: "",
    end_time: "",
    location: "",
    host_employee: "",
    host_department: "",
    expected_duration: "1 Hour",
    
    visitor_name: "",
    company_name: "",
    visitor_email: "",
    visitor_mobile: "",
    visitor_aadhaar: "", // Omitted from form, sent as empty string
    visitor_photo_path: "",
    visitor_designation: "",
    number_of_attendees: 1,
    
    aadhaar_doc_path: "", // Omitted from uploads, sent as empty string
    company_id_doc_path: "",
    authorization_letter_path: "",
    business_card_path: "",
    company_documents_path: "",
  });

  const fetchMeetings = async () => {
    try {
      const res = await api.get("/api/meetings/");
      setMeetings(res.data);
    } catch (error) {
      toast.error("Failed to fetch meetings");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments/");
      const active = res.data.filter((d: any) => d.is_active);
      setDepartments(active);
      if (active.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          host_department: active[0].name 
        }));
      }
    } catch (err) {
      console.error("Failed to load departments");
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchDepartments();
  }, []);

  const handleInputChange = (e: any) => {
    const value = e.target.type === "number" ? parseInt(e.target.value) || 1 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // Webcam Capture Handler
  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture screenshot. Check webcam permissions.");
      return;
    }

    setUploadingField("visitor_photo_path");
    try {
      const blob = dataURLtoBlob(imageSrc);
      const file = new File([blob], "webcam_photo.jpg", { type: "image/jpeg" });
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await api.post("/api/visitors/upload-doc", uploadData);
      setFormData(prev => ({ ...prev, visitor_photo_path: res.data.file_path }));
      toast.success("Visitor photo captured successfully!");
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
        end_time: new Date(formData.end_time).toISOString(),
      };
      await api.post("/api/meetings/", payload);
      toast.success("Meeting scheduled successfully & sent for approval");
      setShowModal(false);
      
      // Reset form
      setFormData({
        title: "",
        purpose: "BUSINESS MEETING",
        description: "",
        meeting_type: "Offline",
        scheduled_time: "",
        end_time: "",
        location: "",
        host_employee: "",
        host_department: departments[0]?.name || "",
        expected_duration: "1 Hour",
        visitor_name: "",
        company_name: "",
        visitor_email: "",
        visitor_mobile: "",
        visitor_aadhaar: "",
        visitor_photo_path: "",
        visitor_designation: "",
        number_of_attendees: 1,
        aadhaar_doc_path: "",
        company_id_doc_path: "",
        authorization_letter_path: "",
        business_card_path: "",
        company_documents_path: "",
      });
      
      fetchMeetings();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to schedule meeting");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status label badge with styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending Review</Badge>;
      case "DEPT_REVIEWED":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Dept Reviewed</Badge>;
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
  const filteredMeetings = meetings.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.title?.toLowerCase().includes(q) ||
      m.visitor_name?.toLowerCase().includes(q) ||
      m.company_name?.toLowerCase().includes(q) ||
      m.host_employee?.toLowerCase().includes(q) ||
      m.pass_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-cyan-600" />
            Meeting Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Request and track high-priority corporate meeting approvals and host entries.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-100 transition-all duration-200 justify-center">
          <Plus className="h-4 w-4 mr-2" /> Schedule Meeting
        </Button>
      </div>


      {/* Main List */}
      <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Meeting Requests & Pass Statuses
            </CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search visitor, company, host, pass number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 pl-6 whitespace-nowrap min-w-[240px]">Meeting & Visitor</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Host Details</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Scheduled Duration</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Location</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Pass / QR Number</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map((m) => (
                  <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        {m.visitor_photo_path ? (
                          <img
                            src={m.visitor_photo_path}
                            alt={m.visitor_name}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${m.visitor_name}`;
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-700 font-semibold flex-shrink-0">
                            {m.visitor_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 break-words">{m.title}</div>
                          <div className="text-xs text-slate-500 break-words">
                            Visitor: {m.visitor_name} ({m.company_name})
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-700">{m.host_employee}</div>
                        <div className="text-xs text-slate-500">{m.host_department}</div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-slate-700 font-medium">
                        {new Date(m.scheduled_time).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(m.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(m.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm text-slate-700 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {m.location || "Conference Hall"}
                      </div>
                      {m.number_of_attendees > 1 && (
                        <div className="text-xs text-slate-400 flex items-center mt-0.5">
                          <Users className="h-3 w-3 mr-1" />
                          +{m.number_of_attendees - 1} attendees
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {m.pass_number ? (
                        <span className="font-mono text-sm font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-100">
                          {m.pass_number}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No pass generated yet</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 whitespace-nowrap">
                      {getStatusBadge(m.status)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMeetings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No scheduled meetings match your search</p>
                      <p className="text-xs text-slate-400 mt-1">Try refining your search query or schedule a new meeting.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-4xl shadow-2xl border-slate-100 rounded-2xl my-auto">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex justify-between items-center gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 flex items-center break-words">
                  <Calendar className="h-5 w-5 mr-2 text-cyan-600 flex-shrink-0" />
                  Schedule Corporate Meeting Request
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
                
                {/* SECTION 1: MEETING DETAILS */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Briefcase className="h-4 w-4 mr-1 text-slate-400" /> Meeting Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Meeting Title"
                        name="title"
                        required
                        placeholder="e.g. Annual Vendor Performance Review"
                        value={formData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Meeting Purpose *</label>
                      <select
                        name="purpose"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        value={formData.purpose}
                        onChange={handleInputChange}
                      >
                        <option value="BUSINESS MEETING">Business Meeting</option>
                        <option value="VENDOR REVIEW">Vendor Review</option>
                        <option value="TECHNICAL DISCUSSION">Technical Discussion</option>
                        <option value="AUDIT OR INSPECTION">Audit / Inspection</option>
                        <option value="PARTNERSHIP AGREEMENT">Partnership Discussion</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Meeting Type *</label>
                      <select
                        name="meeting_type"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        value={formData.meeting_type}
                        onChange={handleInputChange}
                      >
                        <option value="Offline">Offline (On-Premise Visit)</option>
                        <option value="Online">Online (Hybrid Conference)</option>
                      </select>
                    </div>

                    <Input
                      label="Scheduled Start Time"
                      name="scheduled_time"
                      type="datetime-local"
                      required
                      value={formData.scheduled_time}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Scheduled End Time"
                      name="end_time"
                      type="datetime-local"
                      required
                      value={formData.end_time}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Meeting Location / Room"
                      name="location"
                      placeholder="e.g. Boardroom 1 (Second Floor)"
                      value={formData.location}
                      onChange={handleInputChange}
                    />

                    <Input
                      label="Expected Duration Description"
                      name="expected_duration"
                      placeholder="e.g. 2 Hours, Full Day"
                      value={formData.expected_duration}
                      onChange={handleInputChange}
                    />
                    
                    <div className="md:col-span-3">
                      <Input
                        label="Agenda / Brief Description"
                        name="description"
                        placeholder="Provide details about the agenda and items to be discussed"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: HOST PARAMETERS */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <User className="h-4 w-4 mr-1 text-slate-400" /> Host Corporate Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Host Employee Name"
                      name="host_employee"
                      required
                      placeholder="e.g. Vijay Kumar"
                      value={formData.host_employee}
                      onChange={handleInputChange}
                    />

                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Host Department *</label>
                      <select
                        name="host_department"
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        value={formData.host_department}
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
                  </div>
                </div>

                {/* SECTION 3: VISITOR INFORMATON */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Building className="h-4 w-4 mr-1 text-slate-400" /> Primary Visitor details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Visitor Full Name"
                      name="visitor_name"
                      required
                      placeholder="e.g. Amit Kapoor"
                      value={formData.visitor_name}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Company/Organization Name"
                      name="company_name"
                      required
                      placeholder="e.g. Shell Corp Ltd"
                      value={formData.company_name}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Visitor Designation"
                      name="visitor_designation"
                      placeholder="e.g. Director Procurement"
                      value={formData.visitor_designation}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Mobile Number"
                      name="visitor_mobile"
                      required
                      placeholder="e.g. +91 9898989898"
                      value={formData.visitor_mobile}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Email Address"
                      name="visitor_email"
                      type="email"
                      placeholder="e.g. amit@shell.com"
                      value={formData.visitor_email}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Total Number of Attendees"
                      name="number_of_attendees"
                      type="number"
                      min="1"
                      required
                      value={formData.number_of_attendees}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* SECTION 4: DOCUMENTS UPLOAD */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                    <Upload className="h-4 w-4 mr-1 text-slate-400" /> Verification Documents
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">

                    {/* Company ID Card */}
                    <div className="flex flex-col space-y-2 border border-dashed border-slate-200 p-4 rounded-xl bg-slate-50/50">
                      <label className="text-sm font-semibold text-slate-700">Company ID Card / Proof (Optional)</label>
                      <div className="flex flex-col items-center justify-center py-6 bg-white border border-slate-100 rounded-lg relative">
                        {formData.company_id_doc_path ? (
                          <div className="text-center">
                            <div className="h-10 w-10 bg-emerald-50 rounded-full text-emerald-600 flex items-center justify-center mx-auto">
                              <FileText className="h-5 w-5" />
                            </div>
                            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> ID Uploaded
                            </p>
                            <button
                              type="button"
                              className="text-xs text-rose-500 hover:underline mt-1"
                              onClick={() => setFormData(prev => ({ ...prev, company_id_doc_path: "" }))}
                            >
                              Remove File
                            </button>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <label className="cursor-pointer group flex flex-col items-center">
                              <div className="h-10 w-10 bg-slate-50 group-hover:bg-cyan-50 text-slate-500 group-hover:text-cyan-600 rounded-full flex items-center justify-center transition-colors">
                                {uploadingField === "company_id_doc_path" ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Upload className="h-5 w-5" />
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-600 mt-2 hover:text-cyan-700">
                                Click to Upload ID
                              </span>
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, "company_id_doc_path")}
                                disabled={!!uploadingField}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Other Optional Docs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Authorization Letter (Optional)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Official email invite or authority letter.</div>
                      </div>
                      {formData.authorization_letter_path ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-semibold flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Uploaded</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, authorization_letter_path: "" }))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center">
                          {uploadingField === "authorization_letter_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-cyan-600" /> : <Upload className="h-3.5 w-3.5 mr-1 text-cyan-600" />}
                          Choose File
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "authorization_letter_path")} disabled={!!uploadingField} />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">Business Card Copy (Optional)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Scanned image or PDF of visitor's card.</div>
                      </div>
                      {formData.business_card_path ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-semibold flex items-center"><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Uploaded</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, business_card_path: "" }))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 flex items-center">
                          {uploadingField === "business_card_path" ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-cyan-600" /> : <Upload className="h-3.5 w-3.5 mr-1 text-cyan-600" />}
                          Choose File
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "business_card_path")} disabled={!!uploadingField} />
                        </label>
                      )}
                    </div>
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
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-100 justify-center"
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

export default Meetings;

