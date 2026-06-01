import api from "./api";

export const loginUser = async (data: any) => {
  return await api.post("/api/auth/login", data);
};
