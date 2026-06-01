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
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Departments</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search departments..." 
                className="pl-9 m-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Head</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-mono">{dept.code}</TableCell>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.head || "N/A"}</TableCell>
                  <TableCell>
                    {dept.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
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
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                    No departments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingDept ? "Edit Department" : "Add Department"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  className="rounded border-slate-300 text-secondary focus:ring-secondary"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active Status</label>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleCloseModal}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
