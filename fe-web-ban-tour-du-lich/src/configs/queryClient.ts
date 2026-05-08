import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                      // Số lần retry khi lỗi
      staleTime: 5 * 60 * 1000,      // 5 phút → không request lại nếu cache còn fresh
      refetchOnWindowFocus: false,   // Không refetch khi focus vào tab
      refetchOnReconnect: true,      // Refetch khi có mạng lại
      refetchOnMount: false,         // Không tự refetch khi mount nếu staleTime chưa hết
      gcTime: 10 * 60 * 1000,        // Garbage collect cache sau 10 phút
    },
    mutations: {
      retry: 1,                  // số lần retry mutation
    }
  },
});
