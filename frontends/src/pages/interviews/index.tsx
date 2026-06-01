import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

const Interviews = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    candidate_id: "",
    position: "",
    round_name: "",
    scheduled_time: "",
  });

  const fetchInterviews = async () => {
    try {
      const res = await api.get("/api/interviews/");
      setInterviews(res.data);
    } catch (error) {
      toast.error("Failed to fetch interviews");
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        candidate_id: parseInt(formData.candidate_id),
        position: formData.position,
        round_name: formData.round_name,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
      };
      await api.post("/api/interviews/", payload);
      toast.success("Interview scheduled successfully");
      setShowModal(false);
      fetchInterviews();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to schedule interview");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Interview Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Schedule Interview
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Past Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate ID</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">#{i.candidate_id}</TableCell>
                  <TableCell>{i.position}</TableCell>
                  <TableCell>{i.round_name || "N/A"}</TableCell>
                  <TableCell>{new Date(i.scheduled_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={i.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                      {i.status || "SCHEDULED"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {interviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No interviews found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Schedule Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input label="Candidate ID (Visitor ID)" name="candidate_id" type="number" required value={formData.candidate_id} onChange={handleInputChange} />
                <Input label="Position" name="position" required value={formData.position} onChange={handleInputChange} />
                <Input label="Round Name" name="round_name" value={formData.round_name} onChange={handleInputChange} />
                <Input label="Scheduled Time" name="scheduled_time" type="datetime-local" required value={formData.scheduled_time} onChange={handleInputChange} />
                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isLoading}>Schedule</Button>
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
