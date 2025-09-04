// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Cho phép nhiều role/1 prefix
const ROLE_GUARDS: Record<string, string[]> = {
  "/admin":   ["MANAGER"],
  "/cashier": ["CASHIER"],
  "/waiter":  ["WAITER"],
  "/kitchen": ["KITCHEN"],
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    // Đang có token nhưng không đủ quyền -> chặn
    for (const [prefix, allowed] of Object.entries(ROLE_GUARDS)) {
      if (pathname.startsWith(prefix)) {
        if (allowed.length && (!role || !allowed.includes(role))) {
          const url = req.nextUrl.clone();
          url.pathname = "/";                            // hoặc trang 403 riêng
          url.search = `?forbidden=${encodeURIComponent(prefix)}`;
          return NextResponse.redirect(url);
        }
      }
    }
    return NextResponse.next();
  },
  {
    // Nếu KHÔNG có token -> withAuth tự redirect sang /auth/login
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/auth/login" },
  }
);

// Áp dụng cho các vùng cần đăng nhập
export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/waiter/:path*", "/kitchen/:path*"],
};
