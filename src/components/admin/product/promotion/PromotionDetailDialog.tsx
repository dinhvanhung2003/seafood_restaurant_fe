"use client";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePromotionDetailQuery } from "@/hooks/admin/usePromotion";

const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

type Props = { id?: string; open: boolean; onOpenChange: (v: boolean) => void };

function fmtMoney(n?: string | number | null) {
  if (n == null) return "—";
  const v = Number(n);
  if (Number.isNaN(v)) return String(n);
  return v.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}
function fmtValue(type?: string | null, value?: string | number | null) {
  if (!type || value == null) return "—";
  const t = String(type).toUpperCase();
  const v = Number(value);
  if (t.includes("PERCENT")) return `${Number.isFinite(v) ? v : value}%`;
  if (t.includes("AMOUNT")) return fmtMoney(v);
  if (t.includes("FIXED")) return `Đồng giá ${fmtMoney(v)}`;
  return String(value);
}
function fmtRange(startAt?: string | null, endAt?: string | null) {
  if (!startAt) return "—";
  const s = new Date(startAt).toLocaleString("vi-VN");
  const e = endAt ? new Date(endAt).toLocaleString("vi-VN") : "Không giới hạn";
  return `${s} — ${e}`;
}

export default function PromotionDetailDialog({
  id,
  open,
  onOpenChange,
}: Props) {
  const q = usePromotionDetailQuery(id);
  const p = q.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chi tiết khuyến mãi</DialogTitle>
        </DialogHeader>

        {q.isLoading ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : q.error ? (
          <div className="py-6 text-center text-red-500">{q.error.message}</div>
        ) : !p ? (
          <div className="py-6 text-center text-slate-500">
            Không tìm thấy dữ liệu
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tiêu đề + mô tả */}
            <div className="rounded-xl border p-4">
              <div className="text-lg font-semibold">{p.name}</div>
              {p.description ? (
                <div className="mt-1 text-sm text-slate-600">
                  {p.description}
                </div>
              ) : null}
            </div>

            {/* Thông số chính */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Loại</div>
                <div className="mt-0.5 font-medium">
                  {p.discountTypePromotion}
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Giá trị</div>
                <div className="mt-0.5 font-medium">
                  {fmtValue(p.discountTypePromotion, p.discountValue)}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Giảm tối đa</div>
                <div className="mt-0.5 font-medium">
                  {fmtMoney(p.maxDiscountAmount)}
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">
                  Giá trị HĐ tối thiểu
                </div>
                <div className="mt-0.5 font-medium">
                  {fmtMoney(p.minOrderAmount)}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Mã khuyến mãi</div>
                <div className="mt-0.5 font-medium">
                  {p.promotionCode || "—"}
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Trạng thái</div>
                <div className="mt-0.5 font-medium">
                  {p.isActive ? "Kích hoạt" : "Tắt"}
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Cho phép cộng dồn</div>
                <div className="mt-0.5 font-medium">
                  {p.stackable ? "Có" : "Không"}
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="text-xs text-slate-500">Áp dụng với</div>
                <div className="mt-0.5 font-medium">
                  {p.applyWith === "ORDER"
                    ? "Hóa đơn"
                    : p.applyWith === "CATEGORY"
                    ? "Danh mục"
                    : "Mặt hàng"}
                </div>
              </div>
            </div>

            {/* Thời gian */}
            <div className="rounded-xl border p-4">
              <div className="text-xs text-slate-500">Thời gian</div>
              <div className="mt-0.5 font-medium">
                {fmtRange(p.startAt, p.endAt)}
              </div>
            </div>

            {/* Audience rules */}
            {p.audienceRules && (
              <div className="rounded-xl border p-4 space-y-1">
                <div className="text-xs text-slate-500">Đối tượng</div>
                <div className="font-medium">
                  {p.audienceRules.scope ?? "ALL"}
                </div>
                {(p.audienceRules.daysOfWeek?.length ||
                  p.audienceRules.startTime ||
                  p.audienceRules.endTime) && (
                  <div className="text-sm text-slate-700">
                    {p.audienceRules.daysOfWeek?.length ? (
                      <div>
                        Theo thứ:{" "}
                        {p.audienceRules.daysOfWeek
                          .map((i: number) => weekdayLabels[i] ?? i)
                          .join(", ")}
                      </div>
                    ) : null}
                    {p.audienceRules.startTime || p.audienceRules.endTime ? (
                      <div>
                        Khung giờ: {p.audienceRules.startTime || "—"} -{" "}
                        {p.audienceRules.endTime || "—"}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Danh mục áp dụng (nếu có) */}
            {(p.categories?.length ?? 0) > 0 && (
              <div className="rounded-xl border p-4">
                <div className="mb-2 text-sm font-medium">
                  Danh mục áp dụng{" "}
                  <span className="text-slate-500">
                    ({p.categories!.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.categories!.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mặt hàng áp dụng */}
            {(p.items?.length ?? 0) > 0 && (
              <div className="rounded-xl border p-4">
                <div className="mb-3 text-sm font-medium">
                  Mặt hàng áp dụng{" "}
                  <span className="text-slate-500">({p.items!.length})</span>
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {p.items!.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center gap-3 rounded-lg border p-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{it.name}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meta */}
            <div className="rounded-xl border p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="text-xs text-slate-500">Tạo lúc</div>
              <div className="text-xs">
                {p.createdAt
                  ? new Date(p.createdAt).toLocaleString("vi-VN")
                  : "—"}
              </div>
              <div className="text-xs text-slate-500">Cập nhật</div>
              <div className="text-xs">
                {p.updatedAt
                  ? new Date(p.updatedAt).toLocaleString("vi-VN")
                  : "—"}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
