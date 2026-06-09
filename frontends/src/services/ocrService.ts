import axios from "axios";
import api from "./api";

export const uploadAadhaar = (
  formData: FormData
) => {
  const token = localStorage.getItem("token");
  return axios.post(
    "/api/ocr/aadhaar",
    formData,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }
  );
};