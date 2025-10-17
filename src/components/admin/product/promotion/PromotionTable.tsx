"use client";

import Link from "next/link";
import type { Promotion } from "@/hooks/admin/usePromotion";

/* ===== Helpers ===== */
function fmtRange(startAt?: string | null, endAt?: string | null) {
  if (!startAt) return "—";
  const s = new Date(startAt).toLocaleDateString("vi-VN");
  const e = endAt
    ? new Date(endAt).toLocaleDateString("vi-VN")
    : "Không giới hạn";
  return `${s} - ${e}`;
}
function fmtValue(type: string, value: string) {
  const t = type.toUpperCase();
  if (t.includes("PERCENT")) return `${Number(value).toFixed(2)}%`;
  if (t.includes("AMOUNT")) return `${Number(value).toLocaleString("vi-VN")} đ`;
  if (t.includes("FIXED"))
    return `Đồng giá ${Number(value).toLocaleString("vi-VN")} đ`;
  return value;
}
function chipScope(s: string) {
  const label =
    s === "ORDER" ? "Hóa đơn" : s === "CATEGORY" ? "Danh mục" : "Mặt hàng";
  const color =
    s === "ORDER"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : s === "CATEGORY"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-sky-50 text-sky-700 ring-sky-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${color}`}
    >
      {label}
    </span>
  );
}

/* paginate like 1 … 3 4 [5] 6 7 … 10 */
function paginate(
  current: number,
  total: number,
  delta = 1
): Array<number | "..."> {
  const range: Array<number | "..."> = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  if (total > 1) range.push(total);
  return Array.from(new Set(range));
}

export default function PromotionTable({
  data,
  page,
  pages,
  total,
  isLoading,
  onPrev,
  onNext,
  onToggle,
  onGoto,
  onShowDetail,
  onDelete,
  onRestore,
}: {
  data?: Promotion[];
  page: number;
  pages: number;
  total: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggle: (id: string, v: boolean) => void;
  onGoto?: (n: number) => void;
  onShowDetail?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
}) {
  const canPrev = page > 1;
  const canNext = page < pages;
  const pageNums = paginate(page, Math.max(1, pages), 1);

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-sm text-slate-600">
          Tổng cộng <b>{total}</b> khuyến mãi
        </div>
        <Link
          href="/admin/product/promotion/new"
          className="rounded-lg bg-sky-600 px-3 py-2 text-white shadow-sm transition hover:bg-sky-700"
        >
          + Tạo khuyến mãi
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-left font-semibold">Tên</th>
              <th className="p-3 text-left font-semibold">Loại / Giá trị</th>
              <th className="p-3 text-left font-semibold">Áp dụng</th>
              <th className="p-3 text-left font-semibold">Thời gian</th>
              <th className="p-3 text-left font-semibold">Mã</th>
              <th className="p-3 text-left font-semibold">Trạng thái</th>
              <th className="p-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="[&>tr:hover]:bg-slate-50/60">
            {isLoading && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  Đang tải...
                </td>
              </tr>
            )}

            {!isLoading && (!data || data.length === 0) && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={7}>
                  Chưa có khuyến mãi.
                </td>
              </tr>
            )}

            {data?.map((p) => {
              const isDeleted = !!(p as any).isDeleted;
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3 font-medium text-slate-800">
                    <button
                      type="button"
                      onClick={() => onShowDetail?.(p.id)}
                      className="hover:underline underline-offset-2"
                      title="Xem chi tiết"
                    >
                      {p.name}
                    </button>
                    {isDeleted && (
                      <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200">
                        Đã xoá
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="inline-flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-700">
                        {p.discountTypePromotion}
                      </span>
                      <span className="text-slate-700">
                        {fmtValue(p.discountTypePromotion, p.discountValue)}
                      </span>
                    </div>
                  </td>

                  <td className="p-3">{chipScope(String(p.applyWith))}</td>
                  <td className="p-3 text-slate-700">
                    {fmtRange(p.startAt, p.endAt)}
                  </td>
                  <td className="p-3">{p.promotionCode ?? "—"}</td>

                  {/* ==== STATUS CELL (disable when deleted) ==== */}
                  <td className="p-3">
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 ${
                        isDeleted ? "opacity-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={!!p.isActive}
                        disabled={isDeleted} // 4.1: khoá khi đã xoá
                        onChange={(e) => onToggle(p.id, e.target.checked)}
                        aria-label="Bật/Tắt khuyến mãi"
                      />
                      <span className="relative inline-block h-5 w-9 rounded-full bg-slate-300 transition peer-checked:bg-sky-600">
                        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
                      </span>
                    </label>
                  </td>

                  {/* ==== ACTIONS CELL: Sửa / Xoá / Khôi phục ==== */}
                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onShowDetail?.(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300"
                        title="Xem chi tiết"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>Xem</span>
                      </button>

                      <Link
                        href={`/admin/product/promotion/new?id=${p.id}`}
                        className={`inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300 ${
                          isDeleted ? "pointer-events-none opacity-40" : ""
                        }`}
                        title={isDeleted ? "Đã xoá - không thể sửa" : "Sửa"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                        <span>Sửa</span>
                      </Link>

                      {!isDeleted ? (
                        <button
                          type="button"
                          onClick={() => onDelete?.(p.id)}
                          disabled={Boolean(p.isActive) || isDeleted}
                          className={`inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 ring-1 transition
      ${
        p.isActive
          ? "cursor-not-allowed opacity-40 text-slate-400 ring-slate-200"
          : "text-rose-700 ring-rose-200 hover:bg-rose-50 hover:ring-rose-300"
      }`}
                          title={
                            p.isActive
                              ? "Khuyến mãi đang bật — hãy tắt trước khi xoá"
                              : "Xoá (ẩn)"
                          }
                        >
                          Xoá
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onRestore?.(p.id)} // 4.2: Khôi phục
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50 hover:ring-emerald-300"
                          title="Khôi phục"
                        >
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Trang <b>{page}</b> / {pages || 1}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className={`rounded-md px-3 py-2 ring-1 ring-slate-200 ${
              canPrev ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Trước
          </button>

          {pageNums.map((n, i) =>
            typeof n === "string" ? (
              <span key={`dots-${i}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onGoto?.(n)}
                className={`h-9 w-9 rounded-md text-sm ring-1 ring-slate-200 ${
                  n === page
                    ? "bg-sky-600 font-semibold text-white"
                    : "bg-white hover:bg-slate-50"
                }`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            )
          )}

          <button
            onClick={onNext}
            disabled={!canNext}
            className={`rounded-md px-3 py-2 ring-1 ring-slate-200 ${
              canNext ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
