import api from "./api";

export const getDepartments = () => api.get("/api/departments/");
export const getPublicDepartments = (plant_id?: number) => 
  api.get(plant_id ? `/api/departments/public?plant_id=${plant_id}` : "/api/departments/public");
export const createDepartment = (data: any) => api.post("/api/departments/", data);
export const updateDepartment = (id: number, data: any) => api.put(`/api/departments/${id}`, data);
export const deleteDepartment = (id: number) => api.delete(`/api/departments/${id}`);
