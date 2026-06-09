import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Edit, Trash2, AlertTriangle, Truck, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

const VEHICLE_TYPES = ["TRUCK","TANKER","TEMPO","MINI_TRUCK","TRAILER","CONTAINER","VENDOR","CONTRACTOR","GOVERNMENT","EMERGENCY","PRIVATE","COMPANY"];

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [formData, setFormData] = useState({
    vehicle_number: "", vehicle_type: "TRUCK", make_model: "",
    driver_name: "", driver_mobile: "", driver_aadhaar: "", transport_company: ""
  });

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/vehicles/");
      setVehicles(res.data);
    } catch { toast.error("Failed to fetch vehicles"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleOpenModal = (vehicle: any = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({ vehicle_number: vehicle.vehicle_number, vehicle_type: vehicle.vehicle_type,
        make_model: vehicle.make_model || "", driver_name: vehicle.driver_name || "",
        driver_mobile: vehicle.driver_mobile || "", driver_aadhaar: vehicle.driver_aadhaar || "",
        transport_company: vehicle.transport_company || ""
      });
    } else {
      setEditingVehicle(null);
      setFormData({ vehicle_number: "", vehicle_type: "TRUCK", make_model: "", driver_name: "", driver_mobile: "", driver_aadhaar: "", transport_company: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await api.put(`/api/vehicles/${editingVehicle.id}`, formData);
        toast.success("Vehicle updated");
      } else {
        await api.post("/api/vehicles/", formData);
        toast.success("Vehicle registered");
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) { toast.error(err.response?.data?.detail || "Error"); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      toast.success("Vehicle deleted");
      fetchVehicles();
    } catch { toast.error("Failed to delete"); }
  };

  const handleBlacklist = async (vehicle: any) => {
    const reason = window.prompt("Blacklist reason:");
    if (!reason) return;
    try {
      await api.post(`/api/vehicles/${vehicle.id}/blacklist?reason=${encodeURIComponent(reason)}`);
      toast.success("Vehicle blacklisted");
      fetchVehicles();
    } catch { toast.error("Failed to blacklist"); }
  };

  const handleInitiatePass = (vehicle: any) => {
    const params = new URLSearchParams({
      type: "vehicle",
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      driver_name: vehicle.driver_name || "",
      driver_mobile: vehicle.driver_mobile || "",
      driver_aadhaar: vehicle.driver_aadhaar || "",
      transport_company: vehicle.transport_company || ""
    });
    navigate(`/register?${params.toString()}`);
  };

  const filtered = vehicles.filter(v =>
    v.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.transport_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Total Vehicles</p><h3 className="text-2xl font-bold mt-1">{vehicles.length}</h3></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Active</p><h3 className="text-2xl font-bold mt-1 text-green-600">{vehicles.filter(v => !v.is_blacklisted).length}</h3></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-500">Blacklisted</p><h3 className="text-2xl font-bold mt-1 text-red-600">{vehicles.filter(v => v.is_blacklisted).length}</h3></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Vehicle Registry</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" /><Input type="search" placeholder="Search vehicles..." className="pl-9 m-0 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <Button onClick={() => navigate('/register?type=vehicle')} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> Register Vehicle Pass
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Transport Co.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-bold whitespace-nowrap">{v.vehicle_number}</TableCell>
                  <TableCell className="whitespace-nowrap"><Badge variant="secondary">{v.vehicle_type}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{v.driver_name || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{v.driver_mobile || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{v.transport_company || "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{v.is_blacklisted ? <Badge variant="danger">Blacklisted</Badge> : <Badge variant="success">Active</Badge>}</TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleInitiatePass(v)} title="Initiate Pass"><Ticket className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(v)} title="Edit"><Edit className="h-4 w-4" /></Button>
                    {!v.is_blacklisted && <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleBlacklist(v)} title="Blacklist"><AlertTriangle className="h-4 w-4" /></Button>}
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(v.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !isLoading && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No vehicles found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingVehicle ? "Edit Vehicle" : "Register Vehicle"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Vehicle Number *" name="vehicle_number" value={formData.vehicle_number} onChange={(e) => setFormData(p => ({...p, vehicle_number: e.target.value.toUpperCase()}))} required placeholder="MH01AB1234" />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Vehicle Type *</label>
                  <select value={formData.vehicle_type} onChange={(e) => setFormData(p => ({...p, vehicle_type: e.target.value}))} className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Make / Model" value={formData.make_model} onChange={(e) => setFormData(p => ({...p, make_model: e.target.value}))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Driver Name" value={formData.driver_name} onChange={(e) => setFormData(p => ({...p, driver_name: e.target.value}))} />
                <Input label="Driver Mobile" value={formData.driver_mobile} onChange={(e) => setFormData(p => ({...p, driver_mobile: e.target.value}))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Driver Aadhaar" value={formData.driver_aadhaar} onChange={(e) => setFormData(p => ({...p, driver_aadhaar: e.target.value}))} />
                <Input label="Transport Company" value={formData.transport_company} onChange={(e) => setFormData(p => ({...p, transport_company: e.target.value}))} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Vehicle</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
