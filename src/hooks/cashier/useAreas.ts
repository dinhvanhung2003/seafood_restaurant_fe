"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

type Area = {
  id: string;
  name: string;
  tables: { id: string; name: string; seats: number }[];
};

async function fetchAreas(): Promise<Area[]> {
  const { data } = await api.get("/area/get-list-area");
  return data as Area[]; // hoặc điều chỉnh theo shape BE trả về
}

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
    enabled: true,        // interceptor sẽ tự gắn Authorization nếu cần
    staleTime: 60_000,
  });
}
