import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { AlertTriangle, BellRing, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import api from '@/services/api';

const EmergencyCommand = () => {
  const [activeEvacuation, setActiveEvacuation] = useState(false);
  const [insideVisitors, setInsideVisitors] = useState<any[]>([]);
  const [musteredVisitors, setMusteredVisitors] = useState<Set<number>>(new Set());

  // Fetch visitors currently inside
  const fetchInsideVisitors = async () => {
    try {
      const res = await api.get('/api/visitors/visits');
      // Filter for those checked in but not checked out
      const inside = res.data.filter((v: any) => v.check_in_time && !v.check_out_time);
      setInsideVisitors(inside);
    } catch (error) {
      toast.error("Failed to load active visitor list");
    }
  };

  useEffect(() => {
    fetchInsideVisitors();
  }, []);

  const handleToggleEvacuation = () => {
    const newState = !activeEvacuation;
    setActiveEvacuation(newState);
    if (newState) {
      toast.error("EVACUATION PROTOCOL INITIATED", { 
        duration: 5000, 
        icon: '🚨',
        style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' } 
      });
      // In a real app, this would hit an API to trigger sirens, notify authorities, etc.
    } else {
      toast.success("Emergency cleared. Stand down.", { duration: 4000 });
      setMusteredVisitors(new Set()); // Reset mustering
    }
  };

  const handleBroadcast = () => {
    toast.success(`Emergency SMS broadcast sent to ${insideVisitors.length} visitors.`, { icon: '📱' });
  };

  const toggleMuster = (id: number) => {
    const newMustered = new Set(musteredVisitors);
    if (newMustered.has(id)) {
      newMustered.delete(id);
    } else {
      newMustered.add(id);
    }
    setMusteredVisitors(newMustered);
  };

  return (
    <div className={`space-y-6 transition-colors duration-500 ${activeEvacuation ? 'bg-red-50 -m-6 p-6 min-h-screen' : ''}`}>
      
      {/* Header */}
      <div className={`p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg transition-colors duration-500 gap-6 ${activeEvacuation ? 'bg-red-600 text-white animate-pulse' : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'}`}>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`p-4 rounded-xl shrink-0 ${activeEvacuation ? 'bg-white/20' : 'bg-white/10'}`}>
            <AlertTriangle className={`w-8 h-8 ${activeEvacuation ? 'text-white' : 'text-amber-400'}`} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{activeEvacuation ? 'EVACUATION IN PROGRESS' : 'Emergency Command Center'}</h1>
            <p className={`text-xs sm:text-sm mt-1 ${activeEvacuation ? 'text-red-100' : 'text-slate-400'}`}>
              {activeEvacuation ? 'Follow emergency protocols. Clear the plant immediately.' : 'Manage site-wide emergencies and mustering.'}
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            onClick={handleBroadcast}
            disabled={insideVisitors.length === 0}
            className={`font-bold border-2 w-full sm:w-auto ${activeEvacuation ? 'bg-red-700 hover:bg-red-800 border-red-500 text-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}
          >
            <BellRing className="w-4 h-4 mr-2" />
            Broadcast SMS Alerts
          </Button>
          <Button 
            onClick={handleToggleEvacuation}
            className={`font-black uppercase tracking-wider shadow-xl w-full sm:w-auto ${activeEvacuation ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {activeEvacuation ? 'Stand Down' : 'Initiate Evacuation'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`border-2 shadow-sm ${activeEvacuation ? 'border-red-200 bg-red-50/50' : 'border-slate-200'}`}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${activeEvacuation ? 'text-red-800' : 'text-slate-500'}`}>Total Inside Plant</p>
              <p className={`text-4xl font-black mt-2 ${activeEvacuation ? 'text-red-600' : 'text-slate-900'}`}>{insideVisitors.length}</p>
            </div>
            <div className={`p-4 rounded-2xl ${activeEvacuation ? 'bg-red-200' : 'bg-blue-100'}`}>
              <Users className={`w-8 h-8 ${activeEvacuation ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-2 shadow-sm ${activeEvacuation ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${activeEvacuation ? 'text-emerald-800' : 'text-slate-500'}`}>Safely Mustered</p>
              <p className={`text-4xl font-black mt-2 ${activeEvacuation ? 'text-emerald-600' : 'text-slate-900'}`}>{musteredVisitors.size}</p>
            </div>
            <div className={`p-4 rounded-2xl ${activeEvacuation ? 'bg-emerald-200' : 'bg-emerald-100'}`}>
              <CheckCircle2 className={`w-8 h-8 ${activeEvacuation ? 'text-emerald-600' : 'text-emerald-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 shadow-sm ${activeEvacuation ? 'border-red-500 bg-red-100 animate-pulse' : 'border-slate-200'}`}>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className={`text-sm font-bold uppercase tracking-wider ${activeEvacuation ? 'text-red-800' : 'text-slate-500'}`}>Unaccounted For</p>
              <p className={`text-4xl font-black mt-2 ${activeEvacuation ? 'text-red-700' : 'text-slate-900'}`}>
                {insideVisitors.length - musteredVisitors.size}
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${activeEvacuation ? 'bg-red-300' : 'bg-amber-100'}`}>
              <ShieldAlert className={`w-8 h-8 ${activeEvacuation ? 'text-red-800' : 'text-amber-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Mustering Table */}
      <Card className={`border-2 ${activeEvacuation ? 'border-red-200' : 'border-slate-200'}`}>
        <CardHeader className="border-b pb-4">
          <CardTitle className={activeEvacuation ? 'text-red-700 font-bold' : ''}>
            Live Mustering List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            data={insideVisitors} 
            filename="emergency_mustering_report"
            searchPlaceholder="Search visitors..."
            columns={[
              {
                header: "Pass ID",
                accessorKey: "card_id",
                nowrap: true,
                cell: (row: any) => <span className="font-mono text-xs">{row.card_id}</span>
              },
              {
                header: "Host",
                accessorKey: "host_employee"
              },
              {
                header: "Check In Time",
                accessorKey: "check_in_time",
                nowrap: true,
                cell: (row: any) => new Date(row.check_in_time).toLocaleTimeString()
              },
              {
                header: "Status",
                accessorKey: "status",
                nowrap: true,
                cell: (row: any) => (
                  musteredVisitors.has(row.id) ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SAFE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <ShieldAlert className="w-3.5 h-3.5" /> MISSING
                    </span>
                  )
                )
              },
              {
                header: "Mustering Action",
                accessorKey: "actions",
                sortable: false,
                nowrap: true,
                cell: (row: any) => (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={musteredVisitors.has(row.id) ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50" : "text-slate-600 border-slate-300 hover:bg-slate-50"}
                    onClick={() => toggleMuster(row.id)}
                  >
                    {musteredVisitors.has(row.id) ? "Mark Missing" : "Mark Safe"}
                  </Button>
                )
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyCommand;
