import api from "./axios";

export const categoriesApi = {
  getAll: (type?: string) =>
    api.get("/categories", { params: type ? { type } : undefined }),

  getOne: (id: string) => api.get(`/categories/${id}`),

  create: (data: {
    name: string;
    type: string;
    icon?: string;
    color?: string;
  }) => api.post("/categories", data),

  update: (
    id: string,
    data: { name?: string; icon?: string; color?: string },
  ) => api.patch(`/categories/${id}`, data),

  remove: (id: string) => api.delete(`/categories/${id}`),
};
