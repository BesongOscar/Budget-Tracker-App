import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Services — DB-only project; no Neon Auth/Data API/Functions/Storage.
  auth: false,
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Production branch defaults. (Protected branches need a paid plan.)
      return {};
    }
    if (!branch.exists) {
      // New ephemeral branches: auto-expire after a week at minimum compute.
      // Run `neon checkout <name>` to create a new branch with these settings.
      return {
        ttl: "7d",
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 0.25,
          },
        },
      };
    }
    // Existing branches: no changes
    return {};
  },
});
