"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePromotionDetailQuery } from "@/hooks/admin/usePromotion";
import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu chưa có thì dùng div thường
import { Badge } from "@/components/ui/badge"; // Nếu dùng shadcn/ui
import {
  CalendarClock,
  Tag,
  Info,
  AlertCircle,
  ShoppingBag,
} from "lucide-react"; // Icon cho sinh động

const weekdayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

type Props = { id?: string; open: boolean; onOpenChange: (v: boolean) => void };

// --- Helper Functions giữ nguyên ---
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
  return String(value);
}
function fmtRange(startAt?: string | null, endAt?: string | null) {
  if (!startAt) return "—";
  const s = new Date(startAt).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
  const e = endAt
    ? new Date(endAt).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Không giới hạn";
  return `${s} — ${e}`;
}

// --- Component con để hiển thị từng dòng thông tin ---
const InfoRow = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
      {label}
    </span>
    <span className="text-sm font-medium text-slate-900">{value}</span>
  </div>
);

export default function PromotionDetailDialog({
  id,
  open,
  onOpenChange,
}: Props) {
  const q = usePromotionDetailQuery(id);
  const p = q.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50/50">
          <div className="flex items-center justify-between mr-6">
            <DialogTitle className="text-lg">Chi tiết khuyến mãi</DialogTitle>
            {p && (
              <Badge
                variant={p.isActive ? "default" : "secondary"}
                className={
                  p.isActive
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                }
              >
                {p.isActive ? "Đang chạy" : "Tạm dừng"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          {q.isLoading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : q.error ? (
            <div className="py-12 text-center text-red-500 text-sm">
              {q.error.message}
            </div>
          ) : !p ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Không tìm thấy dữ liệu
            </div>
          ) : (
            <div className="px-6 py-6 space-y-8">
              {/* SECTION 1: HEADER & GIÁ TRỊ KHUYẾN MÃI */}
              <div className="flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {p.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Mã:</span>
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded border font-mono text-slate-700 font-semibold">
                      {p.promotionCode || "Không có mã"}
                    </code>
                  </div>
                  {p.description && (
                    <p className="text-sm text-slate-600 mt-2 italic">
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Box nổi bật giá trị giảm */}
                <div className="flex-shrink-0 bg-blue-50 border border-blue-100 rounded-xl p-4 min-w-[140px] text-center">
                  <div className="text-xs text-blue-600 font-semibold uppercase mb-1">
                    Giá trị giảm
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {fmtValue(p.discountTypePromotion, p.discountValue)}
                  </div>
                  {p.maxDiscountAmount && (
                    <div className="text-[10px] text-blue-500 mt-1 font-medium">
                      Tối đa: {fmtMoney(p.maxDiscountAmount)}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* SECTION 2: ĐIỀU KIỆN ÁP DỤNG (Grid layout thoáng hơn) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <InfoRow
                  label="Áp dụng cho"
                  value={
                    p.applyWith === "ORDER"
                      ? "Tổng hóa đơn"
                      : p.applyWith === "CATEGORY"
                      ? "Theo Danh mục"
                      : "Theo Mặt hàng"
                  }
                />
                <InfoRow
                  label="Đơn tối thiểu"
                  value={fmtMoney(p.minOrderAmount)}
                />
                <InfoRow
                  label="Cộng dồn"
                  value={p.stackable ? "Được phép" : "Không áp dụng"}
                />

                <div className="col-span-2 sm:col-span-3 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" /> Thời gian hiệu lực
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {fmtRange(p.startAt, p.endAt)}
                  </span>
                </div>
              </div>

              {/* SECTION 3: ĐỐI TƯỢNG (Audience) */}
              {p.audienceRules && (
                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2 border border-slate-100">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">
                        Khung giờ vàng:{" "}
                      </span>
                      {p.audienceRules.scope === "ALL"
                        ? "Áp dụng mọi khách hàng"
                        : p.audienceRules.scope}

                      {(p.audienceRules.startTime ||
                        p.audienceRules.endTime) && (
                        <div className="text-slate-600 mt-1">
                          ⏰ Từ <b>{p.audienceRules.startTime || "..."}</b> đến{" "}
                          <b>{p.audienceRules.endTime || "..."}</b>
                        </div>
                      )}

                      {p.audienceRules.daysOfWeek?.length ? (
                        <div className="text-slate-600 mt-1 flex flex-wrap gap-1">
                          🗓 Các thứ:
                          {p.audienceRules.daysOfWeek.map((i: number) => (
                            <span
                              key={i}
                              className="inline-block bg-white border px-1.5 rounded text-xs font-medium"
                            >
                              {weekdayLabels[i] ?? i}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: PHẠM VI (Category / Items) */}
              {p.categories?.length || p.items?.length ? (
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-500" />
                    Phạm vi áp dụng
                  </h3>

                  {/* List Categories */}
                  {p.categories && p.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {p.categories.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 border border-orange-100"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* List Items */}
                  {p.items && p.items.length > 0 && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center gap-2 text-sm text-slate-700 bg-white border rounded px-3 py-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="truncate">{it.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {/* META INFO */}
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-4 border-t border-dashed">
                <div>
                  Tạo:{" "}
                  {p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("vi-VN")
                    : "—"}
                </div>
                <div>
                  Cập nhật:{" "}
                  {p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString("vi-VN")
                    : "—"}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-white flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng lại
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
