// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API = process.env.AUTH_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL!;

const decodeJwt = <T=any>(t?: string): T | null => {
  try { if (!t) return null; return JSON.parse(Buffer.from(t.split(".")[1], "base64").toString("utf8")); }
  catch { return null; }
};

async function refresh(token: any) {
  const r = await fetch(`${API}/auth/refresh`, {
    method: "POST", headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ refreshToken: token.refreshToken }), cache: "no-store",
  });
  if (!r.ok) throw new Error("refresh failed");
  const j = await r.json();
  const accessToken = j?.data?.accessToken as string;
  const refreshToken = j?.data?.refreshToken ?? token.refreshToken;
  const exp = decodeJwt<{exp:number}>(accessToken)?.exp;
  return { ...token, accessToken, refreshToken, accessTokenExpires: (exp? exp*1000 : Date.now()+55*60_000) };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/auth/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: {}, password: { type: "password" } },
      async authorize(c) {
        if (!c?.email || !c.password) return null;
        const r = await fetch(`${API}/auth/login`, {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ email: c.email, password: c.password }),
        });
        if (!r.ok) return null;
        const j = await r.json();
        const accessToken = j?.data?.accessToken as string;
        const refreshToken = j?.data?.refreshToken as string|undefined;
        if (!accessToken) return null;
        const p = decodeJwt<{ sub:string; email:string; role?:string; exp:number }>(accessToken)!;
        return {
          id: p.sub, name: p.email, email: p.email, role: p.role,
          accessToken, refreshToken, accessTokenExpires: p.exp*1000,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires = (user as any).accessTokenExpires;
        return token;
      }
      if (token.accessToken && token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token; // còn hạn
      }
      try { return await refresh(token); }         // hết hạn -> refresh server-side
      catch { return { ...token, accessToken: undefined }; }
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;          // chỉ đưa access xuống client
      (session as any).accessTokenExpires = token.accessTokenExpires;
      (session.user as any).id = (token as any).userId;
      (session.user as any).role = (token as any).role;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
