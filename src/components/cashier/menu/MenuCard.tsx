"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { MenuItem } from "@/types/types";
import { currency } from "@/utils/money";

export function MenuCard({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) {
  const discountAmount = Number((item as any)?.discountAmount ?? NaN);
  const hasPromo = Number.isFinite(discountAmount) && discountAmount > 0;

  const finalPrice =
    Number((item as any)?.priceAfterDiscount ?? NaN) && hasPromo
      ? Number((item as any).priceAfterDiscount)
      : Number(item.price);

  const origin = Number(item.price) || 0;
  const pct =
    hasPromo && origin > 0
      ? Math.min(100, Math.round((discountAmount / origin) * 100))
      : 0;

  const badge =
    hasPromo &&
    typeof (item as any)?.badge === "string" &&
    (item as any).badge.trim().length > 0
      ? (item as any).badge.trim()
      : null;

  return (
    <Card
      className={[
        "relative overflow-hidden transition-shadow",
        hasPromo
          ? "border-emerald-500/40 shadow-[0_0_0_1px_rgba(16,185,129,.2)]"
          : "",
        "hover:shadow-lg",
      ].join(" ")}
    >
      {/* RIBBON chỉ khi có KM */}
      {hasPromo && (
        <div className="absolute left-0 top-0 z-10">
          <div className="bg-emerald-600 text-white text-[10px] px-2 py-1 font-semibold rounded-br">
            KM {badge ?? `-${discountAmount.toLocaleString()}đ`}
          </div>
        </div>
      )}

      <button onClick={onAdd} className="group text-left w-full">
        <div className="h-28 w-full bg-slate-100 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt="" className="h-full w-full object-contain" />
          {/* CHIP “Giảm …đ” – chỉ hiện khi có KM */}
          {hasPromo && (
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 backdrop-blur px-2 py-0.5 text-[10px] font-semibold ring-1 ring-emerald-500/40">
              Giảm {discountAmount.toLocaleString()}đ
            </span>
          )}
        </div>

        <CardContent className="p-3">
          <div className="mb-1 text-sm font-medium leading-tight group-hover:underline">
            {item.name}
          </div>

          {/* GIÁ: nếu có KM thì gạch-ngang giá gốc & nổi bật giá sau giảm.
              Nếu KHÔNG có KM: chỉ hiển thị 1 dòng giá, không có số rơi. */}
          {hasPromo ? (
            <div className="space-y-1">
              <div className="text-xs text-slate-400 line-through">
                {currency(origin)}
              </div>
              <div className="text-base font-bold text-emerald-700">
                {currency(finalPrice)}
              </div>

              {/* progress % tiết kiệm – chỉ khi có KM */}
              <div className="mt-1">
                <div className="h-1.5 w-full rounded-full bg-emerald-100">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                    aria-label={`Tiết kiệm ${pct}%`}
                  />
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-700 font-medium">
                  Tiết kiệm {pct}% ({discountAmount.toLocaleString()}đ)
                </div>
              </div>
            </div>
          ) : (
            <div className="text-base font-semibold text-slate-900">
              {currency(finalPrice)}
            </div>
          )}
        </CardContent>
      </button>
    </Card>
  );
}
