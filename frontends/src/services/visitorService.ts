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
) =>
  api.post(
    "/api/visitors/photo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );