import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Public routes
const PUBLIC = new Set<string>(["/auth/login", "/auth/register", "/api"]);

// Map prefix -> role được phép
const ROLE_GUARDS: Record<string, string> = {
  "/admin": "MANAGER",
  "/cashier": "CASHIER",
  "/waiter": "WAITER",
  "/kitchen": "KITCHEN",
};

// Decode nhanh phần payload của JWT ở Edge (không verify chữ ký)
function decodeJwtPayload(token: string): any | null {
  try {
    const base64 = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!base64) return null;
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Bỏ qua file tĩnh/_next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|svg|gif|ico|webp|avif|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Cho qua public
  if (PUBLIC.has(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Lấy token
  const token = req.cookies.get("accessToken")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = search
      ? `?redirect=${encodeURIComponent(pathname + search)}`
      : `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Kiểm tra exp + role
  const payload = decodeJwtPayload(token);
  if (!payload || (payload.exp && Date.now() / 1000 >= payload.exp)) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?redirect=${encodeURIComponent(pathname)}&reason=expired`;
    return NextResponse.redirect(url);
  }

  // Guard theo prefix
  for (const prefix in ROLE_GUARDS) {
    if (pathname.startsWith(prefix)) {
      const need = ROLE_GUARDS[prefix];
      if (payload.role !== need) {
        // Sai quyền -> về trang chủ hoặc trang 403 riêng
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.search = `?forbidden=${encodeURIComponent(prefix)}`;
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

// Áp dụng cho mọi route (trừ tĩnh/_next đã loại trong hàm)
export const config = {
  matcher: ["/:path*"],
};
