"use client";

import { useEffect, useMemo, useState } from "react";
import { useMenuItemsQuery } from "@/hooks/admin/useMenu";
import { Category } from "@/types/admin/product/category";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";

const AUDIENCE_FE_TO_BE: Record<Audience, "ALL" | "COMPANY" | "NEW"> = {
  ALL: "ALL",
  GROUP: "COMPANY",
  MEMBER_TIER: "NEW",
};

/* ===== Types (export) ===== */
export type DiscountKind = "FIXED_PRICE" | "AMOUNT_OFF" | "PERCENT_OFF";
export type ApplyScope = "INVOICE" | "CATEGORY" | "ITEM";
export type Audience = "ALL" | "GROUP" | "MEMBER_TIER";

export type PromotionFormValues = {
  name: string;
  kind: DiscountKind;
  value: number | "";
  minOrderAmount: number | "";
  autoApplyOnCreate: boolean;

  hasEnd: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;

  applyWeekdays: boolean[];
  limitTimeRange: boolean;
  limitFrom: string;
  limitTo: string;

  applyScope: ApplyScope;
  searchCategory: string;
  searchItem: string;
  targets: { id: string; name: string }[];
  categoryTargets: { id: string; name: string }[]; // NEW
  itemTargets: { id: string; name: string }[];
  audience: Audience;

  promotionCode?: string;
  description?: string;
  isActive?: boolean;
  maxDiscountAmount: number | "";
};
function normalizeTimeFlexible(input: string) {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ss = m[3] ? parseInt(m[3], 10) : 0;
  const ampm = m[4];
  if (ampm) hh = (hh % 12) + (/pm/i.test(ampm) ? 12 : 0);
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return { h: hh, m: mm, s: ss };
}
function timeToMinutes(t: string): number | null {
  const n = normalizeTimeFlexible(t);
  if (!n) return null;
  return n.h * 60 + n.m;
}

function toHHMMSS(t: string): string | null {
  const n = normalizeTimeFlexible(t);
  if (!n) return null;
  const hh = String(n.h).padStart(2, "0");
  const mm = String(n.m).padStart(2, "0");
  const ss = String(n.s ?? 0).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function buildISO(dateStr: string, timeStr: string) {
  if (!dateStr) return null;
  const t = normalizeTimeFlexible(timeStr || "00:00");
  if (!t) return null;
  const mDate = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!mDate) return null;
  const y = +mDate[1],
    mo = +mDate[2],
    d = +mDate[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d, t.h, t.m, t.s);
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString();
}
/* ===== Component ===== */
export default function PromotionCreateForm({
  mode = "create",
  initialValues,
  onSubmit,
}: {
  mode?: "create" | "edit";
  initialValues?: Partial<PromotionFormValues>;
  onSubmit: (dto: any) => Promise<any> | any;
}) {
  const [openItemModal, setOpenItemModal] = useState(false);
  const [openCategoryModal, setOpenCategoryModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function validate(v: PromotionFormValues) {
    const e: Record<string, string> = {};

    if (!v.name.trim()) e.name = "Vui lòng nhập tên khuyến mãi";

    // promotionCode: BE bắt buộc, phải bắt đầu KM-
    if (!v.promotionCode?.trim()) e.promotionCode = "Vui lòng nhập mã KM";
    else if (!/^KM-.+/i.test(v.promotionCode.trim()))
      e.promotionCode = 'Mã phải bắt đầu bằng "KM-"';

    if (v.value === "" || Number.isNaN(Number(v.value)))
      e.value = "Giá trị không hợp lệ";
    else if (Number(v.value) < 0) e.value = "Giá trị phải ≥ 0";
    else if (v.kind === "PERCENT_OFF" && Number(v.value) > 100) {
      e.value = "Giá trị % phải từ 0 đến 100";
    }
    // minOrderAmount: chỉ yêu cầu khi áp dụng với HÓA ĐƠN
    if (v.applyScope === "INVOICE") {
      if (v.minOrderAmount === "" || Number.isNaN(Number(v.minOrderAmount)))
        e.minOrderAmount = "Giá trị hóa đơn tối thiểu không hợp lệ";
      else if (Number(v.minOrderAmount) < 0)
        e.minOrderAmount = "Giá trị hóa đơn tối thiểu phải ≥ 0";
    }

    if (!v.startDate) e.startDate = "Chọn ngày bắt đầu";
    if (!v.startTime) e.startTime = "Chọn giờ bắt đầu";
    if (v.hasEnd) {
      if (!v.endDate) e.endDate = "Chọn ngày kết thúc";
      if (!v.endTime) e.endTime = "Chọn giờ kết thúc";
      if (!e.endDate && !e.endTime) {
        const sISO = buildISO(v.startDate, v.startTime);
        const eISO = buildISO(v.endDate, v.endTime);
        if (!sISO) e.startTime = "Giờ bắt đầu không hợp lệ";
        if (!eISO) e.endTime = "Giờ kết thúc không hợp lệ";
        if (sISO && eISO && new Date(eISO) <= new Date(sISO)) {
          e.endTime = "Thời gian kết thúc phải sau bắt đầu";
        }
      }
    }

    // applyScope: nếu CATEGORY/ITEM thì phải chọn ít nhất 1 target
    if (
      (v.applyScope === "CATEGORY" && v.categoryTargets.length === 0) ||
      (v.applyScope === "ITEM" && v.itemTargets.length === 0)
    ) {
      e.targets = "Hãy chọn ít nhất 1 mục áp dụng";
    }

    // ===== Khung giờ =====
    if (v.limitTimeRange) {
      const fromMin = timeToMinutes(v.limitFrom);
      const toMin = timeToMinutes(v.limitTo);

      if (fromMin == null) e.limitFrom = "Giờ bắt đầu khung giờ không hợp lệ";
      if (toMin == null) e.limitTo = "Giờ kết thúc khung giờ không hợp lệ";

      if (fromMin != null && toMin != null && fromMin >= toMin) {
        e.limitTo = "Giờ kết thúc phải sau giờ bắt đầu";
      }

      // Nếu KM chỉ trong 1 ngày: khung giờ phải nằm trong [startTime, endTime]
      // (chỉ check khi đã có start/end hợp lệ)
      if (
        !e.startTime &&
        v.hasEnd &&
        !e.endTime &&
        v.startDate &&
        v.endDate &&
        v.startDate === v.endDate
      ) {
        const startMin = timeToMinutes(v.startTime);
        const endMin = timeToMinutes(v.endTime);

        if (
          startMin != null &&
          endMin != null &&
          fromMin != null &&
          toMin != null
        ) {
          if (fromMin < startMin)
            e.limitFrom = "Khung giờ phải ≥ thời điểm bắt đầu KM";
          if (toMin > endMin)
            e.limitTo = "Khung giờ phải ≤ thời điểm kết thúc KM";
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function handleScopeChange(s: ApplyScope) {
    setVals((v) => ({
      ...v,
      applyScope: s,
      targets:
        s === "CATEGORY"
          ? v.categoryTargets
          : s === "ITEM"
          ? v.itemTargets
          : [],
      // Khi chuyển sang Danh mục/Mặt hàng, minOrderAmount trở thành không bắt buộc – cho phép rỗng
      ...(s !== "INVOICE"
        ? { minOrderAmount: v.minOrderAmount === "" ? "" : v.minOrderAmount }
        : {}),
    }));
    // clear lỗi targets và lỗi minOrderAmount nếu không còn áp dụng
    setErrors((err) => {
      const { targets, minOrderAmount, ...rest } = err;
      return s === "INVOICE"
        ? { ...rest, ...(minOrderAmount ? { minOrderAmount } : {}) }
        : rest;
    });
  }

  function canOpenModal(next: ApplyScope) {
    // Chỉ chặn khi đang cố mở modal đối nghịch mà list kia có item
    if (next === "CATEGORY" && vals.itemTargets.length > 0) return false;
    if (next === "ITEM" && vals.categoryTargets.length > 0) return false;
    return true;
  }

  async function handleSubmit() {
    if (!validate(vals)) return;

    if (!vals.startDate || !vals.startTime) {
      setErrors((er) => ({
        ...er,
        startDate: "Ngày bắt đầu không hợp lệ",
        startTime: "Giờ bắt đầu không hợp lệ",
      }));
      return;
    }

    const startISO = buildISO(vals.startDate, vals.startTime);
    if (!startISO) {
      setErrors((er) => ({ ...er, startTime: "Giờ bắt đầu không hợp lệ" }));
      return;
    }

    let endISO: string | null = null;
    if (vals.hasEnd) {
      if (!vals.endDate || !vals.endTime) {
        setErrors((er) => ({
          ...er,
          endDate: "Ngày kết thúc không hợp lệ",
          endTime: "Giờ kết thúc không hợp lệ",
        }));
        return;
      }

      endISO = buildISO(vals.endDate, vals.endTime);
      if (!endISO) {
        setErrors((er) => ({ ...er, endTime: "Giờ kết thúc không hợp lệ" }));
        return;
      }
    }
    const days = vals.applyWeekdays
      .map((b, i) => (b ? i : -1))
      .filter((x) => x >= 0);

    // ⚠️ Luôn có scope theo radio đã chọn
    const audienceRules: any = {
      scope: AUDIENCE_FE_TO_BE[vals.audience],
    };

    if (days.length) audienceRules.daysOfWeek = days;

    if (vals.limitTimeRange) {
      const s = toHHMMSS(vals.limitFrom);
      const e = toHHMMSS(vals.limitTo);
      if (s) audienceRules.startTime = s;
      if (e) audienceRules.endTime = e;
    }

    const payload = {
      name: vals.name.trim(),
      discountTypePromotion:
        vals.kind === "AMOUNT_OFF"
          ? "AMOUNT"
          : vals.kind === "PERCENT_OFF"
          ? "PERCENT"
          : "FIXED_PRICE",
      discountValue: Number(vals.value),
      minOrderAmount: Number(vals.minOrderAmount) || 0,
      startAt: startISO,
      endAt: vals.hasEnd ? endISO : null,
      applyWith: vals.applyScope === "INVOICE" ? "ORDER" : vals.applyScope,

      promotionCode: vals.promotionCode?.trim().toUpperCase(),
      description: vals.description?.trim() || undefined,

      categoryIds:
        vals.applyScope === "CATEGORY"
          ? vals.categoryTargets.map((x) => x.id)
          : undefined,
      itemIds:
        vals.applyScope === "ITEM"
          ? vals.itemTargets.map((x) => x.id)
          : undefined,

      maxDiscountAmount:
        vals.kind === "PERCENT_OFF" && vals.maxDiscountAmount !== ""
          ? Number(vals.maxDiscountAmount)
          : undefined,
      audienceRules,
    };

    await onSubmit(payload);
  }

  // dùng để lưu form data tạm thời trước khi submit lên server
  const [vals, setVals] = useState<PromotionFormValues>({
    name: "",
    kind: "FIXED_PRICE",
    value: "",
    minOrderAmount: "",
    autoApplyOnCreate: false,

    hasEnd: false,
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",

    applyWeekdays: [false, false, false, false, false, false, false],
    limitTimeRange: false,
    limitFrom: "",
    limitTo: "",

    applyScope: "CATEGORY",
    searchCategory: "",
    searchItem: "",
    targets: [],
    categoryTargets: [],
    itemTargets: [],
    audience: "ALL",

    promotionCode: "",
    description: "",
    isActive: mode === "create" ? false : undefined,
    maxDiscountAmount: "",
  });

  // fill khi có initialValues (dùng khi edit)

  useEffect(() => {
    if (!initialValues) return;

    setVals((v) => {
      const next = { ...v, ...initialValues };

      // 1) Map BE kind -> FE kind nếu BE truyền discountTypePromotion
      const beKind =
        (initialValues as any).discountTypePromotion ??
        (initialValues as any).kind;
      if (beKind) {
        next.kind =
          beKind === "PERCENT" || beKind === "PERCENT_OFF"
            ? "PERCENT_OFF"
            : beKind === "AMOUNT" || beKind === "AMOUNT_OFF"
            ? "AMOUNT_OFF"
            : "FIXED_PRICE";
      }

      // 2) Gán maxDiscountAmount nếu BE có (string "70000.00" -> number 70000)
      const beMax =
        (initialValues as any).maxDiscountAmount ??
        (initialValues as any).maxDiscount; // phòng khi tên field khác
      if (beMax !== undefined && beMax !== null && beMax !== "") {
        next.maxDiscountAmount = Number(beMax);
      }

      // 3) audienceRules
      const ar = (initialValues as any).audienceRules;
      if (ar) {
        if (Array.isArray(ar.daysOfWeek)) {
          const wd = [...v.applyWeekdays];
          wd.fill(false);
          ar.daysOfWeek.forEach((i: number) => {
            if (i >= 0 && i < 7) wd[i] = true;
          });
          next.applyWeekdays = wd;
        }
        if (ar.startTime || ar.endTime) {
          next.limitTimeRange = true;
          next.limitFrom = (ar.startTime || "").slice(0, 5);
          next.limitTo = (ar.endTime || "").slice(0, 5);
        }
      }

      // 4) targets
      next.targets =
        next.applyScope === "CATEGORY"
          ? next.categoryTargets ?? []
          : next.applyScope === "ITEM"
          ? next.itemTargets ?? []
          : [];

      return next;
    });
  }, [JSON.stringify(initialValues)]);

  // dùng để set từng giá trị của vals một cách tiện lợi hơn thay vì set cả object một lần nữa (giữ nguyên các giá trị khác)
  function set<K extends keyof PromotionFormValues>(
    k: K,
    value: PromotionFormValues[K]
  ) {
    setVals((v) => ({ ...v, [k]: value }));
  }
  const weekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  function toggleWeekday(i: number) {
    setVals((v) => ({
      ...v,
      applyWeekdays: v.applyWeekdays.map((b, idx) => (idx === i ? !b : b)),
    }));
  }

  function removeTarget(id: string) {
    setVals((prev) => {
      if (prev.applyScope === "CATEGORY") {
        const categoryTargets = prev.categoryTargets.filter((t) => t.id !== id);
        const targets = prev.targets.filter((t) => t.id !== id);
        return { ...prev, categoryTargets, targets };
      }
      if (prev.applyScope === "ITEM") {
        const itemTargets = prev.itemTargets.filter((t) => t.id !== id);
        const targets = prev.targets.filter((t) => t.id !== id);
        return { ...prev, itemTargets, targets };
      }
      return { ...prev, targets: [] };
    });
  }
  function toggleHasEnd(on: boolean) {
    setVals((v) => ({
      ...v,
      hasEnd: on,
      ...(on ? {} : { endDate: "", endTime: "" }),
    }));
  }

  const kindDisplay = useMemo(() => {
    switch (vals.kind) {
      case "AMOUNT_OFF":
        return "Giảm số tiền";
      case "PERCENT_OFF":
        return "Giảm theo %";
    }
  }, [vals.kind]);
  const currency = (n: number | "") =>
    n === "" || isNaN(Number(n))
      ? "0"
      : new Intl.NumberFormat("vi-VN").format(Number(n));

  // dùng để hiển thị tóm tắt nhanh các tuỳ chọn đã chọn ở khung bên phải (aside)
  const summaryLines = useMemo(() => {
    const lines: string[] = [];
    if (kindDisplay) lines.push(kindDisplay);
    if (vals.value !== "") {
      if (vals.kind === "PERCENT_OFF") lines.push(`${vals.value}%`);
      if (vals.kind === "AMOUNT_OFF") lines.push(`${currency(vals.value)} đ`);
    }
    if (vals.applyScope === "INVOICE") lines.push("Áp dụng trên hóa đơn");
    if (vals.applyScope === "CATEGORY") lines.push("Áp dụng cho danh mục");
    if (vals.applyScope === "ITEM") lines.push("Áp dụng cho mặt hàng");
    if (vals.audience === "ALL") lines.push("Tất cả khách hàng");
    if (vals.audience === "GROUP") lines.push("Nhóm khách hàng");
    if (vals.audience === "MEMBER_TIER") lines.push("Thẻ thành viên");
    return lines;
  }, [vals, kindDisplay]);

  // UI
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left */}
      <div className="space-y-6 lg:col-span-2">
        {/* Thông tin cơ bản */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Tên khuyến mãi <span className="text-red-500">*</span>
          </label>
          <input
            value={vals.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nhập tên khuyến mãi"
            className={`mt-2 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
              errors.name ? "border-red-500 focus:ring-red-500" : ""
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              value={vals.promotionCode}
              onChange={(e) => set("promotionCode", e.target.value)}
              placeholder='Mã khuyến mãi (bắt đầu bằng "KM-")'
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.promotionCode ? "border-red-500" : ""
              }`}
            />
            {errors.promotionCode && (
              <p className="mt-1 text-xs text-red-500">
                {errors.promotionCode}
              </p>
            )}
            <input
              value={vals.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mô tả (tuỳ chọn)"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </section>

        {/* Tuỳ chọn KM */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">
            Tuỳ chọn khuyến mãi{" "}
            {mode === "edit" && (
              <span className="text-xs font-normal text-slate-500">
                (Chỉnh sửa)
              </span>
            )}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Loại khuyến mãi</label>
              <select
                value={vals.kind}
                onChange={(e) => {
                  const nextKind = e.target.value as DiscountKind;
                  setVals((v) => ({
                    ...v,
                    kind: nextKind,
                    ...(nextKind !== "PERCENT_OFF"
                      ? { maxDiscountAmount: "" }
                      : {}),
                  }));
                }}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              >
                <option value="AMOUNT_OFF">Giảm số tiền</option>
                <option value="PERCENT_OFF">Giảm theo %</option>
              </select>
            </div>

            {/* Giá trị */}
            <div>
              <label className="text-sm font-medium">Giá trị *</label>
              <input
                type="number"
                min={vals.kind === "PERCENT_OFF" ? 0 : 0}
                max={vals.kind === "PERCENT_OFF" ? 100 : undefined}
                value={vals.value}
                onChange={(e) =>
                  set(
                    "value",
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder={
                  vals.kind === "PERCENT_OFF" ? "VD: 10 (%)" : "VD: 20000 (đ)"
                }
                className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                  errors.value ? "border-red-500" : ""
                }`}
              />

              {errors.value && (
                <p className="mt-1 text-xs text-red-500">{errors.value}</p>
              )}
            </div>

            {/* Đoạn code mới: Giảm tối đa */}
            {vals.kind === "PERCENT_OFF" && (
              <div className="md:col-span-1">
                <label className="text-sm font-medium">
                  Giảm tối đa (đ){" "}
                  <span className="text-slate-400">(tuỳ chọn)</span>
                </label>
                <input
                  type="number"
                  value={vals.maxDiscountAmount}
                  onChange={(e) =>
                    set(
                      "maxDiscountAmount",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="VD: 50000 (có thể bỏ trống)"
                  className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                    errors.maxDiscountAmount ? "border-red-500" : ""
                  }`}
                />
                {errors.maxDiscountAmount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.maxDiscountAmount}
                  </p>
                )}
              </div>
            )}

            {vals.applyScope === "INVOICE" && (
              <div>
                <label className="text-sm font-medium">
                  Giá trị hoá đơn tối thiểu
                </label>
                <input
                  type="number"
                  value={vals.minOrderAmount}
                  onChange={(e) =>
                    set(
                      "minOrderAmount",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="VD: 100000"
                  className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                    errors.minOrderAmount ? "border-red-500" : ""
                  }`}
                />
                {errors.minOrderAmount && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.minOrderAmount}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Thời gian áp dụng */}
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Thời gian áp dụng</h2>
            <label className="inline-flex select-none items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-sky-600"
                checked={vals.hasEnd}
                onChange={(e) => toggleHasEnd(e.target.checked)}
              />
              Có ngày kết thúc
            </label>
          </div>

          {/* Start row */}
          <div
            className={`grid grid-cols-1 gap-4 ${
              vals.hasEnd ? "md:grid-cols-4" : "md:grid-cols-2"
            }`}
          >
            <div>
              <label className="text-sm font-medium">Ngày bắt đầu</label>
              <input
                type="date"
                value={vals.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                  errors.startDate ? "border-red-500" : ""
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Thời điểm bắt đầu</label>
              <input
                type="time"
                value={vals.startTime}
                onChange={(e) => set("startTime", e.target.value)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                  errors.startTime ? "border-red-500" : ""
                }`}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>
              )}
            </div>

            {vals.hasEnd && (
              <>
                <div>
                  <label className="text-sm font-medium">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={vals.endDate}
                    min={vals.startDate || undefined} // không cho chọn trước ngày bắt đầu
                    onChange={(e) => set("endDate", e.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                      errors.endDate ? "border-red-500" : ""
                    }`}
                  />
                  {errors.endDate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.endDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Thời điểm kết thúc
                  </label>
                  <input
                    type="time"
                    value={vals.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={`mt-2 w-full rounded-lg border px-3 py-2 ${
                      errors.endTime ? "border-red-500" : ""
                    }`}
                  />
                  {errors.endTime && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* theo thứ */}
          <div className="pt-2">
            <p className="mb-2 text-sm font-medium">
              Áp dụng theo thứ trong tuần
            </p>
            <div className="flex flex-wrap gap-2">
              {weekdayNames.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWeekday(i)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    vals.applyWeekdays[i]
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "bg-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* theo khung giờ */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={vals.limitTimeRange}
                onChange={(e) => set("limitTimeRange", e.target.checked)}
              />
              Áp dụng theo khung giờ
            </label>
            {vals.limitTimeRange && (
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm">Từ</label>
                  <input
                    type="time"
                    value={vals.limitFrom}
                    onChange={(e) => set("limitFrom", e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm">Đến</label>
                  <input
                    type="time"
                    value={vals.limitTo}
                    onChange={(e) => set("limitTo", e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Áp dụng với */}
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">Áp dụng với</h2>
          {errors.targets && (
            <p className="text-xs text-red-500">{errors.targets}</p>
          )}
          <div className="flex gap-6 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="apply-scope"
                checked={vals.applyScope === "INVOICE"}
                onChange={() => handleScopeChange("INVOICE")}
              />
              Hoá đơn
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="apply-scope"
                checked={vals.applyScope === "CATEGORY"}
                onChange={() => handleScopeChange("CATEGORY")}
              />
              Danh mục
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="apply-scope"
                checked={vals.applyScope === "ITEM"}
                onChange={() => handleScopeChange("ITEM")}
              />
              Mặt hàng
            </label>
          </div>

          {/* Nút mở modal */}
          {/* CATEGORY */}
          {vals.applyScope === "CATEGORY" && (
            <button
              type="button"
              onClick={() => {
                if (!canOpenModal("CATEGORY")) {
                  setErrors((e) => ({
                    ...e,
                    targets:
                      "Đang có Mặt hàng được chọn. Hãy xoá Mặt hàng trước khi thêm Danh mục.",
                  }));
                  return;
                }
                setOpenCategoryModal(true);
              }}
              className="rounded-lg bg-sky-600 px-4 py-2 text-white shadow-sm transition hover:bg-sky-700"
            >
              + Chọn danh mục
            </button>
          )}

          {/* ITEM */}
          {vals.applyScope === "ITEM" && (
            <button
              type="button"
              onClick={() => {
                if (!canOpenModal("ITEM")) {
                  setErrors((e) => ({
                    ...e,
                    targets:
                      "Đang có Danh mục được chọn. Hãy xoá Danh mục trước khi thêm Mặt hàng.",
                  }));
                  return;
                }
                setOpenItemModal(true);
              }}
              className="rounded-lg bg-sky-600 px-4 py-2 text-white shadow-sm transition hover:bg-sky-700"
            >
              + Chọn mặt hàng
            </button>
          )}

          {/* danh sách đã chọn */}
          {(vals.applyScope === "CATEGORY" || vals.applyScope === "ITEM") && (
            <div className="rounded-xl border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vals.targets.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border bg-slate-50 p-3"
                  >
                    <div className="text-sm font-medium">{t.name}</div>
                    <button
                      type="button"
                      onClick={() => removeTarget(t.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Xoá
                    </button>
                  </div>
                ))}
                {vals.targets.length === 0 && (
                  <div className="py-6 text-center text-sm text-slate-500">
                    Chưa có mục áp dụng. Hãy bấm “Chọn …” để thêm.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODALS */}
          <ItemSelectModal
            open={openItemModal}
            onClose={() => setOpenItemModal(false)}
            onConfirm={(items) => {
              setOpenItemModal(false);
              setVals((prev) => {
                const ids = new Set(prev.itemTargets.map((x) => x.id));
                const add = items.filter((x) => !ids.has(x.id));
                const itemTargets = [...prev.itemTargets, ...add];
                const targets =
                  prev.applyScope === "ITEM" ? itemTargets : prev.targets;
                return { ...prev, itemTargets, targets };
              });
            }}
          />

          <CategorySelectModal
            open={openCategoryModal}
            onClose={() => setOpenCategoryModal(false)}
            onConfirm={(cats) => {
              setOpenCategoryModal(false);
              setVals((prev) => {
                const ids = new Set(prev.categoryTargets.map((x) => x.id));
                const add = cats.filter((x) => !ids.has(x.id));
                const categoryTargets = [...prev.categoryTargets, ...add];
                const targets =
                  prev.applyScope === "CATEGORY"
                    ? categoryTargets
                    : prev.targets;
                return { ...prev, categoryTargets, targets };
              });
            }}
          />
        </section>

        {/* Đối tượng */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Đối tượng áp dụng</h2>
          <div className="flex flex-col gap-3 text-sm">
            {(["ALL", "GROUP", "MEMBER_TIER"] as const).map((k) => (
              <label key={k} className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="aud"
                  checked={vals.audience === k}
                  onChange={() => set("audience", k)}
                />
                {k === "ALL"
                  ? "Tất cả khách hàng"
                  : k === "GROUP"
                  ? "Nhóm khách hàng"
                  : "Thẻ thành viên"}
              </label>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="rounded-lg border px-4 py-2">
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            {mode === "create" ? "Lưu" : "Cập nhật"}
          </button>
        </div>
      </div>

      {/* Right aside */}
      <aside className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 to-sky-500 p-5 text-white shadow-sm">
          <div className="text-sm opacity-90">Tổng quan</div>
          <div className="mt-3 text-2xl font-bold">{kindDisplay}</div>
          <ul className="mt-3 space-y-1 text-sm opacity-95">
            {summaryLines.map((l, idx) => (
              <li key={idx}>• {l}</li>
            ))}
          </ul>
          <div className="mt-4 text-xs opacity-90">
            {vals.startDate && (
              <div>
                Bắt đầu: {vals.startDate} {vals.startTime}
              </div>
            )}
            {vals.hasEnd && vals.endDate && (
              <div>
                Kết thúc: {vals.endDate} {vals.endTime}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ----------------- Modal shell dùng chung ----------------- */
function ModalShell({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-10 mx-auto w-[min(980px,92vw)] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50 px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ----------------- Modal chọn Mặt hàng ----------------- */
function ItemSelectModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: { id: string; name: string }[]) => void;
}) {
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<
    Record<string, { id: string; name: string }>
  >({});

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useMenuItemsQuery({
    page,
    limit,
    search: q || undefined,
  });

  const list = data?.body?.data ?? [];
  const meta = data?.body?.meta;
  const pages = meta?.totalPages ?? 1;

  function toggle(id: string, name: string, v: boolean) {
    setChecked((prev) => {
      const next = { ...prev };
      if (v) next[id] = { id, name };
      else delete next[id];
      return next;
    });
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Chọn mặt hàng"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 ring-1 ring-slate-200"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(Object.values(checked))}
            className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            Thêm{" "}
            {Object.keys(checked).length
              ? `(${Object.keys(checked).length})`
              : ""}
          </button>
        </>
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên / mô tả"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(isLoading || isFetching) && (
          <div className="col-span-full text-sm text-slate-500">
            Đang tải...
          </div>
        )}

        {list.map((it) => {
          const price = Number(it.price).toLocaleString("vi-VN");
          const checkedNow = Boolean(checked[it.id]);
          return (
            <label
              key={it.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                checkedNow ? "ring-2 ring-sky-500" : "hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{it.name}</div>
                <div className="text-xs text-slate-500">{price} đ</div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-sky-600"
                checked={checkedNow}
                onChange={(e) => toggle(it.id, it.name, e.target.checked)}
              />
            </label>
          );
        })}

        {!isLoading && list.length === 0 && (
          <div className="col-span-full text-sm text-slate-500">
            Không có mặt hàng phù hợp.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`rounded-md px-3 py-1.5 ring-1 ring-slate-200 ${
              page > 1 ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang {meta?.page ?? page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className={`rounded-md px-3 py-1.5 ring-1 ring-slate-200 ${
              page < pages ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Sau
          </button>
        </div>
      )}
    </ModalShell>
  );
}

/* ----------------- Modal chọn Danh mục ----------------- */
function CategorySelectModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (cats: { id: string; name: string }[]) => void;
}) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [checked, setChecked] = useState<
    Record<string, { id: string; name: string }>
  >({});

  const { data, isLoading, isFetching } = useCategoriesQuery({
    q: q || undefined,
    page,
    limit,
    type: "MENU",
    sort: "createdAt:DESC",
  });

  const list = data?.data ?? [];
  const meta = data?.meta;
  const pages = meta?.pages ?? 1;

  function toggle(id: string, name: string, v: boolean) {
    setChecked((prev) => {
      const next = { ...prev };
      if (v) next[id] = { id, name };
      else delete next[id];
      return next;
    });
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Chọn danh mục"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 ring-1 ring-slate-200"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(Object.values(checked))}
            className="rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            Thêm{" "}
            {Object.keys(checked).length
              ? `(${Object.keys(checked).length})`
              : ""}
          </button>
        </>
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm kiếm danh mục"
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(isLoading || isFetching) && (
          <div className="col-span-full text-sm text-slate-500">
            Đang tải...
          </div>
        )}

        {list.map((c: Category) => {
          const checkedNow = Boolean(checked[c.id]);
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                checkedNow ? "ring-2 ring-sky-500" : "hover:bg-slate-50"
              }`}
            >
              <div className="truncate font-medium">{c.name}</div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-sky-600"
                checked={checkedNow}
                onChange={(e) => toggle(c.id, c.name, e.target.checked)}
              />
            </label>
          );
        })}

        {!isLoading && list.length === 0 && (
          <div className="col-span-full text-sm text-slate-500">
            Không có danh mục phù hợp.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`rounded-md px-3 py-1.5 ring-1 ring-slate-200 ${
              page > 1 ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang {meta?.page ?? page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className={`rounded-md px-3 py-1.5 ring-1 ring-slate-200 ${
              page < pages ? "hover:bg-slate-50" : "opacity-50"
            }`}
          >
            Sau
          </button>
        </div>
      )}
    </ModalShell>
  );
}
