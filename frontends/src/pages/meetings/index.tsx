import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

const Meetings = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    scheduled_time: "",
    end_time: "",
    host_id: "",
  });

  const fetchMeetings = async () => {
    try {
      const res = await api.get("/api/meetings/");
      setMeetings(res.data);
    } catch (error) {
      toast.error("Failed to fetch meetings");
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        ...(formData.host_id ? { host_id: parseInt(formData.host_id) } : {})
      };
      await api.post("/api/meetings/", payload);
      toast.success("Meeting created successfully");
      setShowModal(false);
      fetchMeetings();
    } catch (error) {
      toast.error("Failed to create meeting");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Meeting Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> Schedule Meeting
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Past Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.title}</TableCell>
                  <TableCell>{m.department_id || "General"}</TableCell>
                  <TableCell>{m.location || "N/A"}</TableCell>
                  <TableCell>{new Date(m.scheduled_time).toLocaleString()}</TableCell>
                  <TableCell>{new Date(m.end_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                      {m.status || "SCHEDULED"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {meetings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                    No meetings found.
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
              <CardTitle>Schedule Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <Input label="Title" name="title" required value={formData.title} onChange={handleInputChange} />
                <Input label="Description" name="description" value={formData.description} onChange={handleInputChange} />
                <Input label="Location / Room" name="location" value={formData.location} onChange={handleInputChange} />
                <Input label="Start Time" name="scheduled_time" type="datetime-local" required value={formData.scheduled_time} onChange={handleInputChange} />
                <Input label="End Time" name="end_time" type="datetime-local" required value={formData.end_time} onChange={handleInputChange} />
                <Input label="Host Employee ID (Optional)" name="host_id" type="number" placeholder="Defaults to you" value={formData.host_id} onChange={handleInputChange} />
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

export default Meetings;
