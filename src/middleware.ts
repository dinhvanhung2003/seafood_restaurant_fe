// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { toast } from "sonner";
// ========= RATE LIMIT CONFIG =========
const RATE_LIMIT_WINDOW_MS = 60_000;      // 60s
const RATE_LIMIT_MAX_REQUESTS = 60;       // tối đa 60 req / window

type Bucket = { count: number; start: number };

// key = userId hoặc IP
const buckets = new Map<string, Bucket>();

function getClientKey(req: any): string {
  const token = req.nextauth?.token as any | undefined;
  const userId = token?.sub || token?.id; // tuỳ anh lưu id thế nào trong JWT
  if (userId) return `user:${userId}`;

  // fallback IP
  const ip =
    req.ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `ip:${ip}`;
}

function isRateLimited(req: any): boolean {
  const key = getClientKey(req);
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { count: 0, start: now };
    buckets.set(key, bucket);
  }

  // reset window nếu đã quá thời gian
  if (now - bucket.start > RATE_LIMIT_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

// ========= ROLE GUARD =========
const ROLE_GUARDS: Record<string, string[]> = {
  "/admin": ["MANAGER"],
  "/cashier": ["CASHIER"],
  "/waiter": ["WAITER"],
  "/kitchen": ["KITCHEN"],
};

export default withAuth(
  function middleware(req) {
    // --- RATE LIMIT CHECK ---
    if (isRateLimited(req)) {
      return NextResponse.json(
        { message: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // --- ROLE GUARD ---
    for (const [prefix, allowed] of Object.entries(ROLE_GUARDS)) {
      if (pathname.startsWith(prefix)) {
        if (allowed.length && (!role || !allowed.includes(role))) {
          const url = req.nextUrl.clone();
          url.pathname = "/";
          url.search = `?forbidden=${encodeURIComponent(prefix)}`;
          return NextResponse.redirect(url);
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/auth/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/waiter/:path*", "/kitchen/:path*"],
};
