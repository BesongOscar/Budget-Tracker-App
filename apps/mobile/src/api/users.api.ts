import api from "./axios";

export interface UpdateProfilePayload {
  fullName?: string;
  currencyCode?: string;
}

export const usersApi = {
  updatePushToken: (pushToken: string) =>
    api.patch("/users/me/push-token", { pushToken }),
  removePushToken: () => api.delete("/users/me/push-token"),
  sendTestPush: () => api.post("/users/me/push-token/test"),
  getMe: () => api.get("/users/me"),
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch("/users/me", payload),
};
