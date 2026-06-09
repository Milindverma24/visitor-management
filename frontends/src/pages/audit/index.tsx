import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";
import api from "@/services/api";

const AuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/api/visitors/audit-logs");
        const sortedLogs = response.data.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setLogs(sortedLogs);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    (log.user_email || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (log.action || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.target_id ? log.target_id.toString() : "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">System Audit Logs</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input 
              type="search" 
              placeholder="Search logs..." 
              className="pl-9 w-full bg-white border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 pl-6 whitespace-nowrap min-w-[200px]">User</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap min-w-[150px]">Action</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Visitor ID</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Employee ID</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 whitespace-nowrap">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4 font-medium text-slate-700 break-all">{log.user_email}</TableCell>
                    <TableCell className="break-words">{log.action}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {log.target_id ? `VST-${log.target_id}` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs whitespace-nowrap">{log.employee_id || 'N/A'}</TableCell>
                    <TableCell className="pr-6 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No logs found matching your search</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs;