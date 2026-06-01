import api from "./api";

export const createVisit = (
  data: any
) =>
  api.post(
    "/api/visitors/visit",
    data
  );

export const getVisits = () =>
  api.get("/api/visitors/visits");

export const approveVisit = (id: number) =>
  api.put(`/api/visitors/approve/${id}`);

export const rejectVisit = (id: number) =>
  api.put(`/api/visitors/reject/${id}`);

export const checkInVisit = (id: number) =>
  api.put(`/api/visitors/checkin/${id}`);

export const checkOutVisit = (id: number) =>
  api.put(`/api/visitors/checkout/${id}`);