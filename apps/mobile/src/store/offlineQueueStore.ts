import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OfflineOp =
  | {
      kind: "transaction";
      action: "create" | "update" | "delete";
      id?: string;
      payload?: any;
    }
  | {
      kind: "category";
      action: "create" | "update" | "delete";
      id?: string;
      payload?: any;
    }
  | {
      kind: "budget";
      action: "create" | "update" | "delete" | "copy";
      id?: string;
      payload?: any;
    }
  | { kind: "profile"; action: "update"; payload: any };

export interface OutboxItem {
  uid: string;
  op: OfflineOp;
  createdAt: string;
}

interface QueueState {
  queue: OutboxItem[];
  enqueue: (op: OfflineOp) => void;
  remove: (uid: string) => void;
  clear: () => void;
}

export const useOfflineQueueStore = create<QueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (op) =>
        set((s) => ({
          queue: [
            ...s.queue,
            {
              uid: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
              op,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      remove: (uid) =>
        set((s) => ({ queue: s.queue.filter((i) => i.uid !== uid) })),
      clear: () => set({ queue: [] }),
    }),
    {
      name: "BUDGET_TRACKER_OUTBOX",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
