import axios from "axios";
import api from "./api";

export const createVisitor = (data: any) =>
  api.post("/api/visitors/", data);

export const getVisitors = () =>
  api.get("/api/visitors/");

export const searchVisitor = (
  phone: string
) =>
  api.get(
    `/api/visitors/search/${phone}`
  );

export const uploadPhoto = (
  formData: FormData
) => {
  const token = localStorage.getItem("token");
  return axios.post(
    "/api/visitors/photo",
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
};

export const getVisitorStatus = (phone: string) =>
  api.get(`/api/visitors/status/${phone}`);