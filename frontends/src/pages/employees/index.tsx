import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Edit, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { getUsers, createUser, updateUser, deleteUser, uploadCsv } from "@/services/userService";
import { getDepartments } from "@/services/departmentService";
import { getPlants } from "@/services/plantService";
import { jwtDecode } from "jwt-decode";

const Employees = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("EMPLOYEE");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    employee_id: "",
    role: "EMPLOYEE",
    department_id: "",
    plant_id: "",
    password: "",
    is_active: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role || "EMPLOYEE");
      }
      
      const [usersRes, deptsRes, plantsRes] = await Promise.all([
        getUsers(), 
        getDepartments(),
        getPlants()
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setPlants(plantsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        full_name: user.full_name,
        email: user.email,
        employee_id: user.employee_id || "",
        role: user.role,
        department_id: user.department_id || "",
        plant_id: user.plant_id || "",
        password: "", // Leave blank unless changing
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        full_name: "", 
        email: "", 
        employee_id: "", 
        role: "EMPLOYEE", 
        department_id: "", 
        plant_id: "",
        password: "",
        is_active: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
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
      // Validate password logic
      if (!editingUser && !formData.password) {
        toast.error("Password is required for new employees");
        return;
      }

      const payload = {
        ...formData,
        department_id: formData.department_id ? parseInt(formData.department_id as string) : null,
        plant_id: formData.plant_id ? parseInt(formData.plant_id as string) : null
      };

      if (editingUser) {
        await updateUser(editingUser.id, payload);
        toast.success("Employee updated");
      } else {
        await createUser(payload);
        toast.success("Employee created");
      }
      handleCloseModal();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteUser(id);
      toast.success("Employee deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const toastId = toast.loading("Uploading CSV...");
      const res = await uploadCsv(formData);
      toast.dismiss(toastId);
      
      if (res.data && res.data.success) {
        toast.success(res.data.message || `Added ${res.data.added} employees.`);
        fetchData();
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.response?.data?.detail || "Failed to upload CSV");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const filtered = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDepartmentName = (id: number) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : "None";
  };

  const getPlantName = (id: number) => {
    const plant = plants.find(p => p.id === id);
    return plant ? plant.plant_name : "N/A";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
          <CardTitle>Employee Management</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search employees..." 
                className="pl-9 m-0 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Emp ID</TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">Department</TableHead>
                  <TableHead className="whitespace-nowrap">Role</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono whitespace-nowrap">{user.employee_id || "N/A"}</TableCell>
                    <TableCell className="font-medium whitespace-normal break-words">{user.full_name}</TableCell>
                    <TableCell className="whitespace-normal break-all">{user.email}</TableCell>
                    <TableCell className="whitespace-nowrap"><Badge variant="secondary">{getPlantName(user.plant_id)}</Badge></TableCell>
                    <TableCell className="whitespace-normal break-words">{getDepartmentName(user.department_id)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {user.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                      No employees found.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{editingUser ? "Edit Employee" : "Add Employee"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
              <Input label="Employee ID" name="employee_id" value={formData.employee_id} onChange={handleInputChange} />
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Department</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments
                    .filter(d => !d.plant_id || (formData.plant_id && d.plant_id === parseInt(formData.plant_id)))
                    .map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {userRole === "CORPORATE_SUPER_ADMIN" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Location (Plant)</label>
                  <select
                    name="plant_id"
                    value={formData.plant_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Location</option>
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>{p.plant_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="DEPARTMENT_HEAD">Department Head</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="HR_EXECUTIVE">HR Executive</option>
                  <option value="DEPARTMENT_EXECUTIVE">Department Executive</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="SECURITY_SUPERVISOR">Security Supervisor</option>
                  <option value="SECURITY_GUARD">Security Guard</option>
                  <option value="PLANT_ADMIN">Plant Admin</option>
                  <option value="CORPORATE_SUPER_ADMIN">Corporate Super Admin</option>
                </select>
              </div>

              <Input 
                label={editingUser ? "New Password (Optional)" : "Password"} 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={handleInputChange} 
              />
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  name="is_active" 
                  checked={formData.is_active} 
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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

export default Employees;
