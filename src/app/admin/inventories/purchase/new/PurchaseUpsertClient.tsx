"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import mapServerError from "@/lib/mapServerError";
import { currency, asNum, applyGlobalDiscount } from "@/utils/purchase";
import type { DiscountType, Line, NumMaybeEmpty } from "@/types/types";

import FormBasics from "@/components/admin/inventories/purchase/form/FormBasics";
import TotalsBar from "@/components/admin/inventories/purchase/bar/TotalsBar";
import IngredientPicker from "@/components/admin/inventories/purchase/picker/IngredientPicker";
import SupplierPicker from "@/components/admin/inventories/purchase/picker/SupplierPicker";
import LinesTable from "@/components/admin/inventories/purchase/lines/LineTable";

import AddSupplierModal from "@/components/admin/partner/supplier/modal/AddSupplierModal";
import AddIngredientModal from "@/components/admin/inventories/inventory-item/modal/AddIngredientModal";
import {
  usePRCreate,
  usePRCreateDraft,
  usePROne,
  usePRUpdateDraftOrPost,
} from "@/hooks/admin/usePurchase";
import type { PRCreatePayload } from "@/hooks/admin/usePurchase";

export default function PurchaseUpsertClient({
  editingId,
}: {
  editingId?: string;
}) {
  const router = useRouter();
  const isEdit = !!editingId;

  // fetch detail khi sửa (chỉ enable khi có id)
  const { data: detail } = usePROne(isEdit ? editingId : undefined);

  /** ---------- FORM BASICS ---------- */
  const [receiptDate, setReceiptDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [globalDiscountType, setGlobalDiscountType] =
    useState<DiscountType>("AMOUNT");
  const [globalDiscountValue, setGlobalDiscountValue] =
    useState<NumMaybeEmpty>("");
  const [shippingFee, setShippingFee] = useState<NumMaybeEmpty>("");
  const [amountPaid, setAmountPaid] = useState<NumMaybeEmpty>("");
  const [note, setNote] = useState<string>("");
  const setGlobalDiscountValueSafe = (v: NumMaybeEmpty) => {
    if (v === "") return setGlobalDiscountValue("");
    const n = Number(v);
    if (globalDiscountType === "PERCENT") {
      // Phần trăm thì chặn max 100 là đúng
      setGlobalDiscountValue(Math.max(0, Math.min(100, n)));
    } else {
      setGlobalDiscountValue(Math.max(0, n));
    }
  };

  const setShippingFeeSafe = (v: NumMaybeEmpty) => {
    if (v === "") return setShippingFee("");
    const n = Number(v);
    setShippingFee(Math.max(0, n));
  };

  const setAmountPaidSafe = (v: NumMaybeEmpty, curGrand?: number) => {
    if (v === "") return setAmountPaid("");
    const n = Number(v);
    const cap =
      curGrand ??
      (() => {
        const { after } = applyGlobalDiscount(
          subTotal,
          globalDiscountType,
          globalDiscountValue
        );
        return Math.max(0, after + asNum(shippingFee));
      })();
    setAmountPaid(Math.max(0, Math.min(cap, n)));
  };

  /** ---------- LINES ---------- */
  const [lines, setLines] = useState<Line[]>([]);
  const [openAddSupplier, setOpenAddSupplier] = useState(false);
  const [openAddIngredient, setOpenAddIngredient] = useState(false);

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
  const removeLine = (tmpId: string) =>
    setLines((s) => s.filter((l) => l.tmpId !== tmpId));
  const updateLine = (tmpId: string, patch: Partial<Line>) =>
    setLines((s) => s.map((l) => (l.tmpId === tmpId ? { ...l, ...patch } : l)));

  /** ---------- map DETAIL -> FORM khi edit ---------- */
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!detail) return;
    setReceiptDate(detail.receiptDate);
    setGlobalDiscountType(detail.globalDiscountType);
    setGlobalDiscountValue(detail.globalDiscountValue);
    setShippingFee(detail.shippingFee);
    setAmountPaid(detail.amountPaid);
    setNote(detail.note || "");
    setSupplierId(detail.supplier?.id);
    setLines(
      (detail.items || []).map((it: any) => ({
        tmpId: crypto.randomUUID(),
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
        discountType: it.discountType,
        discountValue: String(it.discountValue),
        receivedUomCode: it.receivedUomCode || "",
        lotNumber: it.lotNumber || "",
        expiryDate: it.expiryDate || "",
        note: "",
      }))
    );
  }, [detail]);

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

  const grandTotal = useMemo(() => {
    const { after } = applyGlobalDiscount(
      subTotal,
      globalDiscountType,
      globalDiscountValue
    );
    return Math.max(0, after + asNum(shippingFee));
  }, [subTotal, shippingFee, globalDiscountType, globalDiscountValue]);

  /** ---------- MUTATIONS ---------- */
  const createFinalMu = usePRCreate();
  const createDraftMu = usePRCreateDraft();
  const updateMu = usePRUpdateDraftOrPost();

  /** ---------- PAYLOAD ---------- */
  const buildPayload = (): PRCreatePayload => ({
    supplierId: supplierId!, // đảm bảo đã chọn NCC
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

  /** ---------- ACTIONS ---------- */
  const ensureValid = (isPostNow: boolean) => {
    // 1. Validate Header (Thông tin chung)
    if (!supplierId) return toast.error("Vui lòng chọn nhà cung cấp"), false;
    if (!receiptDate) return toast.error("Vui lòng chọn ngày nhập"), false;
    if (isNaN(Date.parse(receiptDate)))
      return toast.error("Ngày không hợp lệ"), false;

    // Validate Logic Tiền & Chiết khấu
    if (
      globalDiscountType === "AMOUNT" &&
      asNum(globalDiscountValue) > subTotal
    )
      return toast.error("Giảm giá không được lớn hơn tổng tiền hàng"), false;

    if (globalDiscountType === "PERCENT" && asNum(globalDiscountValue) > 100)
      return toast.error("% giảm giá không hợp lệ"), false;

    const paidVal = asNum(amountPaid);
    if (paidVal < 0)
      return toast.error("Số tiền trả không hợp lệ (không được âm)"), false;
    if (paidVal > grandTotal)
      return toast.error("Tiền đã trả không được lớn hơn tổng phải trả"), false;

    // --- [MỚI] CHECK BẮT BUỘC NHẬP TIỀN KHI HOÀN THÀNH ---
    if (isPostNow) {
      if (paidVal <= 0) {
        toast.error("Bắt buộc phải nhập số tiền đã trả khi Hoàn thành phiếu");
        return false;
      }
    }

    // 2. Validate Lines (Danh sách hàng)
    if (lines.length === 0) return toast.error("Chưa có dòng hàng nào"), false;

    // Chuẩn bị ngày nhập để so sánh HSD
    const rDate = new Date(receiptDate);
    rDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const rowIdx = i + 1;

      // --- Check Số lượng ---
      if (
        l.quantity === "" ||
        l.quantity === undefined ||
        l.quantity === null
      ) {
        toast.error(`Dòng ${rowIdx} (${l.itemName}): Vui lòng nhập Số lượng`);
        return false;
      }
      const qty = Number(l.quantity);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Dòng ${rowIdx} (${l.itemName}): Số lượng phải lớn hơn 0`);
        return false;
      }

      // --- Check Đơn giá ---
      if (
        l.unitPrice === "" ||
        l.unitPrice === undefined ||
        l.unitPrice === null
      ) {
        toast.error(`Dòng ${rowIdx} (${l.itemName}): Vui lòng nhập Đơn giá`);
        return false;
      }
      const price = Number(l.unitPrice);
      if (isNaN(price) || price < 0) {
        toast.error(`Dòng ${rowIdx} (${l.itemName}): Đơn giá không hợp lệ`);
        return false;
      }

      // --- Check Chiết khấu dòng ---
      if (l.discountType === "PERCENT" && Number(l.discountValue) > 100) {
        toast.error(`Dòng ${rowIdx} (${l.itemName}): Chiết khấu dòng quá 100%`);
        return false;
      }

      // --- Check Hạn sử dụng ---
      if (!l.expiryDate) {
        toast.error(
          `Dòng ${rowIdx} (${l.itemName}): Vui lòng chọn Hạn sử dụng`
        );
        return false;
      }
      const expDate = new Date(l.expiryDate);
      expDate.setHours(0, 0, 0, 0);

      if (expDate <= rDate) {
        toast.error(
          `Dòng ${rowIdx} (${l.itemName}): HSD phải sau ngày nhập phiếu (${receiptDate})`
        );
        return false;
      }
    }

    return true;
  };

  // Lưu NHÁP
  const handleSaveDraft = () => {
    if (!ensureValid(false)) return;

    if (isEdit) {
      if (detail?.status !== "DRAFT") {
        return toast.error("Chỉ phiếu nháp mới được chỉnh sửa");
      }
      updateMu.mutate(
        { id: editingId!, postNow: false, payload: buildPayload() },
        {
          onSuccess: (res) => {
            toast.success("Đã cập nhật NHÁP", {
              description: res?.code || editingId,
            });
            router.push("/admin/inventories/purchase");
          },
          onError: (e: any) => {
            const { message } = mapServerError(e);
            toast.error(message || "Cập nhật nháp thất bại");
          },
        }
      );
    } else {
      createDraftMu.mutate(buildPayload(), {
        onSuccess: (res) => {
          toast.success("Đã lưu NHÁP", { description: res?.code });
          router.push("/admin/inventories/purchase");
        },
        onError: (e: any) => {
          const { message } = mapServerError(e);
          toast.error(message || "Lưu nháp thất bại");
        },
      });
    }
  };

  // Hoàn thành (POST NOW)
  const handleComplete = () => {
    if (!ensureValid(true)) return;

    if (isEdit) {
      if (detail?.status !== "DRAFT") {
        return toast.error("Chỉ phiếu nháp mới được ghi sổ");
      }
      updateMu.mutate(
        { id: editingId!, postNow: true, payload: buildPayload() },
        {
          onSuccess: (res) => {
            toast.success("Đã ghi sổ phiếu", {
              description: res?.code || editingId,
            });
            router.push("/admin/inventories/purchase");
          },
          onError: (e: any) => {
            const { message } = mapServerError(e);
            toast.error(message || "Ghi sổ thất bại");
          },
        }
      );
    } else {
      createFinalMu.mutate(buildPayload(), {
        onSuccess: (res) => {
          toast.success("Đã tạo phiếu (HOÀN THÀNH)", {
            description: res?.code,
          });
          router.push("/admin/inventories/purchase");
        },
        onError: (e: any) => {
          const { message } = mapServerError(e);
          toast.error(message || "Tạo phiếu thất bại");
        },
      });
    }
  };

  const isNotDraft = isEdit && detail?.status !== "DRAFT";
  const norm = (s?: string) => (s ?? "").trim().toUpperCase();

  const isLotDuplicate = (tmpId: string, lot?: string, uom?: string) => {
    const me = lines.find((x) => x.tmpId === tmpId);
    if (!me) return false;
    const key = (it: {
      itemId: string;
      receivedUomCode?: string;
      lotNumber?: string;
    }) => `${it.itemId}|${norm(it.receivedUomCode)}|${norm(it.lotNumber)}`;
    const myKey = `${me.itemId}|${norm(uom ?? me.receivedUomCode)}|${norm(
      lot ?? me.lotNumber
    )}`;
    if (!norm(lot ?? me.lotNumber)) return false;
    return lines.some((l) => l.tmpId !== tmpId && key(l) === myKey);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEdit
            ? `Sửa phiếu ${detail?.code ? `— ${detail.code}` : ""}`
            : "Tạo phiếu nhập"}
        </h1>
        <div className="text-sm text-muted-foreground">
          Cần trả NCC: <b className="text-black">{currency(grandTotal)}</b>
        </div>
      </div>

      {isNotDraft && (
        <div className="text-sm text-amber-600">
          Phiếu không ở trạng thái NHÁP – chỉ xem, không thể sửa/ghi sổ.
        </div>
      )}

      <FormBasics
        receiptDate={receiptDate}
        setReceiptDate={setReceiptDate}
        note={note}
        setNote={setNote}
        globalDiscountType={globalDiscountType}
        setGlobalDiscountType={setGlobalDiscountType}
        globalDiscountValue={globalDiscountValue}
        setGlobalDiscountValue={setGlobalDiscountValueSafe}
        shippingFee={shippingFee}
        setShippingFee={setShippingFeeSafe}
        amountPaid={amountPaid}
        setAmountPaid={(v) => setAmountPaidSafe(v, grandTotal)}
        grandTotal={grandTotal}
        renderTotals={
          <TotalsBar
            subTotal={Math.max(0, subTotal)}
            grandTotal={Math.max(0, grandTotal)}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IngredientPicker
          supplierId={supplierId}
          onAdd={addLine}
          onOpenAddIngredient={setOpenAddIngredient}
        />
        <SupplierPicker
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          onOpenAddSupplier={setOpenAddSupplier}
        />
      </div>

      <LinesTable
        lines={lines}
        onUpdateLine={updateLine}
        onRemoveLine={removeLine}
        isLotDuplicate={isLotDuplicate}
        receiptDate={receiptDate}
      />

      <div className="flex items-center justify-end gap-2">
        {!isEdit && (
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
        )}

        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isNotDraft || createDraftMu.isPending || updateMu.isPending}
        >
          {isEdit
            ? updateMu.isPending
              ? "Đang lưu nháp…"
              : "Cập nhật nháp"
            : createDraftMu.isPending
            ? "Đang lưu nháp…"
            : "Lưu nháp"}
        </Button>

        <Button
          onClick={handleComplete}
          disabled={isNotDraft || createFinalMu.isPending || updateMu.isPending}
        >
          {isEdit
            ? updateMu.isPending
              ? "Đang ghi sổ…"
              : "Ghi sổ (Hoàn thành)"
            : createFinalMu.isPending
            ? "Đang lưu…"
            : "Hoàn thành"}
        </Button>
      </div>

      <AddSupplierModal
        open={openAddSupplier}
        onOpenChange={setOpenAddSupplier}
      />
      <AddIngredientModal
        open={openAddIngredient}
        onOpenChange={setOpenAddIngredient}
        onSaved={(ing) => {
          // Khi tạo mới thành công, thêm ngay 1 dòng vào bảng hàng
          // ing.unit chứa mã UOM (code) để set default receivedUomCode
          addLine(ing.id, ing.name, ing.unit);
        }}
      />
    </div>
  );
}
