import api from "./api";

export const getAnalytics = () =>
  api.get(
    "/api/admin/analytics"
  );