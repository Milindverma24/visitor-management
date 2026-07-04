import api from "./api";

export const getPlants = async () => {
  return await api.get("/api/plants/");
};

export const getPublicPlants = async () => {
  return await api.get("/api/plants/public");
};

export const createPlant = async (data: any) => {
  return await api.post("/api/plants/", data);
};

export const updatePlant = async (id: number, data: any) => {
  return await api.put(`/api/plants/${id}`, data);
};

export const deactivatePlant = async (id: number) => {
  return await api.delete(`/api/plants/${id}`);
};
