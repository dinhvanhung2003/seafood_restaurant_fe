// app/AxiosAuthHeader.tsx 
"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setAuthToken } from "@/lib/axios";

export default function AxiosAuthHeader() {
  const { data } = useSession();
  useEffect(() => {
    const token = (data as any)?.accessToken;
    setAuthToken(token);
  }, [data?.accessToken]);
  return null;
}
