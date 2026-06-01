import api from "./api";

export const checkOut = (
  visitId: number
) =>
  api.put(
    `/api/visitors/checkout/${visitId}`
  );