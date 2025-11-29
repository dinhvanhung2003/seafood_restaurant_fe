"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion"; // Hiệu ứng xuất hiện giống Login
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"; // Icon
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useResetPassword } from "@/hooks/useAuth";

// Component con để bọc trong Suspense
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // State để hiện/ẩn mật khẩu
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const mut = useResetPassword();

  // Tự động điền email từ URL
  useEffect(() => {
    const emailParam = searchParams?.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const validate = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Email không hợp lệ";
    if (!/^[0-9]{6}$/.test(otp)) return "Mã OTP phải gồm 6 chữ số";
    if (newPassword.length < 6) return "Mật khẩu mới phải ít nhất 6 ký tự";
    if (newPassword !== confirmNewPassword)
      return "Mật khẩu xác nhận không khớp";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      await mut.mutateAsync({ email, otp, newPassword, confirmNewPassword });
      // Thành công thì toast đã hiện ở hook, giờ chuyển trang
      // Chờ xíu cho người dùng đọc thông báo
      setTimeout(() => {
        router.push("/auth/login");
      }, 1000);
    } catch (e) {
      // Lỗi đã xử lý ở hook
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Input Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 bg-white/50"
          placeholder="email@example.com"
        />
      </div>

      {/* Input OTP */}
      <div className="space-y-2">
        <Label htmlFor="otp" className="text-sm font-medium">
          Mã OTP (6 số)
        </Label>
        <Input
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
          maxLength={6}
          className="h-11 bg-white/50 tracking-widest font-bold text-center text-lg"
          placeholder="------"
        />
      </div>

      {/* Input Mật khẩu mới */}
      <div className="space-y-2">
        <Label htmlFor="newPass" className="text-sm font-medium">
          Mật khẩu mới
        </Label>
        <div className="relative">
          <Input
            id="newPass"
            type={showPass ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-11 bg-white/50 pr-10"
            placeholder="Nhập mật khẩu mới"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute inset-y-0 right-2 grid w-9 place-items-center text-slate-500 hover:text-slate-800"
          >
            {showPass ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Input Xác nhận mật khẩu */}
      <div className="space-y-2">
        <Label htmlFor="confirmPass" className="text-sm font-medium">
          Xác nhận mật khẩu
        </Label>
        <div className="relative">
          <Input
            id="confirmPass"
            type={showConfirmPass ? "text" : "password"}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="h-11 bg-white/50 pr-10"
            placeholder="Nhập lại mật khẩu"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute inset-y-0 right-2 grid w-9 place-items-center text-slate-500 hover:text-slate-800"
          >
            {showConfirmPass ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-2 grid gap-3">
        <Button
          type="submit"
          disabled={(mut as any).isPending}
          className="h-12 w-full text-base font-semibold bg-slate-900 hover:bg-slate-800"
        >
          {(mut as any).isPending && (
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
          )}
          Xác nhận đổi mật khẩu
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/auth/login")}
          className="h-10 w-full text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
        </Button>
      </div>
    </form>
  );
}

// Logo Component (Tái sử dụng từ trang Login)
function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-10 w-10">
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#21c1b7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          d="M18 12c10 0 18 8 18 18S28 48 18 48 0 40 0 30 8 12 18 12z"
          fill="url(#g1)"
        />
        <path
          d="M46 16c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z"
          fill="#34d399"
          opacity="0.9"
        />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-slate-800">
        SeaFood
      </span>
    </div>
  );
}

// Trang chính
export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden font-sans">
      {/* 1. Background giống hệt trang Login */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/bg.webp" // Đảm bảo file này có trong folder public
          alt="Seafood background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" /> {/* Overlay tối */}
      </div>

      {/* 2. Container căn giữa */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <Card className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-md">
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-8 flex flex-col items-center justify-center space-y-2 text-center">
                <Logo />
                <h1 className="text-xl font-semibold text-slate-700">
                  Khôi phục tài khoản
                </h1>
                <p className="text-sm text-slate-500">
                  Nhập mã OTP đã nhận và mật khẩu mới
                </p>
              </div>

              {/* Form */}
              <Suspense
                fallback={
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin" />
                  </div>
                }
              >
                <ResetPasswordForm />
              </Suspense>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer bản quyền */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-0 flex justify-center text-xs text-white/40">
        <span>
          © {new Date().getFullYear()} Demo UI – Quản lý nhà hàng hải sản
        </span>
      </div>
    </div>
  );
}
