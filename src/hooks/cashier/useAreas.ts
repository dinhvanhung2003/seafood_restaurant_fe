"use client";

import { useQuery } from "@tanstack/react-query";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchAreas(token?: string) {
  const res = await fetch(`${API_BASE}/area/get-list-area`, {
    headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Array<{ id:string; name:string; tables:{id:string; name:string; seats:number}[] }>>;
}

export function useAreas(token?: string) {
  return useQuery({
    queryKey: ["areas", token],
    queryFn: () => fetchAreas(token),
    enabled: !!token,
    staleTime: 60_000,
  });
}
