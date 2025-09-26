"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { currency, asNum, applyGlobalDiscount } from "@/utils/purchase";
import type { DiscountType, Line, NumMaybeEmpty } from "@/types/types";

import FormBasics from "@/components/admin/inventories/purchase/form/FormBasics";
import TotalsBar from "@/components/admin/inventories/purchase/bar/TotalsBar";
import IngredientPicker from "@/components/admin/inventories/purchase/picker/IngredientPicker";
import SupplierPicker from "@/components/admin/inventories/purchase/picker/SupplierPicker";
import LinesTable from "@/components/admin/inventories/purchase/lines/LineTable";

import AddSupplierModal from "@/components/admin/partner/supplier/modal/AddSupplierModal";
import AddIngredientModal from "@/components/admin/inventories/inventory-item/modal/AddIngredientModal";
import { usePRCreate, usePRCreateDraft } from "@/hooks/admin/usePurchase";
import type { PRCreatePayload } from "@/hooks/admin/usePurchase";
export default function PurchaseCreatePage() {
  /** ---------- FORM BASICS ---------- */
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType>("AMOUNT");
  const [globalDiscountValue, setGlobalDiscountValue] = useState<NumMaybeEmpty>("");
  const [shippingFee, setShippingFee] = useState<NumMaybeEmpty>("");
  const [amountPaid, setAmountPaid] = useState<NumMaybeEmpty>("");
  const [note, setNote] = useState<string>("");

  /** ---------- LINES ---------- */
  const [lines, setLines] = useState<Line[]>([]);
  const addLine = (id: string, name: string, unitCode?: string) => {
    setLines((prev) => [
      ...prev,
      {
        tmpId: crypto.randomUUID(),
        itemId: id,
        itemName: name,
        quantity: "",
        unitPrice: "",
        discountType: "AMOUNT",
        discountValue: "",
        receivedUomCode: unitCode || "",
      },
    ]);
  };
  const removeLine = (tmpId: string) => setLines((s) => s.filter((l) => l.tmpId !== tmpId));
  const updateLine = (tmpId: string, patch: Partial<Line>) =>
    setLines((s) => s.map((l) => (l.tmpId === tmpId ? { ...l, ...patch } : l)));

  /** ---------- TOTALS ---------- */
  const subTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const gross = asNum(l.quantity) * asNum(l.unitPrice);
      const disc =
        l.discountType === "PERCENT"
          ? Math.max(0, Math.min(100, asNum(l.discountValue))) * 0.01 * gross
          : asNum(l.discountValue);
      return sum + Math.max(0, gross - disc);
    }, 0);
  }, [lines]);

  /** ---------- CREATE (dùng hook) ---------- */
  const createFinalMu = usePRCreate();    
const createDraftMu = usePRCreateDraft();



  const grandTotal = useMemo(() => {
    const { after } = applyGlobalDiscount(subTotal, globalDiscountType, globalDiscountValue);
    return Math.max(0, after + asNum(shippingFee));
  }, [subTotal, shippingFee, globalDiscountType, globalDiscountValue]);

  /** ---------- SUPPLIER & INGREDIENT MODALS ---------- */
  const [openAddSupplier, setOpenAddSupplier] = useState(false);
  const [openAddIngredient, setOpenAddIngredient] = useState(false);
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);





const buildPayload = (): PRCreatePayload => ({
  supplierId: supplierId!,               
  receiptDate,
  globalDiscountType,
  globalDiscountValue: asNum(globalDiscountValue),
  shippingFee: asNum(shippingFee),
  amountPaid: asNum(amountPaid),
  note: note || "",
  items: lines.map((l) => ({
    itemId: l.itemId,
    quantity: asNum(l.quantity),
    unitPrice: asNum(l.unitPrice),
    discountType: l.discountType,
    discountValue: asNum(l.discountValue),
    receivedUomCode: l.receivedUomCode || undefined,
    lotNumber: l.lotNumber || undefined,
    expiryDate: l.expiryDate || undefined,
    note: l.note || undefined,
  })),
});


  const handleSaveDraft = () => {
  if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
  if (!receiptDate) return toast.error("Vui lòng chọn ngày nhập");
  if (lines.length === 0) return toast.error("Chưa có dòng hàng nào");

  createDraftMu.mutate(buildPayload(), {
    onSuccess: (res) => {
      toast.success("Đã lưu NHÁP", { description: res?.code });
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Lưu nháp thất bại");
    },
  });
};

const handleComplete = () => {
  if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp");
  if (!receiptDate) return toast.error("Vui lòng chọn ngày nhập");
  if (lines.length === 0) return toast.error("Chưa có dòng hàng nào");

  createFinalMu.mutate(buildPayload(), {
    onSuccess: (res) => {
      toast.success("Đã tạo phiếu (HOÀN THÀNH)", { description: res?.code });
      // reset form
      setLines([]);
      setGlobalDiscountValue("");
      setShippingFee("");
      setAmountPaid("");
      setNote("");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || e?.message || "Tạo phiếu thất bại");
    },
  });
};

  /** ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tạo phiếu nhập</h1>
        <div className="text-sm text-muted-foreground">
          Cần trả NCC: <b className="text-black">{currency(grandTotal)}</b>
        </div>
      </div>

      <FormBasics
        receiptDate={receiptDate}
        setReceiptDate={setReceiptDate}
        note={note}
        setNote={setNote}
        globalDiscountType={globalDiscountType}
        setGlobalDiscountType={setGlobalDiscountType}
        globalDiscountValue={globalDiscountValue}
        setGlobalDiscountValue={setGlobalDiscountValue}
        shippingFee={shippingFee}
        setShippingFee={setShippingFee}
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        renderTotals={<TotalsBar subTotal={Math.max(0, subTotal)} grandTotal={Math.max(0, grandTotal)} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IngredientPicker onAdd={addLine} onOpenAddIngredient={setOpenAddIngredient} />
        <SupplierPicker supplierId={supplierId} setSupplierId={setSupplierId} onOpenAddSupplier={setOpenAddSupplier} />
      </div>

      <LinesTable lines={lines} onUpdateLine={updateLine} onRemoveLine={removeLine} />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setLines([]);
            setGlobalDiscountValue("");
            setShippingFee("");
            setAmountPaid("");
            setNote("");
          }}
        >
          Xoá trắng
        </Button>
      <div className="flex items-center justify-end gap-2">
  <Button variant="outline" onClick={handleSaveDraft} disabled={createDraftMu.isPending}>
    {createDraftMu.isPending ? "Đang lưu nháp..." : "Lưu nháp"}
  </Button>

  <Button onClick={handleComplete} disabled={createFinalMu.isPending}>
    {createFinalMu.isPending ? "Đang lưu..." : "Hoàn thành"}
  </Button>
</div>
      </div>

      {/* Modals */}
      <AddSupplierModal open={openAddSupplier} onOpenChange={setOpenAddSupplier} />
      <AddIngredientModal open={openAddIngredient} onOpenChange={setOpenAddIngredient} />
    </div>
  );
}
