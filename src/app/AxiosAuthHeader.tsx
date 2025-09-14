// app/AxiosAuthHeader.tsx 
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setAuthToken } from "@/lib/axios";

export default function AxiosAuthHeader() {
  const { data: session } = useSession();      // Session | null (đã được augment)
  const token = session?.accessToken;          // string | undefined

  useEffect(() => {
    setAuthToken(token);
  }, [token]);                                  //  deps đúng, không cảnh báo

  return null;
}
