import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, FileText, Table as TableIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

const Reports = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    status: "",
    department_id: "",
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/api/departments/");
        setDepartments(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDepts();
  }, []);

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const params = new URLSearchParams();
      params.append("format", format);
      if (filter.status) params.append("status", filter.status);
      if (filter.department_id) params.append("department_id", filter.department_id);

      const response = await api.get(`/api/reports/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `visits_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Custom Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Visit Status</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Department</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                value={filter.department_id}
                onChange={(e) => setFilter({ ...filter, department_id: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
              Generate and download reports based on the selected filters.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleExport("csv")} className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-900">
                <FileText className="mr-2 h-4 w-4" /> CSV Export
              </Button>
              <Button onClick={() => handleExport("excel")} className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700">
                <TableIcon className="mr-2 h-4 w-4" /> Excel Export
              </Button>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-md text-sm border border-blue-100 flex items-start">
                <Download className="h-5 w-5 mr-3 shrink-0 text-blue-600" />
                <p>Exports respect Data Isolation (RBAC) rules. You will only export data you are authorized to see based on your department and role.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
