import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/services/departmentService";

const Departments = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    head: "",
    email: "",
    phone: "",
    is_active: true
  });

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenModal = (dept: any = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        code: dept.code,
        head: dept.head || "",
        email: dept.email || "",
        phone: dept.phone || "",
        is_active: dept.is_active
      });
    } else {
      setEditingDept(null);
      setFormData({ name: "", code: "", head: "", email: "", phone: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, formData);
        toast.success("Department updated");
      } else {
        await createDepartment(formData);
        toast.success("Department created");
      }
      handleCloseModal();
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Department deleted");
      fetchDepartments();
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  const filtered = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = departments.filter(d => d.is_active).length;
  const inactiveCount = departments.length - activeCount;

  return (
    <div className="space-y-6">
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Departments</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{departments.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Active</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">{activeCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Inactive</p>
                <h3 className="text-2xl font-bold text-slate-400 mt-1">{inactiveCount}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
          <CardTitle className="text-xl font-bold text-slate-800">Departments</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search departments..." 
                className="pl-9 m-0 w-full bg-white border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto justify-center bg-cyan-600 hover:bg-cyan-700 text-white transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 pl-6 whitespace-nowrap">Code</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap min-w-[180px]">Name</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Head</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((dept) => (
                  <TableRow key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4 font-mono whitespace-nowrap">{dept.code}</TableCell>
                    <TableCell className="font-medium break-words">{dept.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{dept.head || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dept.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right whitespace-nowrap space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(dept)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(dept.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                      <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No departments found matching your search</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-auto overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">{editingDept ? "Edit Department" : "Add Department"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <Input label="Department Name" name="name" value={formData.name} onChange={handleInputChange} required />
              <Input label="Department Code" name="code" value={formData.code} onChange={handleInputChange} required />
              <Input label="Department Head" name="head" value={formData.head} onChange={handleInputChange} />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  name="is_active" 
                  checked={formData.is_active} 
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-secondary focus:ring-secondary h-4 w-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Status</label>
              </div>

              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 sm:space-x-2 space-y-reverse">
                <Button variant="outline" type="button" onClick={handleCloseModal} className="w-full sm:w-auto justify-center">Cancel</Button>
                <Button type="submit" className="w-full sm:w-auto justify-center">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
