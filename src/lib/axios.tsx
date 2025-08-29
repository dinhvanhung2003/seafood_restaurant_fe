// lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // ví dụ http://localhost:8000
  withCredentials: false, // dùng cookie ở client để tự gắn Authorization, không gửi cookie cross-site
});

// Gắn Authorization cho mọi request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Refresh Token Logic =====
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  queue.push(cb);
}
function onRefreshed(newToken: string) {
  queue.forEach((cb) => cb(newToken));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });

    // Không có response (mất mạng v.v.)
    if (!error.response) throw error;

    // Nếu 401 -> thử refresh
    if (error.response.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        // Đợi refresh hiện tại xong rồi retry
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        // Dùng 1 instance thô để gọi refresh, tránh lặp interceptors
        const raw = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
        const { data } = await raw.post("/auth/refresh", { refreshToken });

        // server nên trả về accessToken mới (và có thể refreshToken mới)
        const newAccess: string = (data?.accessToken as string) || data?.access_token;
        const newRefresh: string | undefined = data?.refreshToken || data?.refresh_token;

        setTokens(newAccess, newRefresh);
        onRefreshed(newAccess);
        isRefreshing = false;

        // Retry request cũ
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        clearTokens();
        // Optionally điều hướng về /login tại đây
        throw e;
      }
    }

    throw error;
  }
);
