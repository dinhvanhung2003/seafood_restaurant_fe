// utils/mapPromotionDetailToForm.ts
import type { PromotionDetail } from "@/hooks/admin/usePromotion";
import type { PromotionFormValues } from "@/components/admin/product/promotion/PromotionCreateForm";

function toLocalDateTime(iso?: string | null) {
    if (!iso) return { date: "", time: "" };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: "", time: "" };
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { date, time };
}

export function mapPromotionDetailToForm(
    d: PromotionDetail
): Partial<PromotionFormValues> {
    const kind =
        d.discountTypePromotion === "PERCENT"
            ? "PERCENT_OFF"
            : d.discountTypePromotion === "AMOUNT"
                ? "AMOUNT_OFF"
                : "FIXED_PRICE";

    const applyScope =
        d.applyWith === "ORDER"
            ? "INVOICE"
            : d.applyWith === "CATEGORY"
                ? "CATEGORY"
                : "ITEM";

    const categoryTargets = (d.categories ?? []).map((c) => ({ id: c.id, name: c.name }));
    const itemTargets = (d.items ?? []).map((i) => ({ id: i.id, name: i.name }));
    const targets = applyScope === "CATEGORY" ? categoryTargets : applyScope === "ITEM" ? itemTargets : [];

    const { date: startDate, time: startTime } = toLocalDateTime(d.startAt);
    const { date: endDate, time: endTime } = toLocalDateTime(d.endAt);
    const hasEnd = Boolean(d.endAt);

    const days = d.audienceRules?.daysOfWeek ?? [];
    const applyWeekdays = Array.from({ length: 7 }, (_, i) => days.includes(i));
    const limitTimeRange = Boolean(d.audienceRules?.startTime || d.audienceRules?.endTime);
    const limitFrom = (d.audienceRules?.startTime ?? "").slice(0, 5); // HH:mm
    const limitTo = (d.audienceRules?.endTime ?? "").slice(0, 5);
    const audience = (d.audienceRules?.scope as any) ?? "ALL";

    return {
        name: d.name,
        promotionCode: d.promotionCode ?? "",
        description: d.description ?? "",
        kind,
        value: Number(d.discountValue),
        minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : "",
        applyScope,

        categoryTargets,
        itemTargets,
        targets,

        startDate,
        startTime,
        hasEnd,
        endDate,
        endTime,

        applyWeekdays,
        limitTimeRange,
        limitFrom,
        limitTo,
        audience,
        isActive: d.isActive,
        maxDiscountAmount:
            d.discountTypePromotion === "PERCENT" && d.maxDiscountAmount != null
                ? Number(d.maxDiscountAmount)
                : "",
    };
}
