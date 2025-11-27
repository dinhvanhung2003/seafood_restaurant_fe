"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Field } from "@/helper/purchase";
import type { DiscountType, NumMaybeEmpty } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  grandTotal,
}: {
  /* ... giữ nguyên types ... */
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
  grandTotal: number;
}) {
  // --- STATE LỖI ---
  const [discountErr, setDiscountErr] = useState<string | null>(null);
  const [shipErr, setShipErr] = useState<string | null>(null);
  const [paidErr, setPaidErr] = useState<string | null>(null);

  // Hàm validate chung cho số dương
  const handleNumericChange = (
    val: string,
    setter: (v: NumMaybeEmpty) => void,
    setError: (e: string | null) => void,
    maxVal?: number, // Optional: giới hạn max
    maxMsg?: string
  ) => {
    // 1. Cho phép rỗng
    if (val === "") {
      setError(null);
      setter("");
      return;
    }

    // 2. Validate Regex (Chỉ số và dấu chấm)
    const numericRe = /^\d*\.?\d*$/;
    if (!numericRe.test(val)) {
      setError("Vui lòng chỉ nhập số");
      return; // Không update value nếu ký tự lạ
    }

    // 3. Validate logic
    const n = Number(val);
    if (isNaN(n)) {
      setError("Số không hợp lệ");
    } else if (n < 0) {
      setError("Không được nhập số âm");
    } else if (maxVal !== undefined && n > maxVal) {
      setError(maxMsg || `Giá trị không được vượt quá ${maxVal}`);
    } else {
      setError(null); // Hợp lệ
    }

    // Vẫn update value để user thấy số mình gõ (dù sai logic max/min)
    setter(n);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ... Phần Ngày và Note giữ nguyên ... */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Ngày">
            <Input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </Field>
          <Field label="Ghi chú phiếu" className="md:col-span-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 2000))}
              rows={2}
              maxLength={2000}
            />
          </Field>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* GIẢM GIÁ */}
          <Field label="Giảm giá toàn phiếu">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Select
                  value={globalDiscountType}
                  onValueChange={(v) =>
                    setGlobalDiscountType(v as DiscountType)
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Số tiền</SelectItem>
                    <SelectItem value="PERCENT">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text" // Đổi thành text để kiểm soát regex tốt hơn
                  className={discountErr ? "border-red-500" : ""}
                  value={globalDiscountValue}
                  onChange={(e) =>
                    handleNumericChange(
                      e.target.value,
                      setGlobalDiscountValue,
                      setDiscountErr,
                      globalDiscountType === "PERCENT" ? 100 : undefined,
                      "Phần trăm không được quá 100"
                    )
                  }
                />
              </div>
              {discountErr && (
                <span className="text-xs text-red-500">{discountErr}</span>
              )}
            </div>
          </Field>

          {/* PHÍ VẬN CHUYỂN */}
          <Field label="Phí vận chuyển">
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                className={shipErr ? "border-red-500" : ""}
                value={shippingFee}
                onChange={(e) =>
                  handleNumericChange(
                    e.target.value,
                    setShippingFee,
                    setShipErr
                  )
                }
              />
              {shipErr && (
                <span className="text-xs text-red-500">{shipErr}</span>
              )}
            </div>
          </Field>

          {/* TIỀN ĐÃ TRẢ */}
          <Field label="Tiền đã trả (tuỳ chọn)">
            <div className="flex flex-col gap-1">
              <Input
                type="text"
                className={paidErr ? "border-red-500" : ""}
                value={amountPaid}
                onChange={(e) =>
                  handleNumericChange(
                    e.target.value,
                    setAmountPaid,
                    setPaidErr,
                    grandTotal, // Validate không lớn hơn tổng tiền
                    "Tiền trả vượt quá tổng đơn hàng"
                  )
                }
              />
              {paidErr && (
                <span className="text-xs text-red-500">{paidErr}</span>
              )}
            </div>
          </Field>

          <div className="flex items-end pb-1">{renderTotals}</div>
        </div>
      </CardContent>
    </Card>
  );
}
