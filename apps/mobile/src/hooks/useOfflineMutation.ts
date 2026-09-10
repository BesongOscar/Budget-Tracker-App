import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useNetwork } from "./useNetwork";
import { useOfflineQueueStore, OfflineOp } from "@/src/store/offlineQueueStore";

interface OfflineMutationOptions<TData, TVars> extends
  Omit<UseMutationOptions<TData, unknown, TVars, unknown>, "mutationFn"> {
  mutationFn: (vars: TVars) => Promise<TData>;
  op: (vars: TVars) => OfflineOp;
  invalidateKeys: string[][];
}

export function useOfflineMutation<TData, TVars>(
  options: OfflineMutationOptions<TData, TVars>,
) {
  const { isOffline } = useNetwork();

  const mutation = useMutation<TData, unknown, TVars, unknown>({
    ...options,
    mutationFn: async (vars: TVars) => {
      if (isOffline) {
        // Queue the write; return a sentinel so callbacks can show a message.
        useOfflineQueueStore.getState().enqueue(options.op(vars));
        return { __queued: true } as unknown as TData;
      }
      return options.mutationFn(vars);
    },
  });

  return mutation;
}
