import api from "./api";

export const getVisits = () =>
  api.get(
    "/api/visitors/visits"
  );

export const approveVisit = (
  id: number
) =>
  api.put(
    `/api/visitors/approve/${id}`
  );

export const rejectVisit = (
  id: number
) =>
  api.put(
    `/api/visitors/reject/${id}`
  );
  