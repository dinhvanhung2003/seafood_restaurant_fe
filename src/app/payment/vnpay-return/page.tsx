"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/axios";

export default function VnpayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // ReadonlyURLSearchParams | null (tuỳ version)

  useEffect(() => {
    if (!searchParams) return; // tránh lỗi null

    // (1) Lấy toàn bộ query string để gửi backend verify chữ ký
    const rawQuery = searchParams.toString();

    (async () => {
      try {
        // Gửi nguyên query để backend tự parse & verify vnp_SecureHash
        const res = await api.get("/payments/vnpay/return", {
          params: { rawQuery }, // hoặc body: { rawQuery } nếu backend dùng POST
        });

        // Backend nên trả { status: 'SUCCESS' | 'FAILED', message?: string }
        const status: string = res.data?.status ?? "FAILED";

        if (status === "SUCCESS") {
          toast.success("Thanh toán VNPay thành công!");
        } else {
          // fallback: nếu backend chưa làm, tạm đọc mã từ client (không khuyến nghị)
          const code =
            searchParams.get("vnp_ResponseCode") ??
            searchParams.get("RspCode") ??
            "";
          toast.error(
            code === "00" ? "Không xác thực được chữ ký" : "Thanh toán thất bại",
          );
        }
      } catch (e: any) {
        toast.error("Không xác thực được kết quả thanh toán", {
          description: e?.response?.data?.message || e?.message,
        });
      } finally {
        // quay về màn POS
        router.replace("/pos");
      }
    })();
  }, [searchParams, router]);

  return <div className="p-10">Đang xử lý kết quả thanh toán…</div>;
}
