import api from "./axios";

export const usersApi = {
  updatePushToken: (pushToken: string) =>
    api.patch("/users/me/push-token", { pushToken }),

  removePushToken: () => api.delete("/users/me/push-token"),

  sendTestPush: () => api.post("/users/me/push-token/test"),
};