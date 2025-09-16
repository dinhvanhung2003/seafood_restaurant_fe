// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;

// Backend trả { code, message, data: { accessToken, refreshToken? }, success }
const loginResponseSchema = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
  success: z.boolean().optional(),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional().nullable(),
  }),
});

function decodeJwt<T = any>(token: string): T | null {
  try {
    const base64 = token.split(".")[1];
    const json = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { label: "Email" }, password: { label: "Password" } },
      async authorize(credentials) {
        try {
          console.log("[authorize] credentials:", credentials);

          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });

          console.log("[authorize] status:", res.status);

          if (!res.ok) {
            const t = await res.text().catch(() => "");
            console.error("[authorize] API not ok:", t);
            return null;
          }

          const json = await res.json();
          console.log("[authorize] API json:", json);

          const parsed = loginResponseSchema.safeParse(json);
          if (!parsed.success) {
            console.error("[authorize] schema error:", parsed.error.flatten());
            return null;
          }

          const { accessToken, refreshToken } = parsed.data.data;

          // Lấy user info từ accessToken (payload chứa sub/email/role theo log của bạn)
          const payload = decodeJwt<{ sub?: string; email?: string; role?: string }>(accessToken);
          if (!payload?.sub || !payload?.email) {
            console.error("[authorize] token payload missing sub/email");
            return null;
          }

          // Trả object user để đưa vào JWT callback
          return {
            id: String(payload.sub),
            name: payload.email,          // Nếu muốn có fullName bạn có thể gọi /me bằng accessToken
            email: payload.email,
            role: payload.role,
            accessToken,
            refreshToken: refreshToken ?? undefined,
          } as any;
        } catch (err) {
          console.error("[authorize] exception:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).role = (token as any).role;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
  },

  pages: { signIn: "/signin" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
