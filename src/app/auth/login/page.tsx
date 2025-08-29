"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { api } from "@/lib/axios";
import { setTokens } from "@/lib/token";
import { useRouter, useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Image from 'next/image';
//  Sonner toast
import { toast } from "sonner";

export enum UserRole {
  MANAGER = "MANAGER",
  CASHIER = "CASHIER",
  WAITER = "WAITER",
  KITCHEN = "KITCHEN",
}
type JWTPayload = { role?: string; exp?: number; sub?: string | number };

const routeByRole: Record<string, string> = {
  [UserRole.MANAGER]: "/admin",
  [UserRole.CASHIER]: "/cashier",
  [UserRole.WAITER]: "/waiter",
  [UserRole.KITCHEN]: "/kitchen",
};

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    // validate client
    const errors: typeof fieldErr = {};
    if (!email) errors.email = "Vui lòng nhập email";
    else if (!isEmail(email)) errors.email = "Email không hợp lệ";
    if (!password) errors.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6) errors.password = "Mật khẩu tối thiểu 6 ký tự";

    if (errors.email || errors.password) {
      setFieldErr(errors);
      toast.error("Thông tin chưa hợp lệ", {
        description: errors.email ?? errors.password,
        className: "text-white bg-red-500",
      });
      return;
    }
    setFieldErr({});
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const access = res.data?.data?.accessToken;
      const refresh = res.data?.data?.refreshToken;
      if (!access) throw new Error("Không nhận được accessToken");

      setTokens(access, refresh);

      let role: string | undefined;
      try {
        const decoded = jwtDecode<JWTPayload>(access);
        role = decoded?.role;
      } catch {}

      const params = searchParams ?? new URLSearchParams();
const back = params.get("redirect");

      const target = back || (role ? routeByRole[role] || "/" : "/");

      toast.success(res.data?.message || "Đăng nhập thành công", {
        description: role ? `Xin chào ${email} — vai trò: ${role}` : `Xin chào ${email}`,
        className: "text-white bg-green-500",
      });

      if (remember) localStorage.setItem("remember", "1");
      else localStorage.removeItem("remember");

      router.push(target);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || "Đăng nhập thất bại";
      toast.error("Đăng nhập thất bại", {
        description: serverMsg,
        className: "text-white bg-red-500",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background bàn hải sản */}
     <div className="absolute inset-0 -z-10">
  <Image
    src="/bg.webp"     // file đặt trong /public/bg.png
    alt="Seafood background"
    fill             // tương đương width:100%, height:100%, position:absolute
    priority         // load sớm
    className="object-cover"
  />
  <div className="absolute inset-0 bg-black/55" /> {/* overlay tối */}
</div>

      {/* Card đăng nhập */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
          <Card className="rounded-2xl border-none shadow-2xl backdrop-blur-sm">
            <CardContent className="p-7 sm:p-8">
              <div className="mb-6 flex items-center justify-center">
                <LogoKiotViet className="h-9 w-auto" />
              </div>

              <form className="space-y-5" onSubmit={handleLogin} noValidate>
                <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-white">Email</Label>
    <Input
      id="email"
      name="email"
      type="email"
      placeholder="admin@restaurant.com"
      className={`h-11 text-base text-white placeholder-gray-300 ${
        fieldErr.email ? "border-red-500 focus-visible:ring-red-500" : ""
      }`}
      autoComplete="email"
      aria-invalid={!!fieldErr.email}
      required
    />
    {fieldErr.email && <p className="text-xs text-red-400">{fieldErr.email}</p>}
                </div>

                <div className="space-y-2">
                 <Label htmlFor="password" className="text-sm text-white">Mật khẩu</Label>
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        placeholder="Mật khẩu"
        className={`h-11 pr-10 text-base text-white placeholder-gray-300 ${
          fieldErr.password ? "border-red-500 focus-visible:ring-red-500" : ""
        }`}
        autoComplete="current-password"
        aria-invalid={!!fieldErr.password}
        required
      />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-2 grid w-9 place-items-center rounded-md hover:bg-muted/50"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 opacity-70" /> : <Eye className="h-5 w-5 opacity-70" />}
                    </button>
                  </div>
                  {fieldErr.password && <p className="text-xs text-red-500">{fieldErr.password}</p>}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 select-none">
                    <Checkbox
                      checked={remember}
                      onCheckedChange={(v) => setRemember(Boolean(v))}
                      className="rounded-[4px]"
                    />
                    <span className="text-muted-foreground">Duy trì đăng nhập</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">Quên mật khẩu?</a>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Button type="submit" disabled={loading} className="h-12 rounded-xl text-base font-semibold">
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl text-base font-semibold"
                    onClick={() => (window.location.href = "/auth/register")}
                  >
                    Đăng ký
                  </Button>
                </div>
              </form>

              <Separator className="my-6" />
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Hỗ trợ: <a className="font-medium text-foreground hover:underline" href="tel:0369566285">0369566285</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="i-flag-vn inline-block h-3.5 w-5 overflow-hidden rounded-sm">
                    <span className="block h-full w-full bg-red-600">
                      <span className="absolute ml-[6px] mt-[3px] block h-2 w-2 rotate-45 bg-yellow-400" />
                    </span>
                  </span>
                  <span>Tiếng Việt</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-0 flex justify-center text-xs text-white/50">
        <span>© {new Date().getFullYear()} Demo UI – Quản lý nhà hàng hải sản</span>
      </div>
    </div>
  );
}

function LogoKiotViet({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#21c1b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d="M18 12c10 0 18 8 18 18S28 48 18 48 0 40 0 30 8 12 18 12z" fill="url(#g1)" />
        <path d="M46 16c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z" fill="#34d399" opacity="0.9" />
      </svg>
      <span className="text-xl font-semibold tracking-tight">SeaFood</span>
    </div>
  );
}
