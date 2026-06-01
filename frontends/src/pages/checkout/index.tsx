import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LogOut, Search, Camera, CameraOff } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/services/api";
import { checkOutVisit } from "@/services/visitService";
import { QRScanner } from "@/components/ui/QRScanner";

const CheckOut = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [visitsRes, visitorsRes] = await Promise.all([
          api.get("/api/visitors/visits"),
          api.get("/api/visitors/")
        ]);
        
        const visitorsMap = new Map();
        visitorsRes.data.forEach((v: any) => {
          visitorsMap.set(v.id, v);
        });

        const pendingCheckOuts = visitsRes.data
          .filter((visit: any) => visit.status === "APPROVED" && visit.check_in_time && !visit.check_out_time)
          .map((visit: any) => {
            const visitor = visitorsMap.get(visit.visitor_id) || {};
            return {
              id: visit.id,
              cardId: visit.card_id || `VISITOR-${visit.id}`,
              date: visit.created_at || "",
              visitorName: visitor.full_name || "Unknown",
              company: visitor.company || "N/A",
              purpose: visit.purpose,
              hostEmployee: visit.host_employee,
              status: "CHECKED IN", // visually indicate checked in
              phone: visitor.phone_number || "",
              email: visitor.email || ""
            };
          });
        
        setVisits(pendingCheckOuts);
      } catch (error) {
        console.error("Failed to fetch check-out data", error);
        toast.error("Failed to load active visits");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckOut = async (id: number) => {
    try {
      await checkOutVisit(id);
      setVisits((prevVisits) => prevVisits.filter(v => v.id !== id));
      toast.success("Visitor checked out successfully!");
    } catch (error) {
      toast.error("Failed to check out visitor");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (decodedText.startsWith("VISIT_ID:")) {
      const visitId = parseInt(decodedText.replace("VISIT_ID:", ""));
      if (!isNaN(visitId)) {
        // Find if this visit is in our pending checkout list
        const visit = visits.find((v) => v.id === visitId);
        if (visit) {
          setIsScanning(false); // Pause scanner to avoid duplicate hits
          try {
            await checkOutVisit(visitId);
            setVisits((prevVisits) => prevVisits.filter(v => v.id !== visitId));
            toast.success(`Automated Check-out successful for ${visit.visitorName}!`, { duration: 4000 });
          } catch (error) {
            toast.error("Failed to check out visitor automatically.");
          }
        } else {
          toast.error(`Visit ID ${visitId} is not currently checked in.`, { id: "scan-err" });
        }
      }
    } else {
       toast.error(`Invalid QR Code Format`, { id: "scan-err" });
    }
  };

  const filteredVisits = visits.filter(visit => 
    visit.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.cardId.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === "newest") return b.id - a.id;
    if (sortOrder === "oldest") return a.id - b.id;
    if (sortOrder === "name") return a.visitorName.localeCompare(b.visitorName);
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Check-Out Management</h1>
          <p className="text-slate-500 text-sm">Verify and log departing visitors manually or via QR scan</p>
        </div>
        <Button 
          onClick={() => setIsScanning(!isScanning)} 
          className={isScanning ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"}
        >
          {isScanning ? (
            <><CameraOff className="w-4 h-4 mr-2" /> Stop Scanner</>
          ) : (
            <><Camera className="w-4 h-4 mr-2" /> Auto-Scan QR</>
          )}
        </Button>
      </div>

      {isScanning && (
        <Card className="mb-6 border-blue-200 bg-blue-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" /> Live QR Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-blue-600 mb-6 text-center">
               Hold the visitor's PDF gate pass up to the camera. The system will automatically check them out.
             </p>
             <QRScanner isScanning={isScanning} onScanSuccess={handleScanSuccess} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Manual Visitor Check-Out</CardTitle>
          <div className="flex items-center gap-4">
            <select
              className="border-slate-300 rounded-md text-sm py-2 px-3 focus:ring-primary focus:border-primary border bg-white text-slate-700"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <div className="relative w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search by name, ID, phone..." 
                className="pl-9 m-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor ID</TableHead>
                <TableHead>Visitor Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Host Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-semibold text-slate-700">{visit.cardId}</TableCell>
                  <TableCell className="font-medium">{visit.visitorName}</TableCell>
                  <TableCell>{visit.company}</TableCell>
                  <TableCell>{visit.purpose}</TableCell>
                  <TableCell>{visit.hostEmployee}</TableCell>
                  <TableCell>
                    <Badge variant="warning">
                      {visit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => handleCheckOut(visit.id)}>
                      <LogOut className="h-4 w-4 mr-1" /> Check Out
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVisits.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    No active visitors pending check-out.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckOut;