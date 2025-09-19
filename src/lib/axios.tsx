// lib/axios.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

/** ========= Instance ========= */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false,
});

/** ========= In-memory tokens ========= */
let ACCESS_TOKEN: string | null = null;
let REFRESH_TOKEN: string | null = null;

export function setAuthToken(token?: string | null) {
  ACCESS_TOKEN = token ?? null;
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export function setRefreshToken(token?: string | null) {
  REFRESH_TOKEN = token ?? null;
}

export function setAuthTokens({
  accessToken,
  refreshToken,
}: { accessToken?: string | null; refreshToken?: string | null }) {
  setAuthToken(accessToken ?? null);
  setRefreshToken(refreshToken ?? null);
}

export function clearAuthTokens() {
  setAuthTokens({ accessToken: null, refreshToken: null });
}

/** ========= Refresh flow (queue để chống đua) ========= */
let isRefreshing = false;
let subscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  subscribers.push(cb);
}
function onRefreshed(token: string | null) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

async function requestRefresh(): Promise<string | null> {
  if (!REFRESH_TOKEN) return null;

  // dùng 1 client thô để tránh interceptor lặp vô hạn
  const raw = axios.create({ baseURL: api.defaults.baseURL });
  const res = await raw.post("/auth/refresh", { refreshToken: REFRESH_TOKEN }, {
    headers: { "Content-Type": "application/json" },
  });

  const newAccess = res.data?.data?.accessToken as string | undefined;
  const newRefresh = (res.data?.data?.refreshToken as string | undefined) ?? REFRESH_TOKEN;

  if (newAccess) {
    setAuthTokens({ accessToken: newAccess, refreshToken: newRefresh });
    return newAccess;
  }
  return null;
}

/** ========= Typing cho _retry (nên đặt vào types/axios.d.ts) ========= */
// declare module "axios" {
//   interface AxiosRequestConfig {
//     _retry?: boolean;
//   }
// }

/** ========= Response interceptor: auto refresh on 401 ========= */
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });

    // Không can thiệp các route auth/refresh hoặc đã thử lại rồi
    const url = (original?.url || "").toString();
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/refresh");

    if (status !== 401 || !original || isAuthRoute) {
      return Promise.reject(error);
    }

    if (original._retry) {
      return Promise.reject(error);
    }

    // Đặt cờ để các request 401 khác chờ
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) return reject(error);
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newToken = await requestRefresh();
      onRefreshed(newToken);
      isRefreshing = false;

      if (!newToken) {
        clearAuthTokens();
        return Promise.reject(error);
      }

      // gắn token mới và gọi lại request cũ
      original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newToken}` };
      return api(original);
    } catch (e) {
      isRefreshing = false;
      onRefreshed(null);
      clearAuthTokens();
      return Promise.reject(error);
    }
  }
);
export default api;
