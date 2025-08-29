// lib/token.ts
import { getCookie, setCookie, deleteCookie } from "cookies-next";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export function getAccessToken(): string | undefined {
  return (getCookie(ACCESS_KEY) as string) || undefined;
}

export function getRefreshToken(): string | undefined {
  return (getCookie(REFRESH_KEY) as string) || undefined;
}

export function setTokens(accessToken: string, refreshToken?: string) {
  // thời hạn: 7 ngày cho refresh, 1 giờ cho access (tùy server)
  if (accessToken) {
    setCookie(ACCESS_KEY, accessToken, {
      maxAge: 60 * 60, // 1h
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  if (refreshToken) {
    setCookie(REFRESH_KEY, refreshToken, {
      maxAge: 60 * 60 * 24 * 7, // 7d
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
}

export function clearTokens() {
  deleteCookie(ACCESS_KEY, { path: "/" });
  deleteCookie(REFRESH_KEY, { path: "/" });
}
