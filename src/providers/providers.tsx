"use client";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,          // dữ liệu “tươi” 1 phút
            gcTime: 5 * 60_000,         // giữ cache 5 phút
            refetchOnWindowFocus: false,
            retry: 2,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
