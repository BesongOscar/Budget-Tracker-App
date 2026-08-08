import api from "./axios";

export const transactionsApi = {
  getAll: (params: {
    type?: string;
    categoryId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => api.get("/transactions", { params }),

  getOne: (id: string) => api.get(`/transactions/${id}`),

  create: (data: {
    amount: number;
    type: string;
    categoryId: string;
    date: string;
    description?: string;
  }) => api.post("/transactions", data),

  update: (
    id: string,
    data: {
      amount?: number;
      type?: string;
      categoryId?: string;
      date?: string;
      description?: string;
    },
  ) => api.patch(`/transactions/${id}`, data),

  remove: (id: string) => api.delete(`/transactions/${id}`),
};
