// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials?.email,
              password: credentials?.password,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          if (!data?.user) return null;

          return {
            id: data.user.id,
            name: data.user.fullName,
            email: data.user.email,
            token: data.accessToken, // nếu cần dùng trong JWT
          };
        } catch {
          return null;
        }
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

// App Router cần export GET/POST
export { handler as GET, handler as POST };

// Khuyến nghị dùng Node runtime để tránh lỗi trên Edge
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
