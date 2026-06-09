import React, { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ShieldAlert, Search } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/services/api";

const VisitorDirectory = () => {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVisitors = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/visitors/");
      const sorted = res.data.sort((a: any, b: any) => b.id - a.id);
      setVisitors(sorted);
    } catch (error) {
      console.error("Failed to fetch visitors", error);
      toast.error("Failed to load visitors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleBlacklist = async (id: number) => {
    if (!window.confirm("Are you sure you want to blacklist this visitor?")) return;
    try {
      await api.put(`/api/visitors/blacklist/${id}`);
      toast.success("Visitor blacklisted successfully");
      fetchVisitors();
    } catch (error) {
      toast.error("Failed to blacklist visitor");
    }
  };

  const filteredVisitors = visitors;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Visitor Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={filteredVisitors}
            filename="visitor_directory"
            searchPlaceholder="Search visitors..."
            columns={[
              {
                header: "Name",
                accessorKey: "full_name",
                cell: (row: any) => <span className="font-medium">{row.full_name}</span>
              },
              {
                header: "Phone",
                accessorKey: "phone_number",
                nowrap: true
              },
              {
                header: "Email",
                accessorKey: "email"
              },
              {
                header: "Company",
                accessorKey: "company"
              },
              {
                header: "Status",
                accessorKey: "is_blacklisted",
                nowrap: true,
                cell: (row: any) => row.is_blacklisted ? (
                  <Badge variant="danger">BLACKLISTED</Badge>
                ) : (
                  <Badge variant="success">ACTIVE</Badge>
                )
              },
              {
                header: "Actions",
                accessorKey: "actions",
                sortable: false,
                nowrap: true,
                cell: (row: any) => !row.is_blacklisted && (
                  <div className="text-right">
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleBlacklist(row.id); }}>
                      <ShieldAlert className="h-4 w-4 mr-1" /> Blacklist
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorDirectory;