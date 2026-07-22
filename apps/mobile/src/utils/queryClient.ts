import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — cache is fresh
      gcTime: 30 * 60 * 1000,           // 30 min — keep in garbage collection
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
