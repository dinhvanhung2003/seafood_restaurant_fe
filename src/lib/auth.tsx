import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL =
  process.env.AUTH_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

function decodeJwt<T = any>(token?: string): T | null {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
      // quan trọng: route Next.js mặc định là node runtime
      cache: "no-store",
    });
    if (!res.ok) throw new Error("refresh failed");
    const json = await res.json();
    const accessToken = json?.data?.accessToken;
    const refreshToken = json?.data?.refreshToken ?? token.refreshToken;
    const payload = decodeJwt(accessToken);
    const expMs = payload?.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000;

    return {
      ...token,
      accessToken,
      refreshToken,
      accessTokenExpires: expMs,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const res = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || "Sai thông tin đăng nhập");
        }

        const json = await res.json();
        const accessToken = json?.data?.accessToken;
        const refreshToken = json?.data?.refreshToken;
        if (!accessToken) return null;

        const payload = decodeJwt(accessToken);
        const role = payload?.role as string | undefined;
        const expMs = payload?.exp ? payload.exp * 1000 : Date.now() + 55 * 60 * 1000;

        return {
          id: json?.data?.userId || credentials.email,
          name: json?.data?.name || credentials.email,
          email: credentials.email,
          role,
          accessToken,
          refreshToken,
          accessTokenExpires: expMs,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      // Khi đăng nhập
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.accessTokenExpires = (user as any).accessTokenExpires;
        return token;
      }
      // Còn hạn
      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      // Hết hạn -> refresh
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session.user as any).role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
