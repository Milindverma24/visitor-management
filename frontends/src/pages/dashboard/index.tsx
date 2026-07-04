import React, { useEffect, useState } from "react";
import { Users, UserCheck, ShieldCheck, LogOut, CheckCircle2, XCircle, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import api from "@/services/api";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "@/hooks/useWebSocket";

// IGL brand color palette for charts
const IGL_COLORS = ['#2563EB', '#FBBF24', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4'];

const statCards = [
  { key: "totalVisitors",    label: "Total Visitors",       icon: Users,         bg: "bg-blue-50",   iconColor: "text-[#2563EB]",  border: "border-blue-100", href: "/visitors"  },
  { key: "totalVisits",      label: "Total Visits",          icon: UserCheck,     bg: "bg-indigo-50", iconColor: "text-indigo-600", border: "border-indigo-100", href: "/visitors" },
  { key: "approved",         label: "Approved Visits",       icon: CheckCircle2,  bg: "bg-emerald-50",iconColor: "text-emerald-600",border: "border-emerald-100", href: "/visitors"},
  { key: "rejected",         label: "Rejected Visits",       icon: XCircle,       bg: "bg-red-50",    iconColor: "text-red-500",    border: "border-red-100", href: "/visitors"   },
  { key: "checkedIn",        label: "Currently Inside",      icon: ShieldCheck,   bg: "bg-amber-50",  iconColor: "text-[#FBBF24]",  border: "border-amber-100", href: "/emergency" },
  { key: "checkedOut",       label: "Checked Out Today",     icon: LogOut,        bg: "bg-slate-50",  iconColor: "text-slate-500",  border: "border-slate-200", href: "/checkout" },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVisitors: 0, totalVisits: 0, approved: 0,
    rejected: 0, checkedIn: 0, checkedOut: 0,
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [approvalData, setApprovalData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("User");

  const navigate = useNavigate();
  const { lastMessage, isConnected } = useWebSocket();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserEmail(decoded.sub || "User");
      } catch {}
    }
  }, []);

  const fetchStats = async () => {
      try {
        const [visitsRes, deptsRes] = await Promise.all([
          api.get("/api/visitors/visits"),
          api.get("/api/departments/")
        ]);

        const visits = visitsRes.data || [];
        const departmentsList = deptsRes.data || [];

        const uniqueVisitors = new Set(visits.map((v: any) => v.visitor_id)).size;
        setStats({
          totalVisitors: uniqueVisitors,
          totalVisits: visits.length,
          approved: visits.filter((v: any) => v.status === "APPROVED").length,
          rejected: visits.filter((v: any) => v.status === "REJECTED").length,
          checkedIn: visits.filter((v: any) => v.check_in_time && !v.check_out_time).length,
          checkedOut: visits.filter((v: any) => v.check_out_time).length,
        });

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

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyCounts = visits.reduce((acc: any, v: any) => {
          if (v.created_at) {
            const date = new Date(v.created_at);
            const month = monthNames[date.getMonth()];
            if (!acc[month]) acc[month] = { name: month, visitors: 0, Approved: 0, Rejected: 0 };
            acc[month].visitors += 1;
            if (v.status === "APPROVED") acc[month].Approved += 1;
            if (v.status === "REJECTED") acc[month].Rejected += 1;
          }
          return acc;
        }, {});

        const monthlyArray = monthNames
          .map(m => monthlyCounts[m] || { name: m, visitors: 0, Approved: 0, Rejected: 0 })
          .filter(m => m.visitors > 0 || m.name === monthNames[new Date().getMonth()]);
        setMonthlyData(monthlyArray);

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyCounts = visits.reduce((acc: any, v: any) => {
          if (v.created_at) {
            const date = new Date(v.created_at);
            // Only consider last 7 days roughly for weekly trend, or just group by day of week
            const day = dayNames[date.getDay()];
            if (!acc[day]) acc[day] = { name: day, visitors: 0, Approved: 0, Rejected: 0 };
            acc[day].visitors += 1;
            if (v.status === "APPROVED") acc[day].Approved += 1;
            if (v.status === "REJECTED") acc[day].Rejected += 1;
          }
          return acc;
        }, {});
        
        // Ensure days are in sequence from Mon to Sun
        const sortedDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyArray = sortedDayNames
          .map(d => weeklyCounts[d] || { name: d, visitors: 0, Approved: 0, Rejected: 0 });
        setWeeklyData(weeklyArray);

        const recent = visits
          .filter((v: any) => v.status === "APPROVED")
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setRecentApprovals(recent);

      } catch (error) {
        toast.error("Failed to load dashboard statistics");
        console.error(error);
      }
    };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      console.log("WebSocket event received:", lastMessage.type);
      fetchStats();
    }
  }, [lastMessage]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="space-y-8">

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-slate-800 rounded-2xl px-6 py-5 text-white flex items-center justify-between shadow-lg">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Welcome back</p>
          <h2 className="text-xl font-black tracking-tight">{userEmail}</h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {today}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[#2563EB]/20 border border-[#2563EB]/30 rounded-xl px-4 py-2">
          {isConnected ? (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-500" />
          )}
          <TrendingUp className="w-4 h-4 text-[#FBBF24]" />
          <span className="text-xs font-bold text-slate-300">Live Dashboard</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, bg, iconColor, border, href }) => (
          <Card 
            key={key} 
            onClick={() => href && navigate(href)}
            className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-[#2563EB]/30"
          >
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="mt-1.5 text-3xl font-black text-slate-900">
                  {stats[key as keyof typeof stats]}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${bg} border ${border} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly Trend Chart */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Weekly Approvals (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="Approved" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Approvals Chart */}
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Monthly Approvals vs Rejections
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line
                  type="monotone"
                  name="Approved"
                  dataKey="Approved"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  name="Rejected"
                  dataKey="Rejected"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: "#EF4444", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7, fill: "#DC2626", stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Pie Chart - Full Width or span */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Visitor Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={4}
                  dataKey="visitors"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {departmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={IGL_COLORS[index % IGL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sequence: Recent Approvals Table */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4 bg-slate-50/50">
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide flex justify-between items-center">
              <span>Recently Approved Sequence</span>
              <Badge variant="secondary" className="text-xs bg-white text-slate-500 font-normal border border-slate-200">Last {recentApprovals.length} Records</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[120px] font-semibold">Pass ID</TableHead>
                    <TableHead className="font-semibold">Visitor Name</TableHead>
                    <TableHead className="font-semibold">Host</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="text-right font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentApprovals.map((visit) => (
                    <TableRow key={visit.id} className="transition-colors hover:bg-slate-50/80">
                      <TableCell className="font-medium text-[#2563EB]">{visit.card_id}</TableCell>
                      <TableCell className="font-medium text-slate-900">{visit.visitor_name || "Visitor"}</TableCell>
                      <TableCell className="text-slate-600">{visit.host_employee}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(visit.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
                          {visit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentApprovals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No recent approvals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
