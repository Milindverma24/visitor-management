import api from "./api";

export const uploadAadhaar = (
  formData: FormData
) =>
  api.post(
    "/api/ocr/aadhaar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );