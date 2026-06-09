import React, { useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Check, X, Search, UserPlus, Truck, FileText, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { EnterprisePass } from "@/components/EnterprisePass";
import api from "@/services/api";
import { approveVisit, rejectVisit } from "@/services/visitService";

const Approvals = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"visitors" | "vehicles" | "interviews" | "meetings">("visitors");
  const navigate = useNavigate();

  // Decode user role from stored JWT token
  const getUserRole = (): string => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
      if (!token) return "EMPLOYEE";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || "EMPLOYEE";
    } catch {
      return "EMPLOYEE";
    }
  };
  const userRole = getUserRole();

  // Role-based tab visibility (all sections visible for self-service lookup and cross-functional visibility)
  const canSeeVisitors = true;
  const canSeeVehicles = true;
  const canSeeInterviews = true;
  const canSeeMeetings = true;

  // Approve button visibility (who can click Approve)
  const canApproveVisitor = ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD"].includes(userRole);
  const canApproveInterview = ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "HR_MANAGER"].includes(userRole);
  const canApproveMeeting = ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD"].includes(userRole);
  const canApproveVehicle = ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"].includes(userRole);

  const canApproveCurrent = 
    activeTab === "interviews" ? canApproveInterview :
    activeTab === "meetings" ? canApproveMeeting :
    activeTab === "vehicles" ? canApproveVehicle :
    canApproveVisitor;


  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [visitsRes, visitorsRes, deptsRes, interviewsRes, meetingsRes] = await Promise.all([
        api.get("/api/visitors/visits"),
        api.get("/api/visitors/"),
        api.get("/api/departments/"),
        api.get("/api/interviews/").catch(() => ({ data: [] })),
        api.get("/api/meetings/").catch(() => ({ data: [] }))
      ]);
      
      const visitorsMap = new Map();
      visitorsRes.data.forEach((v: any) => {
        visitorsMap.set(v.id, v);
      });

      const mergedData = visitsRes.data.map((visit: any) => {
        const visitor = visitorsMap.get(visit.visitor_id) || {};
        return {
          id: visit.id,
          cardId: visit.card_id || `VM/000${visit.id}`,
          visitorName: visitor.full_name || "Unknown",
          company: visitor.company || "N/A",
          purpose: visit.purpose,
          department: visit.department || "General",
          hostEmployee: visit.host_employee,
          status: visit.status,
          passType: visit.pass_type,
          phone: visitor.phone_number || "",
          email: visitor.email || "",
          createdAt: visit.created_at || "",
          photoPath: visitor.photo_path || "",
          category: visitor.category || "VISITOR"
        };
      });
      
      const activeDepts = deptsRes.data.filter((d: any) => d.is_active).map((d: any) => d.name);
      setDepartments(activeDepts);
      
      mergedData.sort((a: any, b: any) => b.id - a.id);
      setVisits(mergedData);

      // Set interviews
      const mappedInterviews = interviewsRes.data.map((i: any) => ({
        id: i.id,
        cardId: i.pass_number || `INT/000${i.id}`,
        visitorName: i.candidate_name,
        company: "N/A",
        purpose: `Interview: ${i.position}`,
        department: i.department || "HR",
        hostEmployee: i.interviewer_name,
        status: i.status,
        passType: "INTERVIEW_PASS",
        phone: i.candidate_mobile,
        email: i.candidate_email || "",
        createdAt: i.created_at || "",
        photoPath: i.candidate_photo_path || "",
        category: "CANDIDATE",
        // Interview specific details
        position: i.position,
        interviewType: i.interview_type,
        scheduledTime: i.scheduled_time ? i.scheduled_time.replace('T', ' ').substring(0, 16) : 'N/A',
        interviewerName: i.interviewer_name,
        location: i.interview_location || 'N/A',
        approvalNumber: i.approval_number || '',
        resume_path: i.resume_path,
        aadhaar_doc_path: i.aadhaar_doc_path,
        educational_certificates_path: i.educational_certificates_path,
        experience_documents_path: i.experience_documents_path,
        offer_letter_path: i.offer_letter_path
      }));
      setInterviews(mappedInterviews);

      // Set meetings
      const mappedMeetings = meetingsRes.data.map((m: any) => ({
        id: m.id,
        cardId: m.pass_number || `MTG/000${m.id}`,
        visitorName: m.visitor_name,
        company: m.company_name,
        purpose: `Meeting: ${m.title}`,
        department: m.host_department || "General",
        hostEmployee: m.host_employee,
        status: m.status,
        passType: "MEETING_PASS",
        phone: m.visitor_mobile,
        email: m.visitor_email || "",
        createdAt: m.created_at || "",
        photoPath: m.visitor_photo_path || "",
        category: "MEETING",
        // Meeting specific details
        title: m.title,
        visitorDesignation: m.visitor_designation || 'N/A',
        number_of_attendees: m.number_of_attendees || 1,
        location: m.location || 'N/A',
        expectedDuration: m.expected_duration || 'N/A',
        approvalNumber: m.approval_number || '',
        aadhaar_doc_path: m.aadhaar_doc_path,
        company_id_doc_path: m.company_id_doc_path,
        authorization_letter_path: m.authorization_letter_path,
        business_card_path: m.business_card_path,
        company_documents_path: m.company_documents_path
      }));
      setMeetings(mappedMeetings);

    } catch (error) {
      console.error("Failed to fetch approvals data", error);
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      if (activeTab === "interviews") {
        await api.put(`/api/interviews/approve/${id}`);
        toast.success("Interview status updated successfully");
      } else if (activeTab === "meetings") {
        await api.put(`/api/meetings/approve/${id}`);
        toast.success("Meeting status updated successfully");
      } else {
        await approveVisit(id);
        toast.success("Visit approved successfully");
      }
      setSelectedVisit(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to approve request");
    }
  };

  const handleReject = async (id: number) => {
    try {
      if (activeTab === "interviews") {
        await api.put(`/api/interviews/reject/${id}`);
        toast.success("Interview request rejected");
      } else if (activeTab === "meetings") {
        await api.put(`/api/meetings/reject/${id}`);
        toast.success("Meeting request rejected");
      } else {
        await rejectVisit(id);
        toast.success("Visit rejected");
      }
      setSelectedVisit(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to reject request");
    }
  };

  // Switch active tab data
  const currentDataset = 
    activeTab === "visitors" ? visits :
    activeTab === "vehicles" ? visits :
    activeTab === "interviews" ? interviews : meetings;

  const filteredVisits = currentDataset.filter(visit => {
    const matchesStatus = statusFilter === "ALL" || visit.status === statusFilter;
    const matchesDept = deptFilter === "ALL" || visit.department === deptFilter;
    const matchesDate = !dateFilter || (visit.createdAt && visit.createdAt.startsWith(dateFilter));
    
    if (activeTab === "visitors") {
      const isVehicle = visit.passType === "VENDOR_PASS" || visit.passType === "CONTRACTOR_PASS" || (visit.purpose && visit.purpose.includes("["));
      return matchesStatus && matchesDept && matchesDate && !isVehicle;
    }
    if (activeTab === "vehicles") {
      const isVehicle = visit.passType === "VENDOR_PASS" || visit.passType === "CONTRACTOR_PASS" || (visit.purpose && visit.purpose.includes("["));
      return matchesStatus && matchesDept && matchesDate && isVehicle;
    }
    
    return matchesStatus && matchesDept && matchesDate;
  }).sort((a, b) => {
    const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (a.department || "").localeCompare(b.department || "");
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between pb-4 gap-4">
          <div className="flex flex-col gap-4 w-full xl:w-auto">
            <CardTitle>Visit & Pass Approvals</CardTitle>
          {/* ── TABS: Role-Gated ── */}
            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-fit flex-wrap gap-1">
              {canSeeVisitors && (
                <button
                  id="tab-visitor-passes"
                  onClick={() => { setActiveTab("visitors"); setSelectedVisit(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === "visitors" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Visitor Passes
                </button>
              )}
              {canSeeVehicles && (
                <button
                  id="tab-vehicle-passes"
                  onClick={() => { setActiveTab("vehicles"); setSelectedVisit(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === "vehicles" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Vehicle/Transporter
                </button>
              )}
              {canSeeInterviews && (
                <button
                  id="tab-interview-passes"
                  onClick={() => { setActiveTab("interviews"); setSelectedVisit(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === "interviews" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Interview Passes {userRole === "HR_MANAGER" && <span className="ml-1 bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">Pending Action</span>}
                </button>
              )}
              {canSeeMeetings && (
                <button
                  id="tab-meeting-passes"
                  onClick={() => { setActiveTab("meetings"); setSelectedVisit(null); }}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === "meetings" ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Meeting Passes
                </button>
              )}
            </div>

          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button onClick={() => navigate('/register?type=visitor')} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 flex-1 sm:flex-none">
              <UserPlus className="h-4 w-4 mr-2" /> Register Visitor
            </Button>
            <Button onClick={() => navigate('/register?type=vehicle')} className="bg-orange-600 hover:bg-orange-700 text-white shrink-0 flex-1 sm:flex-none">
              <Truck className="h-4 w-4 mr-2" /> Register Vehicle Pass
            </Button>
          </div>
        </CardHeader>
        <div className="px-6 pb-4 flex flex-col sm:flex-row flex-wrap gap-3 border-b border-slate-100">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-white">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="Checked-In">Checked In</option>
            <option value="Checked-Out">Checked Out</option>
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-white">
            <option value="ALL">All Departments</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>{dept}</option>
            ))}
          </select>
          <div className="w-full sm:w-48">
            <Input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 m-0 w-full"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <DataTable 
            data={filteredVisits} 
            filename={`igl_${activeTab}`}
            searchPlaceholder={`Search ${activeTab}...`}
            onRowClick={(row) => setSelectedVisit(row)}
            columns={[
              {
                header: activeTab === "vehicles" ? "Pass ID" : activeTab === "interviews" ? "Interview ID" : activeTab === "meetings" ? "Meeting ID" : "Visitor ID",
                accessorKey: "cardId",
                nowrap: true,
                cell: (row: any) => <span className="font-mono text-xs text-slate-500">{row.cardId}</span>
              },
              {
                header: activeTab === "interviews" ? "Candidate Name" : activeTab === "meetings" ? "Visitor Name" : activeTab === "vehicles" ? "Driver Name" : "Visitor Name",
                accessorKey: "visitorName",
                cell: (row: any) => <span className="font-medium">{row.visitorName}</span>
              },
              {
                header: activeTab === "interviews" ? "Position" : activeTab === "meetings" ? "Visitor Company" : activeTab === "vehicles" ? "Transport Co." : "Company",
                accessorKey: activeTab === "interviews" ? "position" : "company",
              },
              {
                header: activeTab === "vehicles" ? "Vehicle Number" : "Purpose",
                accessorKey: "purpose",
                cell: (row: any) => {
                  if (activeTab === "vehicles") {
                    const match = row.purpose?.match(/\[(.*?)\]/);
                    return <span className="font-mono font-bold text-blue-600">{match ? match[1] : "N/A"}</span>;
                  }
                  return row.purpose;
                }
              },
              ...(activeTab === "vehicles" ? [{
                header: "Purpose",
                accessorKey: "purePurpose",
                cell: (row: any) => row.purpose?.replace(/\[.*?\]\s*-\s*/, "") || "MATERIAL DELIVERY"
              }] : []),
              {
                header: "Department",
                accessorKey: "department",
                nowrap: true,
                cell: (row: any) => <Badge variant="secondary">{row.department}</Badge>
              },
              {
                header: activeTab === "interviews" ? "Interviewer" : "Host Employee",
                accessorKey: "hostEmployee"
              },
              {
                header: "Status",
                accessorKey: "status",
                nowrap: true,
                cell: (row: any) => (
                  <Badge variant={row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'secondary'}>
                    {row.status}
                  </Badge>
                )
              },
              {
                header: "Actions",
                accessorKey: "actions",
                sortable: false,
                nowrap: true,
                cell: (row: any) => (
                  <div className="text-right">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); setSelectedVisit(row); }}>
                      Review
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row justify-between items-start gap-4 border-b pb-4">
              <CardTitle className="text-base sm:text-lg">Review Visit Request: {selectedVisit.cardId}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVisit(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedVisit.status === 'APPROVED' ? (
                  <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-6">
                    <div className="w-full print:absolute print:inset-0 print:bg-white print:z-[100] print:m-0 print:p-0">
                      <EnterprisePass visit={selectedVisit} photoUrl={selectedVisit.photoPath} />
                    </div>
                    <div className="mt-8 print:hidden">
                      <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Print Pass
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Visual Verification */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Visual Verification</h3>
                      <div className="bg-slate-100 rounded-lg overflow-hidden flex flex-col items-center justify-center h-64 border border-slate-200">
                        <img 
                          src={selectedVisit.photoPath ? selectedVisit.photoPath : "https://placehold.co/400x400/e2e8f0/475569?text=No+Photo"} 
                          alt="Visitor" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      {/* Document Attachments */}
                      {(selectedVisit.resume_path || selectedVisit.aadhaar_doc_path || selectedVisit.educational_certificates_path || selectedVisit.company_id_doc_path) && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm space-y-2">
                          <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">Attached Documents</p>
                          {selectedVisit.resume_path && (
                            <a href={selectedVisit.resume_path} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Candidate Resume
                            </a>
                          )}
                          {selectedVisit.aadhaar_doc_path && (
                            <a href={selectedVisit.aadhaar_doc_path} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Aadhaar Verification
                            </a>
                          )}
                          {selectedVisit.educational_certificates_path && (
                            <a href={selectedVisit.educational_certificates_path} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Educational Certificates
                            </a>
                          )}
                          {selectedVisit.company_id_doc_path && (
                            <a href={selectedVisit.company_id_doc_path} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                              <FileText className="w-3.5 h-3.5" /> Company ID Scan
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-6 text-left">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                          {activeTab === "interviews" ? "Candidate Profile" : activeTab === "meetings" ? "Visitor Profile" : activeTab === "vehicles" ? "Driver & Vehicle Details" : "Visitor Details"}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="min-w-0">
                            <p className="text-slate-500">{activeTab === "vehicles" ? "Driver Name" : "Name"}</p>
                            <p className="font-medium truncate">{selectedVisit.visitorName}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-500">Phone</p>
                            <p className="font-medium truncate">{selectedVisit.phone}</p>
                          </div>
                          <div className="min-w-0 pr-4">
                            <p className="text-slate-500">Email</p>
                            <p className="font-medium break-words max-w-full">{selectedVisit.email}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-slate-500">{activeTab === "vehicles" ? "Transport Co." : activeTab === "interviews" ? "Position" : "Company"}</p>
                            <p className="font-medium truncate">{activeTab === "interviews" ? selectedVisit.position : selectedVisit.company}</p>
                          </div>
                          {activeTab === "vehicles" && (
                            <div className="min-w-0 col-span-1 sm:col-span-2 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <p className="text-slate-500 uppercase text-xs font-bold mb-1">Vehicle Identification</p>
                              <p className="font-black text-blue-600 font-mono text-lg">
                                {selectedVisit.purpose?.match(/\[(.*?)\]/) ? selectedVisit.purpose.match(/\[(.*?)\]/)[1] : "N/A"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interview details */}
                      {activeTab === "interviews" && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Interview Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="text-slate-500">Interviewer</p><p className="font-medium">{selectedVisit.hostEmployee}</p></div>
                            <div><p className="text-slate-500">Department</p><p className="font-medium">{selectedVisit.department}</p></div>
                            <div><p className="text-slate-500">Scheduled Time</p><p className="font-medium">{selectedVisit.scheduledTime}</p></div>
                            <div><p className="text-slate-500">Round Type</p><p className="font-medium">{selectedVisit.interviewType}</p></div>
                            <div className="col-span-1 sm:col-span-2"><p className="text-slate-500">Location / Room</p><p className="font-medium">{selectedVisit.location}</p></div>
                          </div>
                        </div>
                      )}

                      {/* Meeting details */}
                      {activeTab === "meetings" && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Meeting Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="text-slate-500">Host Employee</p><p className="font-medium">{selectedVisit.hostEmployee}</p></div>
                            <div><p className="text-slate-500">Department</p><p className="font-medium">{selectedVisit.department}</p></div>
                            <div><p className="text-slate-500">Expected Duration</p><p className="font-medium">{selectedVisit.expectedDuration}</p></div>
                            <div><p className="text-slate-500">Room / Location</p><p className="font-medium">{selectedVisit.location}</p></div>
                            <div><p className="text-slate-500">Designation</p><p className="font-medium">{selectedVisit.visitorDesignation}</p></div>
                            <div><p className="text-slate-500">Expected Attendees</p><p className="font-medium">{selectedVisit.number_of_attendees}</p></div>
                            <div className="col-span-1 sm:col-span-2"><p className="text-slate-500">Title</p><p className="font-medium">{selectedVisit.purpose}</p></div>
                          </div>
                        </div>
                      )}

                      {/* Standard visit details */}
                      {activeTab !== "interviews" && activeTab !== "meetings" && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Visit Details</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div><p className="text-slate-500">Host</p><p className="font-medium">{selectedVisit.hostEmployee}</p></div>
                            <div><p className="text-slate-500">Department</p><p className="font-medium">{selectedVisit.department}</p></div>
                            <div className="col-span-1 sm:col-span-2"><p className="text-slate-500">Purpose</p><p className="font-medium">{selectedVisit.purpose}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {selectedVisit.status !== 'APPROVED' && selectedVisit.status !== 'REJECTED' && selectedVisit.status !== 'EXPIRED' && (
                <div className="mt-8 flex flex-col sm:flex-row gap-3 border-t pt-4">
                  <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto sm:mr-auto">
                    Print Pass
                  </Button>
                  {canApproveCurrent && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button variant="outline" onClick={() => handleReject(selectedVisit.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" /> Reject Request
                      </Button>
                      
                      {/* Approval Actions */}
                      <Button onClick={() => handleApprove(selectedVisit.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold w-full sm:w-auto">
                        <Check className="h-4 w-4 mr-2" /> 
                        {selectedVisit.status === 'PENDING' && (activeTab === "interviews" || activeTab === "meetings") ? (
                          <>Verify & Recommend</>
                        ) : (
                          <>Approve & Grant Entry</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Approvals;