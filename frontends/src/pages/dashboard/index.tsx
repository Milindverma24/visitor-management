import React, { useEffect, useState } from "react";
import { Users, UserCheck, ShieldCheck, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from "@/services/api";
import toast from "react-hot-toast";

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: number, icon: any, colorClass: string }) => (
  <Card>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </CardContent>
  </Card>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    totalVisits: 0,
    approved: 0,
    rejected: 0,
    checkedIn: 0,
    checkedOut: 0,
  });

  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [approvalData, setApprovalData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [visitsRes, deptsRes] = await Promise.all([
          api.get("/api/visitors/visits"),
          api.get("/api/departments/")
        ]);
        
        const visits = visitsRes.data || [];
        const departmentsList = deptsRes.data || [];
        
        // Compute Totals
        const uniqueVisitors = new Set(visits.map((v: any) => v.visitor_id)).size;
        
        setStats({
          totalVisitors: uniqueVisitors,
          totalVisits: visits.length,
          approved: visits.filter((v: any) => v.status === "APPROVED").length,
          rejected: visits.filter((v: any) => v.status === "REJECTED").length,
          checkedIn: visits.filter((v: any) => v.check_in_time && !v.check_out_time).length,
          checkedOut: visits.filter((v: any) => v.check_out_time).length,
        });

        // Compute Department Data
        const deptMap = departmentsList.reduce((acc: any, d: any) => {
          acc[d.id] = d.name;
          return acc;
        }, {});

        const deptCounts = visits.reduce((acc: any, v: any) => {
          const deptName = v.department_id ? deptMap[v.department_id] || "General" : "General";
          if (!acc[deptName]) acc[deptName] = { name: deptName, visitors: 0, Approved: 0, Rejected: 0 };
          acc[deptName].visitors += 1;
          if (v.status === "APPROVED") acc[deptName].Approved += 1;
          if (v.status === "REJECTED") acc[deptName].Rejected += 1;
          return acc;
        }, {});

        const deptArray = Object.values(deptCounts);
        setDepartmentData(deptArray);
        setApprovalData(deptArray);

        // Compute Monthly Data (simple implementation)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCounts = visits.reduce((acc: any, v: any) => {
          if (v.created_at) {
            const date = new Date(v.created_at);
            const month = monthNames[date.getMonth()];
            if (!acc[month]) acc[month] = { name: month, visitors: 0 };
            acc[month].visitors += 1;
          }
          return acc;
        }, {});
        
        // Ensure chronological order
        const monthlyArray = monthNames.map(m => monthlyCounts[m] || { name: m, visitors: 0 }).filter(m => m.visitors > 0 || m.name === monthNames[new Date().getMonth()]);
        setMonthlyData(monthlyArray);

      } catch (error) {
        toast.error("Failed to load dashboard statistics");
        console.error(error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Visitors" value={stats.totalVisitors} icon={Users} colorClass="bg-blue-100 text-blue-600" />
        <StatCard title="Total Visits" value={stats.totalVisits} icon={UserCheck} colorClass="bg-indigo-100 text-indigo-600" />
        <StatCard title="Approved Visits" value={stats.approved} icon={CheckCircle2} colorClass="bg-green-100 text-green-600" />
        <StatCard title="Rejected Visits" value={stats.rejected} icon={XCircle} colorClass="bg-red-100 text-red-600" />
        <StatCard title="Currently Checked In" value={stats.checkedIn} icon={ShieldCheck} colorClass="bg-yellow-100 text-yellow-600" />
        <StatCard title="Checked Out" value={stats.checkedOut} icon={LogOut} colorClass="bg-slate-100 text-slate-600" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitors by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="visitors"
                  label
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approvals vs Rejections</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Approved" stackId="a" fill="#10b981" />
                <Bar dataKey="Rejected" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Visitors Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
