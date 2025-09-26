// lib/axios.ts
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

/** Instance */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

/** Access token (client only) */
let ACCESS_TOKEN: string | undefined;
export function setAccessToken(t?: string) {
  ACCESS_TOKEN = t;
}

/** Attach Authorization for every request */
api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  if (!ACCESS_TOKEN) return cfg;

  if (!cfg.headers) cfg.headers = {} as any;

  if (cfg.headers instanceof AxiosHeaders) {
    cfg.headers.set("Authorization", `Bearer ${ACCESS_TOKEN}`);
  } else {
    (cfg.headers as Record<string, any>)["Authorization"] = `Bearer ${ACCESS_TOKEN}`;
  }
  return cfg;
});

export default api; 
