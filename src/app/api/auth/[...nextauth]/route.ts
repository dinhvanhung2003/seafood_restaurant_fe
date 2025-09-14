// src/pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE = process.env.API_BASE || process.env.NEXT_PUBLIC_API_BASE;

export default NextAuth({
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
          if (!res.ok) return null;             // => NextAuth trả 401
          const data = await res.json();        // { user, accessToken, ... }
          if (!data?.user) return null;
          return { id: data.user.id, name: data.user.fullName, email: data.user.email, token: data.accessToken };
        } catch (e) {
          console.error("authorize error", e);
          return null;                          // cũng dẫn tới 401
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // trustHost: true, // nếu deploy trên Vercel monorepo/subdomain
});
