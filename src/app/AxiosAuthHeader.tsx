// app/AxiosAuth.tsx
"use client";
import { useEffect, useRef } from "react";
import { useSession, getSession, signOut } from "next-auth/react";
import api, { setAccessToken } from "@/lib/axios";

export default function AxiosAuth() {
  const { data, status } = useSession();

  // initialValue
  const reqId = useRef<number | null>(null);
  const resId = useRef<number | null>(null);

  useEffect(() => {
    setAccessToken((data as any)?.accessToken);
  }, [status, (data as any)?.accessToken]);

  useEffect(() => {
    reqId.current = api.interceptors.request.use((c) => c);
    resId.current = api.interceptors.response.use(
      (r) => r,
      async (err) => {
        const original = err.config as any;
        if (err?.response?.status !== 401 || original?._retry) throw err;
        original._retry = true;
        await getSession(); // NextAuth sẽ refresh trên server nếu cần
        return api(original).catch(async (e) => {
          await signOut({ callbackUrl: "/auth/login" });
          throw e;
        });
      }
    );

    return () => {
      if (reqId.current !== null) api.interceptors.request.eject(reqId.current);
      if (resId.current !== null) api.interceptors.response.eject(resId.current);
    };
  }, []);

  return null;
}
