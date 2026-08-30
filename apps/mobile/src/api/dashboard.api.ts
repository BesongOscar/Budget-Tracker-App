import api from "./axios";

export const dashboardApi = {
  getDashboard: (periodMonth?: string) =>
    api.get("/dashboard", {
      params: periodMonth ? { periodMonth } : {},
    }),
};
