import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { getPlants, createPlant, updatePlant, deactivatePlant } from "@/services/plantService";

const Locations = () => {
  const [plants, setPlants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<any>(null);

  const [formData, setFormData] = useState({
    plant_name: "",
    plant_code: "",
    is_active: true
  });

  const fetchPlants = async () => {
    try {
      setIsLoading(true);
      const res = await getPlants();
      setPlants(res.data);
    } catch (error) {
      toast.error("Failed to fetch locations");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleOpenModal = (plant: any = null) => {
    if (plant) {
      setEditingPlant(plant);
      setFormData({
        plant_name: plant.plant_name,
        plant_code: plant.plant_code,
        is_active: plant.is_active
      });
    } else {
      setEditingPlant(null);
      setFormData({ plant_name: "", plant_code: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlant(null);
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
      if (editingPlant) {
        await updatePlant(editingPlant.id, formData);
        toast.success("Location updated");
      } else {
        await createPlant(formData);
        toast.success("Location created");
      }
      handleCloseModal();
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "An error occurred");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to deactivate this location?")) return;
    try {
      await deactivatePlant(id);
      toast.success("Location deactivated");
      fetchPlants();
    } catch (error) {
      toast.error("Failed to deactivate location");
    }
  };

  const filtered = plants.filter(p => 
    p.plant_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.plant_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = plants.filter(p => p.is_active).length;
  const inactiveCount = plants.length - activeCount;

  return (
    <div className="space-y-6">
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Locations</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{plants.length}</h3>
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
          <CardTitle className="text-xl font-bold text-slate-800">Locations (Plants)</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64 mt-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                type="search" 
                placeholder="Search locations..." 
                className="pl-9 m-0 w-full bg-white border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto justify-center bg-cyan-600 hover:bg-cyan-700 text-white transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-50/40">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 pl-6 whitespace-nowrap">Code</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap min-w-[180px]">Location Name</TableHead>
                  <TableHead className="font-semibold text-slate-600 whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold text-slate-600 pr-6 text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((plant) => (
                  <TableRow key={plant.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="pl-6 py-4 font-mono whitespace-nowrap">{plant.plant_code}</TableCell>
                    <TableCell className="font-medium break-words">{plant.plant_name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {plant.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right whitespace-nowrap space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenModal(plant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(plant.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                      <Search className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">No locations found matching your search</p>
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
              <h3 className="text-lg font-semibold text-slate-800">{editingPlant ? "Edit Location" : "Add Location"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <Input label="Location Name" name="plant_name" value={formData.plant_name} onChange={handleInputChange} required />
              <Input label="Location Code" name="plant_code" value={formData.plant_code} onChange={handleInputChange} required />
              
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

export default Locations;
