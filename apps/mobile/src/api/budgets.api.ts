import api from "./axios";

export const budgetsApi = {
  getPeriod: (params: { month?: string; status?: string; categoryId?: string }) =>
    api.get("/budgets", { params }),

  getForCategory: (categoryId: string, periodMonth?: string) =>
    api.get("/budgets", {
      params: { categoryId, ...(periodMonth ? { month: periodMonth } : {}) },
    }),

  getOne: (id: string) => api.get(`/budgets/${id}`),

  create: (data: {
    categoryId: string;
    periodMonth?: string;
    allocatedAmount?: number;
  }) => api.post("/budgets", data),

  update: (id: string, data: { allocatedAmount: number }) =>
    api.patch(`/budgets/${id}`, data),

  remove: (id: string) => api.delete(`/budgets/${id}`),

  copyPeriod: (data: { fromMonth: string; toMonth: string }) =>
    api.post("/budgets/copy-period", data),
};
