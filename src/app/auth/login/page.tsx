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

//  thêm: axios instance + token helpers
import { api } from "@/lib/axios"; // tạo theo hướng dẫn: lib/axios.ts
import { setTokens } from "@/lib/token"; // tạo theo hướng dẫn: lib/token.ts
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") || "");
    const password = String(form.get("password") || "");

    try {
      const { data } = await api.post("/auth/login", { username, password });
      // server nên trả { accessToken, refreshToken, ... }
      setTokens(data?.accessToken || data?.access_token, data?.refreshToken || data?.refresh_token);
      // tuỳ chọn: lưu remember vào localStorage
      if (remember) localStorage.setItem("remember", "1"); else localStorage.removeItem("remember");
      router.push("/"); // hoặc "/dashboard"
    } catch (err: any) {
      setError(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background bàn hải sản */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2400&auto=format&fit=crop')",
        }}
      />
      <div className="absolute inset-0 bg-black/55" />

      {/* Card đăng nhập */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-2xl border-none shadow-2xl backdrop-blur-sm">
            <CardContent className="p-7 sm:p-8">
              {/* Logo */}
              <div className="mb-6 flex items-center justify-center">
                <LogoKiotViet className="h-9 w-auto" />
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">
                    Tên đăng nhập
                  </Label>
                  <Input id="username" name="username" placeholder="Tên đăng nhập" className="h-11 text-base" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mật khẩu"
                      className="h-11 pr-10 text-base"
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
                </div>

                {/* Remember + Forgot */}
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

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                {/* Nút hành động */}
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Button type="submit" disabled={loading} className="h-12 rounded-xl text-base font-semibold">
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl text-base font-semibold"
                    onClick={() => (window.location.href = "/register")}
                  >
                    Đăng ký
                  </Button>
                </div>
              </form>

              <Separator className="my-6" />

              {/* Footer hỗ trợ + ngôn ngữ */}
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>
                    Hỗ trợ: <a className="font-medium text-foreground hover:underline" href="tel:0369566285">0369566285</a>
                  </span>
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

      {/* Credit mờ ở đáy (có thể bỏ) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-0 flex justify-center text-xs text-white/50">
        <span>© {new Date().getFullYear()} Demo UI – Không liên quan tới KiotViet</span>
      </div>
    </div>
  );
}

// Logo
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
