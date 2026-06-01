import React, { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Check, X, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { EnterprisePass } from "@/components/EnterprisePass";

import api from "@/services/api";
import { approveVisit, rejectVisit } from "@/services/visitService";

const initialVisits = [
  { id: 1, visitorName: "Rahul Sharma", company: "TechCorp", purpose: "Interview", hostEmployee: "Anita Desai", status: "PENDING" },
  { id: 2, visitorName: "Priya Patel", company: "DesignStudio", purpose: "Meeting", hostEmployee: "Vikram Singh", status: "PENDING" },
  { id: 3, visitorName: "Amit Kumar", company: "Logistics Ltd", purpose: "Delivery", hostEmployee: "Neha Gupta", status: "APPROVED" },
];

const Approvals = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [visitsRes, visitorsRes, deptsRes] = await Promise.all([
          api.get("/api/visitors/visits"),
          api.get("/api/visitors/"),
          api.get("/api/departments/")
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
            phone: visitor.phone_number || "",
            email: visitor.email || "",
            createdAt: visit.created_at || "",
            photoPath: visitor.photo_path || ""
          };
        });
        
        const activeDepts = deptsRes.data.filter((d: any) => d.is_active).map((d: any) => d.name);
        setDepartments(activeDepts);
        
        mergedData.sort((a: any, b: any) => b.id - a.id);
        
        setVisits(mergedData);
      } catch (error) {
        console.error("Failed to fetch approvals data", error);
        toast.error("Failed to load visit requests");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await approveVisit(id);
      setVisits(visits.map((v: any) => v.id === id ? { ...v, status: "APPROVED" } : v));
      toast.success("Visit approved successfully");
      setSelectedVisit(null);
    } catch (error) {
      toast.error("Failed to approve visit");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectVisit(id);
      setVisits(visits.map((v: any) => v.id === id ? { ...v, status: "REJECTED" } : v));
      toast.success("Visit rejected");
      setSelectedVisit(null);
    } catch (error) {
      toast.error("Failed to reject visit");
    }
  };

  const filteredVisits = visits.filter(visit => {
    const matchesSearch = visit.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          visit.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          visit.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          visit.cardId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          visit.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || visit.status === statusFilter;
    const matchesDept = deptFilter === "ALL" || visit.department === deptFilter;
    const matchesDate = !dateFilter || (visit.createdAt && visit.createdAt.startsWith(dateFilter));
    return matchesSearch && matchesStatus && matchesDept && matchesDate;
  }).sort((a, b) => {
    // Sort by Date (newest first) then by Department (alphabetical)
    const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateCompare !== 0) return dateCompare;
    return (a.department || "").localeCompare(b.department || "");
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Visit Approvals</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search by name, phone, email..." 
                className="pl-9 m-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              <UserPlus className="h-4 w-4 mr-2" /> Register Visitor
            </Button>
          </div>
        </CardHeader>
        <div className="px-6 pb-4 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 border-b border-slate-100">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
            <option value="ALL">All Departments</option>
            {departments.map((dept, i) => (
              <option key={i} value={dept}>{dept}</option>
            ))}
          </select>
          <Input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 m-0"
          />
        </div>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor ID</TableHead>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Host Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{visit.cardId}</TableCell>
                  <TableCell className="font-medium">{visit.visitorName}</TableCell>
                  <TableCell>{visit.company}</TableCell>
                  <TableCell>{visit.purpose}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{visit.department}</Badge>
                  </TableCell>
                  <TableCell>{visit.hostEmployee}</TableCell>
                  <TableCell>
                    <Badge variant={visit.status === 'PENDING' ? 'warning' : visit.status === 'APPROVED' ? 'success' : 'danger'}>
                      {visit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => setSelectedVisit(visit)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVisits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-slate-500">
                    No visit requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
              <CardTitle>Review Visit Request: {selectedVisit.cardId}</CardTitle>
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
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-sm space-y-2">
                        <p><span className="font-medium">Aadhaar Data:</span> Extracted Successfully</p>
                        <p><span className="font-medium">Identity Match:</span> Verified by HR</p>
                      </div>
                    </div>

                    {/* Visitor Details */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Visitor Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="min-w-0"><p className="text-slate-500">Name</p><p className="font-medium truncate">{selectedVisit.visitorName}</p></div>
                          <div className="min-w-0"><p className="text-slate-500">Phone</p><p className="font-medium truncate">{selectedVisit.phone}</p></div>
                          <div className="min-w-0 pr-4"><p className="text-slate-500">Email</p><p className="font-medium break-words max-w-full">{selectedVisit.email}</p></div>
                          <div className="min-w-0"><p className="text-slate-500">Company</p><p className="font-medium truncate">{selectedVisit.company}</p></div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Visit Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-slate-500">Host</p><p className="font-medium">{selectedVisit.hostEmployee}</p></div>
                          <div><p className="text-slate-500">Department</p><p className="font-medium">{selectedVisit.department}</p></div>
                          <div className="col-span-2"><p className="text-slate-500">Purpose</p><p className="font-medium">{selectedVisit.purpose}</p></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {selectedVisit.status === 'PENDING' && (
                <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
                  <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white mr-auto">
                    Print Pass
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(selectedVisit.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <X className="h-4 w-4 mr-2" /> Reject Request
                  </Button>
                  <Button onClick={() => handleApprove(selectedVisit.id)} className="bg-green-600 hover:bg-green-700 text-white">
                    <Check className="h-4 w-4 mr-2" /> Approve Request
                  </Button>
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