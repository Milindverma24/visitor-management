import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Truck, Package, ShieldOff, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import api from "@/services/api";

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/analytics/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Analytics fetch failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center text-slate-400 py-16">Failed to load analytics data.</div>;

  const todayStats = [
    { label: "Today's Visits", value: data.today.total_visits, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Check-Ins", value: data.today.check_ins, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Check-Outs", value: data.today.check_outs, icon: XCircle, color: "text-slate-600", bg: "bg-slate-50" },
    { label: "Currently Inside", value: data.today.currently_inside, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const allTimeStats = [
    { label: "Pending Approval", value: data.all_time.pending, icon: AlertTriangle, color: "text-yellow-600" },
    { label: "Total Approved", value: data.all_time.approved, icon: CheckCircle, color: "text-green-600" },
    { label: "Rejected", value: data.all_time.rejected, icon: XCircle, color: "text-red-600" },
    { label: "Visitors Registered", value: data.all_time.total_visitors_registered, icon: Users, color: "text-blue-600" },
    { label: "Vehicles Registered", value: data.all_time.total_vehicles_registered, icon: Truck, color: "text-purple-600" },
    { label: "Blacklisted Visitors", value: data.all_time.blacklisted_visitors, icon: ShieldOff, color: "text-red-500" },
  ];

  // Weekly bar chart (simple visual)
  const weeklyMax = Math.max(...(data.weekly_trend || []).map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todayStats.map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                    <h3 className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</h3>
                  </div>
                  <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 7-Day Trend */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> 7-Day Visit Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {(data.weekly_trend || []).map((day: any) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-[#005BAC] rounded-t-md transition-all duration-500"
                  style={{ height: `${weeklyMax > 0 ? (day.count / weeklyMax) * 100 : 0}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                />
                <span className="text-xs text-slate-500 font-mono">{day.count}</span>
                <span className="text-[10px] text-slate-400">{new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Pass Type Breakdown */}
      {data.today.pass_type_breakdown && Object.keys(data.today.pass_type_breakdown).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Today's Pass Type Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(data.today.pass_type_breakdown).map(([type, count]) => (
                <div key={type} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                  <div className="text-2xl font-black text-[#003366]">{count as number}</div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{type.replace("_PASS", "").replace("_", " ")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Time Stats */}
      <Card>
        <CardHeader><CardTitle>All-Time Statistics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {allTimeStats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 text-center">Last updated: {new Date(data.generated_at).toLocaleString("en-IN")}</p>
    </div>
  );
};

export default Analytics;
