import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ShieldAlert, Search } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/services/api";

const VisitorDirectory = () => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVisitors = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/visitors/");
      const sorted = res.data.sort((a: any, b: any) => b.id - a.id);
      setVisitors(sorted);
    } catch (error) {
      console.error("Failed to fetch visitors", error);
      toast.error("Failed to load visitors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleBlacklist = async (id: number) => {
    if (!window.confirm("Are you sure you want to blacklist this visitor?")) return;
    try {
      await api.put(`/api/visitors/blacklist/${id}`);
      toast.success("Visitor blacklisted successfully");
      fetchVisitors();
    } catch (error) {
      toast.error("Failed to blacklist visitor");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    (v.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.phone_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Visitor Directory</CardTitle>
          <div className="relative w-64 mt-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search visitors..." 
              className="pl-9 m-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium">{visitor.full_name}</TableCell>
                  <TableCell>{visitor.phone_number}</TableCell>
                  <TableCell>{visitor.email}</TableCell>
                  <TableCell>{visitor.company}</TableCell>
                  <TableCell>
                    {visitor.is_blacklisted ? (
                      <Badge variant="danger">BLACKLISTED</Badge>
                    ) : (
                      <Badge variant="success">ACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!visitor.is_blacklisted && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleBlacklist(visitor.id)}>
                        <ShieldAlert className="h-4 w-4 mr-1" /> Blacklist
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredVisitors.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    No visitors found.
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

export default VisitorDirectory;