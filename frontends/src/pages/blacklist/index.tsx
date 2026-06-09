import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Trash2, AlertTriangle, ShieldOff, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

const BLACKLIST_TYPES = ["VISITOR","VEHICLE","COMPANY","CONTRACTOR","VENDOR","DRIVER"];

const BlacklistPage = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkQuery, setCheckQuery] = useState("");
  const [checkResult, setCheckResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    blacklist_type: "VISITOR", reference_identifier: "", reference_name: "", reason: "", incident_description: ""
  });

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/blacklist/?is_active=true");
      setEntries(res.data);
    } catch { toast.error("Failed to fetch blacklist"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    try {
      await api.post("/api/blacklist/", formData);
      toast.success("Added to blacklist");
      setIsModalOpen(false);
      fetchEntries();
    } catch (err: any) { toast.error(err.response?.data?.detail || "Error"); }
  };

  const handleRemove = async (id: number) => {
    const reason = window.prompt("Reason for removal:");
    if (!reason) return;
    try {
      await api.patch(`/api/blacklist/${id}/remove?removal_reason=${encodeURIComponent(reason)}`);
      toast.success("Removed from blacklist");
      fetchEntries();
    } catch { toast.error("Failed to remove"); }
  };

  const handleCheck = async () => {
    if (!checkQuery.trim()) return;
    try {
      const res = await api.post(`/api/blacklist/check?identifier=${encodeURIComponent(checkQuery)}`);
      setCheckResult(res.data);
    } catch { toast.error("Check failed"); }
  };

  const filtered = entries.filter(e =>
    (filterType === "all" || e.blacklist_type === filterType) &&
    (e.reference_identifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     e.reference_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Quick Check Card */}
      <Card className="border-red-100 bg-red-50/30">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-red-700"><AlertTriangle className="w-5 h-5" /> Quick Blacklist Check</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="Enter name, vehicle number, company..." value={checkQuery} onChange={(e) => setCheckQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCheck()} className="flex-1" />
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleCheck}><Search className="h-4 w-4" /></Button>
          </div>
          {checkResult && (
            <div className={`mt-3 p-3 rounded-lg border text-sm font-medium flex items-center gap-2 ${checkResult.is_blacklisted ? "bg-red-100 border-red-300 text-red-800" : "bg-green-100 border-green-300 text-green-800"}`}>
              {checkResult.is_blacklisted ? <><AlertTriangle className="w-4 h-4" /> ⛔ BLACKLISTED — {checkResult.reason}</> : <><CheckCircle className="w-4 h-4" /> ✅ NOT BLACKLISTED — Clear for entry</>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
          <CardTitle className="flex items-center gap-2"><ShieldOff className="w-5 h-5 text-red-500" /> Blacklist Registry</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white text-slate-700 flex-1 sm:flex-none w-full sm:w-auto">
                <option value="all">All Types</option>
                {BLACKLIST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input type="search" placeholder="Search..." className="pl-9 m-0 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Add to Blacklist</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Identifier</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Reason</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap"><Badge variant="danger">{e.blacklist_type}</Badge></TableCell>
                    <TableCell className="font-mono font-bold whitespace-nowrap">{e.reference_identifier}</TableCell>
                    <TableCell className="whitespace-normal break-words">{e.reference_name || "—"}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-xs">{e.reason}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">{new Date(e.blacklisted_at).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRemove(e.id)}><CheckCircle className="h-4 w-4 mr-1" /> Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No blacklist entries.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-700">Add to Blacklist</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Blacklist Type *</label>
                <select value={formData.blacklist_type} onChange={(e) => setFormData(p => ({...p, blacklist_type: e.target.value}))} className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {BLACKLIST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Identifier (Name/Number) *" value={formData.reference_identifier} onChange={(e) => setFormData(p => ({...p, reference_identifier: e.target.value}))} required />
              <Input label="Display Name" value={formData.reference_name} onChange={(e) => setFormData(p => ({...p, reference_name: e.target.value}))} />
              <div className="space-y-1">
                <label className="text-sm font-medium">Reason *</label>
                <textarea value={formData.reason} onChange={(e) => setFormData(p => ({...p, reason: e.target.value}))} required className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none min-h-[80px] resize-y" placeholder="Reason for blacklisting..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">Add to Blacklist</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlacklistPage;
