"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Field } from "@/helper/purchase";
import type { DiscountType, NumMaybeEmpty } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FormBasics({
  receiptDate,
  setReceiptDate,
  note,
  setNote,
  globalDiscountType,
  setGlobalDiscountType,
  globalDiscountValue,
  setGlobalDiscountValue,
  shippingFee,
  setShippingFee,
  amountPaid,
  setAmountPaid,
  renderTotals,
}: {
  receiptDate: string;
  setReceiptDate: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  globalDiscountType: DiscountType;
  setGlobalDiscountType: (v: DiscountType) => void;
  globalDiscountValue: NumMaybeEmpty;
  setGlobalDiscountValue: (v: NumMaybeEmpty) => void;
  shippingFee: NumMaybeEmpty;
  setShippingFee: (v: NumMaybeEmpty) => void;
  amountPaid: NumMaybeEmpty;
  setAmountPaid: (v: NumMaybeEmpty) => void;
  renderTotals: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Ngày">
            <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
          </Field>
          <Field label="Ghi chú phiếu" className="md:col-span-2">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </Field>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Giảm giá toàn phiếu">
            <div className="flex gap-2">
              <Select value={globalDiscountType} onValueChange={(v) => setGlobalDiscountType(v as DiscountType)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AMOUNT">Số tiền</SelectItem>
                  <SelectItem value="PERCENT">%</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={globalDiscountValue === "" ? "" : String(globalDiscountValue)}
                onChange={(e) => setGlobalDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </Field>

          <Field label="Phí vận chuyển">
            <Input
              type="number"
              value={shippingFee === "" ? "" : String(shippingFee)}
              onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>

          <Field label="Tiền đã trả (tuỳ chọn)">
            <Input
              type="number"
              value={amountPaid === "" ? "" : String(amountPaid)}
              onChange={(e) => setAmountPaid(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </Field>

          <div className="flex items-end">{renderTotals}</div>
        </div>
      </CardContent>
    </Card>
  );
}
