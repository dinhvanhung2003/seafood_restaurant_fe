import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApplicablePromotions } from "@/hooks/admin/usePromotion";
import { currency } from "@/utils/purchase";

export default function PromotionPicker({
  open,
  onClose,
  invoiceId,
  onApply,
  invoiceHasPromotion,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  onApply: (payload: { promotionId: string }) => Promise<void>;
  invoiceHasPromotion?: boolean;
}) {
  const { data, isLoading } = useApplicablePromotions(invoiceId);
  console.log("Applicable promotions:", data);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg z-[120]">
        <DialogHeader>
          <DialogTitle>Chọn khuyến mãi</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          {invoiceHasPromotion && (
            <div className="mb-3 rounded-md bg-amber-50 border-l-4 border-amber-200 p-3 text-amber-700">
              Hoá đơn đã có khuyến mãi HÓA ĐƠN. Xoá khuyến mãi hiện tại trước
              khi áp mã mới.
            </div>
          )}

          {isLoading && <div className="text-sm text-slate-500">Đang tải…</div>}
          {!isLoading && (!data || data.length === 0) && (
            <div className="text-sm text-slate-500">
              Không có khuyến mãi phù hợp.
            </div>
          )}

          <div className="space-y-3">
            {data?.map((p) => (
              <div
                key={p.promotionId}
                className="rounded-xl border p-3 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-medium">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-slate-500">
                      {p.description}
                    </div>
                  )}

                  <div className="flex gap-2 text-xs">
                    <Badge variant="secondary">{p.applyWith}</Badge>
                    <Badge variant="outline">
                      {p.discountType === "PERCENT"
                        ? `${p.discountValue}%`
                        : `-${currency(p.discountValue)}`}
                    </Badge>
                    {Number(p.maxDiscountAmount) > 0 && (
                      <Badge variant="outline">
                        Tối đa {currency(p.maxDiscountAmount)}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm">
                    Giảm ước tính: <b>-{currency(p.estimatedDiscount)}</b>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => onApply({ promotionId: p.promotionId })}
                  disabled={Boolean(invoiceHasPromotion)}
                >
                  Áp dụng
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
