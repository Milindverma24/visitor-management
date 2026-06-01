import api from "./api";

export const getAuditLogs = () =>
  api.get(
    "/api/visitors/audit-logs"
  );