import api from "./api";

export const getUsers = (params?: { department_name?: string; department_id?: number }) => 
  api.get("/api/users/", { params });

export const createUser = (data: any) => api.post("/api/users/", data);
export const updateUser = (id: number, data: any) => api.put(`/api/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);
