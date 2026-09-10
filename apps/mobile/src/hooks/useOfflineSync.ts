import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";
import { useOfflineQueueStore, OfflineOp } from "@/src/store/offlineQueueStore";
import { transactionsApi } from "@/src/api/transactions.api";
import { categoriesApi } from "@/src/api/categories.api";
import { budgetsApi } from "@/src/api/budgets.api";
import { usersApi } from "@/src/api/users.api";

async function executeOp(op: OfflineOp) {
  switch (op.action) {
    case "create": return op.kind === "transaction" ? transactionsApi.create(op.payload)
      : op.kind === "category" ? categoriesApi.create(op.payload)
      : budgetsApi.create(op.payload);
    case "update": return op.kind === "transaction" ? transactionsApi.update(op.id!, op.payload)
      : op.kind === "category" ? categoriesApi.update(op.id!, op.payload)
      : op.kind === "budget" ? budgetsApi.update(op.id!, op.payload)
      : usersApi.updateProfile(op.payload);
    case "delete": return op.kind === "transaction" ? transactionsApi.remove(op.id!)
      : op.kind === "category" ? categoriesApi.remove(op.id!)
      : budgetsApi.remove(op.id!);
    case "copy": return budgetsApi.copyPeriod(op.payload);
  }
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const { isOffline } = useNetwork();
  const { queue, remove } = useOfflineQueueStore();

  useEffect(() => {
    if (isOffline || queue.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const item of queue) {
        if (cancelled) break;
        try {
          await executeOp(item.op);
          remove(item.uid);
        } catch {
          // Leave failed item in queue; stop to avoid out-of-order replays.
          break;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    })();

    return () => { cancelled = true; };
  }, [isOffline]);   // run when connectivity flips back online
}