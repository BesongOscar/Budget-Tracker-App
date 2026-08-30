import api from "./axios";

export const analyticsApi = {
  getSummary: (periodMonth?: string) =>
    api.get("/analytics/summary", {
      params: periodMonth ? { periodMonth } : {},
    }),

  getByCategory: (periodMonth?: string) =>
    api.get("/analytics/by-category", {
      params: periodMonth ? { periodMonth } : {},
    }),

  getTrend: (months?: number) =>
    api.get("/analytics/trend", {
      params: months ? { months } : {},
    }),
};
