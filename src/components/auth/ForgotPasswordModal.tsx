"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/hooks/useAuth";
import { Loader2, ArrowRight } from "lucide-react";

export default function ForgotPasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter(); // Hook điều hướng
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mut = useForgotPassword();

  const handleSend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      await mut.mutateAsync({ email });
      setSent(true);
    } catch (e) {}
  };

  // Hàm chuyển sang trang Reset
  const handleGoToReset = () => {
    onOpenChange(false); // Đóng modal
    // Chuyển sang trang reset, có thể truyền email qua query param để user đỡ phải nhập lại
    router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <DialogHeader className="p-6">
          <DialogTitle>Quên mật khẩu</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {!sent ? (
            <>
              <div className="space-y-2">
                <Label>Email đã đăng ký</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="text-sm text-slate-500">
                Nhập email bạn đã đăng ký để nhận mã OTP (hết hạn trong 5 phút).
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-800 rounded-md text-sm border border-green-200">
                ✅ Mã OTP đã được gửi tới <strong>{email}</strong>.<br />
                Vui lòng kiểm tra hộp thư (kể cả mục Spam).
              </div>
              <div className="text-sm text-slate-600">
                Sau khi có mã, hãy bấm nút bên dưới để tiến hành đặt lại mật
                khẩu mới.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-slate-50">
          <div className="flex gap-3 ml-auto">
            {!sent ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-10"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={(mut as any).isPending || !email}
                  className="h-10 bg-primary hover:bg-primary/90"
                >
                  {(mut as any).isPending ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : null}
                  Gửi mã OTP
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-10"
                >
                  Đóng
                </Button>
                {/* 👇 NÚT QUAN TRỌNG ĐỂ CHUYỂN TRANG 👇 */}
                <Button
                  onClick={handleGoToReset}
                  className="h-10 bg-green-600 hover:bg-green-700 text-white"
                >
                  Nhập mã OTP ngay <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
