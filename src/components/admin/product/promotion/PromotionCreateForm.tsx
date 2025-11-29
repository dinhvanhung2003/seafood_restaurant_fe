"use client";

import { useEffect, useMemo, useState } from "react";
import { useMenuItemsQuery } from "@/hooks/admin/useMenu";
import { Category } from "@/types/admin/product/category";
import { useCategoriesQuery } from "@/hooks/admin/useCategory";
// Import Icons để làm đẹp giao diện
import {
  Calendar,
  Clock,
  DollarSign,
  Percent,
  Tag,
  FileText,
  ShoppingBag,
  Layers,
  Receipt,
  CheckCircle2,
  X,
  Plus,
  Search,
  AlertCircle,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

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

/* ===== Helper Functions (GIỮ NGUYÊN LOGIC) ===== */
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

  // --- Logic validate giữ nguyên ---
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

  // --- Logic handleScopeChange giữ nguyên ---
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

  // dùng để set từng giá trị của vals một cách tiện lợi hơn thay vì set cả object một lần nữa
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
    return lines;
  }, [vals, kindDisplay]);

  // UI
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start relative">
      {/* ===== LEFT COLUMN (FORM) ===== */}
      <div className="space-y-6 lg:col-span-2">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Tag size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              Thông tin chung
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tên chương trình <span className="text-red-500">*</span>
              </label>
              <input
                value={vals.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ví dụ: Khuyến mãi tết 2025"
                className={`w-full rounded-lg border bg-slate-50/50 px-3 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all ${
                  errors.name
                    ? "border-red-500 ring-2 ring-red-100"
                    : "border-slate-200"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mã khuyến mãi (Code)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <FileText size={16} />
                  </span>
                  <input
                    value={vals.promotionCode}
                    onChange={(e) => set("promotionCode", e.target.value)}
                    placeholder="KM-..."
                    className={`w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm uppercase placeholder:normal-case font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                      errors.promotionCode
                        ? "border-red-500"
                        : "border-slate-200"
                    }`}
                  />
                </div>
                {errors.promotionCode && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.promotionCode}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mô tả ngắn
                </label>
                <input
                  value={vals.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Mô tả chi tiết..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: GIÁ TRỊ KHUYẾN MÃI */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              Giá trị ưu đãi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loại KM & Giá trị */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Hình thức giảm
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setVals((v) => ({ ...v, kind: "AMOUNT_OFF" }));
                      // Logic clear maxDiscount đã có trong onChange gốc, ta gọi tay nếu cần
                      // Nhưng ở đây ta chỉ set kind, useEffect sẽ lo hoặc ta set thủ công như code gốc:
                      if (vals.kind !== "AMOUNT_OFF")
                        setVals((v) => ({
                          ...v,
                          kind: "AMOUNT_OFF",
                          maxDiscountAmount: "",
                        }));
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                      vals.kind === "AMOUNT_OFF"
                        ? "bg-white text-sky-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <DollarSign size={14} /> Theo số tiền
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setVals((v) => ({ ...v, kind: "PERCENT_OFF" }))
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                      vals.kind === "PERCENT_OFF"
                        ? "bg-white text-sky-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Percent size={14} /> Theo phần trăm
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Giá trị giảm *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={vals.kind === "PERCENT_OFF" ? 100 : undefined}
                    value={vals.value}
                    onChange={(e) =>
                      set(
                        "value",
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="0"
                    className={`w-full rounded-lg border pl-3 pr-10 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                      errors.value ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400 text-sm font-medium">
                    {vals.kind === "PERCENT_OFF" ? "%" : "đ"}
                  </div>
                </div>
                {errors.value && (
                  <p className="mt-1 text-xs text-red-500">{errors.value}</p>
                )}
              </div>
            </div>

            {/* Các điều kiện phụ */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              {vals.kind === "PERCENT_OFF" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Giảm tối đa (đ)
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
                    placeholder="Không giới hạn"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ví dụ: Giảm 50% nhưng tối đa 50k
                  </p>
                </div>
              )}

              {vals.applyScope === "INVOICE" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Đơn hàng tối thiểu (đ)
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
                    placeholder="0"
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                      errors.minOrderAmount
                        ? "border-red-500"
                        : "border-slate-200"
                    }`}
                  />
                  {errors.minOrderAmount && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.minOrderAmount}
                    </p>
                  )}
                </div>
              )}

              {vals.kind !== "PERCENT_OFF" && vals.applyScope !== "INVOICE" && (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                  Không có tùy chọn thêm
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: PHẠM VI ÁP DỤNG (SCOPE) - THIẾT KẾ LẠI */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Layers size={18} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">
              Phạm vi áp dụng
            </h2>
          </div>

          {errors.targets && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-center gap-2">
              <AlertCircle size={14} /> {errors.targets}
            </div>
          )}

          {/* Scope Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div
              onClick={() => handleScopeChange("INVOICE")}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md ${
                vals.applyScope === "INVOICE"
                  ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                  : "border-slate-200 bg-white hover:border-purple-200"
              }`}
            >
              <input
                type="radio"
                checked={vals.applyScope === "INVOICE"}
                readOnly
                className="hidden"
              />
              <Receipt
                className={
                  vals.applyScope === "INVOICE"
                    ? "text-purple-600"
                    : "text-slate-400"
                }
              />
              <span
                className={`text-sm font-medium ${
                  vals.applyScope === "INVOICE"
                    ? "text-purple-700"
                    : "text-slate-600"
                }`}
              >
                Toàn bộ hoá đơn
              </span>
            </div>

            <div
              onClick={() => handleScopeChange("CATEGORY")}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md ${
                vals.applyScope === "CATEGORY"
                  ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                  : "border-slate-200 bg-white hover:border-purple-200"
              }`}
            >
              <input
                type="radio"
                checked={vals.applyScope === "CATEGORY"}
                readOnly
                className="hidden"
              />
              <Layers
                className={
                  vals.applyScope === "CATEGORY"
                    ? "text-purple-600"
                    : "text-slate-400"
                }
              />
              <span
                className={`text-sm font-medium ${
                  vals.applyScope === "CATEGORY"
                    ? "text-purple-700"
                    : "text-slate-600"
                }`}
              >
                Theo danh mục
              </span>
            </div>

            <div
              onClick={() => handleScopeChange("ITEM")}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all hover:shadow-md ${
                vals.applyScope === "ITEM"
                  ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                  : "border-slate-200 bg-white hover:border-purple-200"
              }`}
            >
              <input
                type="radio"
                checked={vals.applyScope === "ITEM"}
                readOnly
                className="hidden"
              />
              <ShoppingBag
                className={
                  vals.applyScope === "ITEM"
                    ? "text-purple-600"
                    : "text-slate-400"
                }
              />
              <span
                className={`text-sm font-medium ${
                  vals.applyScope === "ITEM"
                    ? "text-purple-700"
                    : "text-slate-600"
                }`}
              >
                Theo mặt hàng
              </span>
            </div>
          </div>

          {/* Conditional Input for Category/Item */}
          {vals.applyScope !== "INVOICE" && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-700">
                  Danh sách{" "}
                  {vals.applyScope === "CATEGORY" ? "danh mục" : "mặt hàng"}{" "}
                  được áp dụng:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!canOpenModal(vals.applyScope)) {
                      setErrors((e) => ({
                        ...e,
                        targets:
                          "Đang có dữ liệu của loại khác. Hãy xoá trước khi thêm.",
                      }));
                      return;
                    }
                    vals.applyScope === "CATEGORY"
                      ? setOpenCategoryModal(true)
                      : setOpenItemModal(true);
                  }}
                  className="flex items-center gap-1 text-sm bg-white border border-slate-300 shadow-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
                >
                  <Plus size={14} /> Thêm{" "}
                  {vals.applyScope === "CATEGORY" ? "danh mục" : "mặt hàng"}
                </button>
              </div>

              {vals.targets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {vals.targets.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded border border-slate-200 shadow-sm"
                    >
                      <span className="text-sm text-slate-700 font-medium">
                        {t.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeTarget(t.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                  Chưa chọn mục nào
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 4: THỜI GIAN & LỊCH TRÌNH */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <CalendarClock size={18} />
              </div>
              <h2 className="text-base font-semibold text-slate-800">
                Thời gian hiệu lực
              </h2>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors">
              <input
                type="checkbox"
                checked={vals.hasEnd}
                onChange={(e) => toggleHasEnd(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-medium text-slate-700">
                Đặt ngày kết thúc
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* START */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bắt đầu từ
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={vals.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      errors.startDate ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div className="w-1/3">
                  <input
                    type="time"
                    value={vals.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                    className={`w-full text-sm rounded-lg border px-2 py-2 text-center ${
                      errors.startTime ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* END */}
            <div
              className={`space-y-3 transition-opacity ${
                vals.hasEnd
                  ? "opacity-100"
                  : "opacity-40 pointer-events-none grayscale"
              }`}
            >
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kết thúc lúc
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={vals.endDate}
                    min={vals.startDate || undefined}
                    onChange={(e) => set("endDate", e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      errors.endDate ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>
                <div className="w-1/3">
                  <input
                    type="time"
                    value={vals.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                    className={`w-full text-sm rounded-lg border px-2 py-2 text-center ${
                      errors.endTime ? "border-red-500" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ADVANCED SCHEDULE */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            {/* Weekdays */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Áp dụng các thứ trong tuần
              </label>
              <div className="flex flex-wrap gap-2">
                {weekdayNames.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWeekday(i)}
                    className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                      vals.applyWeekdays[i]
                        ? "bg-sky-500 text-white shadow-md shadow-sky-200 scale-105"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range Toggle */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <input
                  id="limitTime"
                  type="checkbox"
                  checked={vals.limitTimeRange}
                  onChange={(e) => set("limitTimeRange", e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <label
                  htmlFor="limitTime"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Chỉ áp dụng trong khung giờ vàng
                </label>
              </div>

              {vals.limitTimeRange && (
                <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100 w-fit">
                  <Clock size={16} className="text-orange-500" />
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={vals.limitFrom}
                      onChange={(e) => set("limitFrom", e.target.value)}
                      className="bg-white border border-orange-200 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-orange-400"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="time"
                      value={vals.limitTo}
                      onChange={(e) => set("limitTo", e.target.value)}
                      className="bg-white border border-orange-200 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 5: ĐỐI TƯỢNG (READONLY) */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-70 hover:opacity-100 transition-opacity">
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            Đối tượng khách hàng
          </h2>
          <label className="inline-flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 w-full cursor-not-allowed">
            <div className="w-4 h-4 rounded-full border-[5px] border-emerald-500 bg-white"></div>
            <span className="text-sm font-medium text-slate-700">
              Tất cả khách hàng
            </span>
            <input
              type="radio"
              checked
              readOnly
              className="hidden"
              onClick={() => set("audience", "ALL")}
            />
          </label>
        </section>

        {/* ACTION BUTTONS (MOBILE ONLY - Hidden on Desktop if needed, but let's keep it) */}
        <div className="lg:hidden flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
          >
            Huỷ bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-sky-600 text-white font-medium shadow-lg shadow-sky-200"
          >
            {mode === "create" ? "Tạo khuyến mãi" : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {/* ===== RIGHT ASIDE (SUMMARY & ACTIONS) ===== */}
      <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-4">
        {/* Summary Card */}
        <div className="rounded-2xl overflow-hidden shadow-xl shadow-sky-100/50 border border-slate-100">
          <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Tag size={120} />
            </div>
            <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">
              Tổng quan chương trình
            </h3>
            <div className="text-2xl font-bold truncate pr-4">
              {vals.name || "Tên chương trình..."}
            </div>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">
                {vals.kind === "PERCENT_OFF"
                  ? `${vals.value || 0}%`
                  : `${currency(vals.value)}`}
              </span>
              <span className="text-lg opacity-80">
                {vals.kind === "PERCENT_OFF" ? "" : "đ"}
              </span>
            </div>
            <div className="text-sm opacity-90 font-medium bg-white/20 inline-block px-2 py-0.5 rounded mt-1">
              {kindDisplay}
            </div>
          </div>

          <div className="bg-white p-5 space-y-4">
            <div className="space-y-3">
              {summaryLines.slice(2).map((line, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-sm text-slate-600"
                >
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 mt-0.5 shrink-0"
                  />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase mb-2">
                <CalendarDays size={14} /> Thời gian
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                {vals.startDate ? (
                  <div className="flex justify-between">
                    <span>Bắt đầu:</span>
                    <span className="font-medium">
                      {vals.startDate} {vals.startTime}
                    </span>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">
                    Chưa chọn ngày bắt đầu
                  </div>
                )}

                {vals.hasEnd && vals.endDate && (
                  <div className="flex justify-between">
                    <span>Kết thúc:</span>
                    <span className="font-medium">
                      {vals.endDate} {vals.endTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons Inside Aside for better visibility */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-white transition-colors"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="py-2.5 rounded-xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-95"
            >
              {mode === "create" ? "Hoàn tất" : "Cập nhật"}
            </button>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex gap-2 text-blue-700 font-medium text-sm mb-2">
            <AlertCircle size={16} /> Mẹo
          </div>
          <p className="text-xs text-blue-600/80 leading-relaxed">
            Đặt tên chương trình ngắn gọn nhưng thu hút để dễ dàng quản lý. Kiểm
            tra kỹ thời gian kết thúc để tránh áp dụng sai.
          </p>
        </div>
      </aside>

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
              prev.applyScope === "CATEGORY" ? categoryTargets : prev.targets;
            return { ...prev, categoryTargets, targets };
          });
        }}
      />
    </div>
  );
}

// Icon wrapper helper if needed, but imported Lucide icons directly above.
const CalendarClock = ({ size }: { size?: number }) => (
  <div className="relative">
    <Calendar size={size} />
    <Clock
      size={size ? size / 2 : 8}
      className="absolute bottom-0 right-0 bg-white rounded-full"
    />
  </div>
);

/* ----------------- Modal shell dùng chung (Makeover nhẹ) ----------------- */
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-4">{children}</div>
        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-6 py-4 rounded-b-2xl">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ----------------- Modal chọn Mặt hàng (UI Polish) ----------------- */
function ItemSelectModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: { id: string; name: string }[]) => void;
}) {
  // Logic giữ nguyên
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
      title="Chọn mặt hàng áp dụng"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Huỷ bỏ
          </button>
          <button
            onClick={() => onConfirm(Object.values(checked))}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white shadow-md shadow-sky-200 hover:bg-sky-700 transition-all"
          >
            Thêm{" "}
            {Object.keys(checked).length
              ? `${Object.keys(checked).length} mặt hàng`
              : ""}
          </button>
        </>
      }
    >
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên món hoặc mô tả..."
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(isLoading || isFetching) && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            Đang tải dữ liệu...
          </div>
        )}

        {list.map((it) => {
          const price = Number(it.price).toLocaleString("vi-VN");
          const checkedNow = Boolean(checked[it.id]);
          return (
            <label
              key={it.id}
              className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                checkedNow
                  ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                  : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
              }`}
            >
              <div className="min-w-0 flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    checkedNow
                      ? "bg-sky-200 text-sky-700"
                      : "bg-slate-100 text-slate-500 group-hover:bg-white"
                  }`}
                >
                  {it.name.charAt(0)}
                </div>
                <div>
                  <div className="truncate font-medium text-slate-800 text-sm">
                    {it.name}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {price} đ
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  checkedNow
                    ? "bg-sky-500 border-sky-500"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checkedNow && (
                  <CheckCircle2 size={14} className="text-white" />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={checkedNow}
                onChange={(e) => toggle(it.id, it.name, e.target.checked)}
              />
            </label>
          );
        })}

        {!isLoading && list.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Không tìm thấy mặt hàng nào.
          </div>
        )}
      </div>

      {/* Pagination UI improved */}
      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {meta?.page ?? page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </ModalShell>
  );
}

/* ----------------- Modal chọn Danh mục (UI Polish) ----------------- */
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
      title="Chọn danh mục áp dụng"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Huỷ bỏ
          </button>
          <button
            onClick={() => onConfirm(Object.values(checked))}
            className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white shadow-md shadow-sky-200 hover:bg-sky-700 transition-all"
          >
            Thêm{" "}
            {Object.keys(checked).length
              ? `${Object.keys(checked).length} danh mục`
              : ""}
          </button>
        </>
      }
    >
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm kiếm danh mục..."
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {(isLoading || isFetching) && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500">
            Đang tải dữ liệu...
          </div>
        )}

        {list.map((c: Category) => {
          const checkedNow = Boolean(checked[c.id]);
          return (
            <label
              key={c.id}
              className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                checkedNow
                  ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                  : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers
                  size={16}
                  className={checkedNow ? "text-sky-600" : "text-slate-400"}
                />
                <div className="truncate font-medium text-sm text-slate-700">
                  {c.name}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  checkedNow
                    ? "bg-sky-500 border-sky-500"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checkedNow && (
                  <CheckCircle2 size={14} className="text-white" />
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={checkedNow}
                onChange={(e) => toggle(c.id, c.name, e.target.checked)}
              />
            </label>
          );
        })}

        {!isLoading && list.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Không tìm thấy danh mục nào.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {meta?.page ?? page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
            className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </ModalShell>
  );
}
