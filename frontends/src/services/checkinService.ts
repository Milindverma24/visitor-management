import api from "./api";

export const checkIn = (
  visitId: number
) =>
  api.put(
    `/api/visitors/checkin/${visitId}`
  );