import api from "./axios";

export const budgetsApi = {
  getForCategory: (categoryId: string, periodMonth?: string) =>
    api.get("/budgets", {
      params: { categoryId, ...(periodMonth ? { periodMonth } : {}) },
    }),
};
