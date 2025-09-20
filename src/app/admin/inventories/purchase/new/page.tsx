"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useSuppliers } from "@/hooks/admin/useSupplier";
import AddSupplierModal from "@/components/admin/partner/supplier/modal/AddSupplierModal";
import { useIngredients } from "@/features/admin/inventory/api";
import AddIngredientModal from "@/components/admin/inventories/inventory-item/modal/AddIngredientModal";

/* ---------- Utils ---------- */
type NumMaybeEmpty = number | "";
const asNum = (v: NumMaybeEmpty | undefined) => (v === "" || v == null ? 0 : Number(v));
const currency = (n: number) => n.toLocaleString("vi-VN");

/* ---------- Types ---------- */
type DiscountType = "AMOUNT" | "PERCENT";
type Line = {
  tmpId: string;
  itemId: string;
  itemName: string;
  quantity: NumMaybeEmpty;
  unitPrice: NumMaybeEmpty;
  discountType: DiscountType;
  discountValue: NumMaybeEmpty;
  receivedUnit: string;
  conversionToBase: NumMaybeEmpty;
  lotNumber?: string;
  expiryDate?: string;
  note?: string;
};

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
  const addLine = (id: string, name: string, unit?: string) => {
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
        receivedUnit: unit || "",
        conversionToBase: 1,
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

  const grandTotal = useMemo(() => {
    const gDisc =
      globalDiscountType === "PERCENT"
        ? Math.max(0, Math.min(100, asNum(globalDiscountValue))) * 0.01 * subTotal
        : asNum(globalDiscountValue);
    return Math.max(0, subTotal - gDisc + asNum(shippingFee));
  }, [subTotal, shippingFee, globalDiscountType, globalDiscountValue]);

  /** ---------- SUPPLIERS (RIGHT COLUMN) ---------- */
  const [openAddSupplier, setOpenAddSupplier] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
  const suppliersQuery = useSuppliers(1, 20, { q: supplierSearch as any, status: "ACTIVE" } as any);
  const supplierItems = suppliersQuery.data?.items ?? [];
  const selectedSupplier = useMemo(
    () => supplierItems.find((s) => s.id === supplierId),
    [supplierId, supplierItems]
  );

  /** ---------- INGREDIENTS (LEFT COLUMN) ---------- */
  const ingQuery = useIngredients();
  const [openAddIngredient, setOpenAddIngredient] = useState(false);
  const [ingSearch, setIngSearch] = useState("");
  const ingFiltered = useMemo(() => {
    const q = ingSearch.trim().toLowerCase();
    const src = ingQuery.data ?? [];
    return q ? src.filter((i) => i.name.toLowerCase().includes(q)) : src;
  }, [ingQuery.data, ingSearch]);

  /** ---------- CREATE ---------- */
  const createMu = useMutation({
    mutationFn: async () => {
      if (!supplierId) throw new Error("Vui lòng chọn nhà cung cấp");
      if (!receiptDate) throw new Error("Vui lòng chọn ngày nhập");
      if (lines.length === 0) throw new Error("Chưa có dòng hàng nào");

      const payload = {
        supplierId,
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
          receivedUnit: l.receivedUnit || undefined,
          conversionToBase: asNum(l.conversionToBase) || 1,
          lotNumber: l.lotNumber || undefined,
          expiryDate: l.expiryDate || undefined,
          note: l.note || undefined,
        })),
      };

      const { data } = await api.post("/purchasereceipt/create-purchase-receipt", payload);
      return data as { id: string; code: string };
    },
    onSuccess: (res: any) => {
      toast.success("Đã tạo phiếu nhập", { description: res?.code });
      // reset
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

  /** ---------- UI ---------- */
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tạo phiếu nhập</h1>
        <div className="text-sm text-muted-foreground">
          Cần trả NCC: <b className="text-black">{currency(grandTotal)}</b>
        </div>
      </div>

      {/* Thông tin cơ bản */}
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
                  onChange={(e) => {
                    const v = e.target.value;
                    setGlobalDiscountValue(v === "" ? "" : Number(v));
                  }}
                />
              </div>
            </Field>

            <Field label="Phí vận chuyển">
              <Input
                type="number"
                value={shippingFee === "" ? "" : String(shippingFee)}
                onChange={(e) => {
                  const v = e.target.value;
                  setShippingFee(v === "" ? "" : Number(v));
                }}
              />
            </Field>

            <Field label="Tiền đã trả (tuỳ chọn)">
              <Input
                type="number"
                value={amountPaid === "" ? "" : String(amountPaid)}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmountPaid(v === "" ? "" : Number(v));
                }}
              />
            </Field>

            <div className="flex items-end">
              <div className="text-sm">
                <div>Tổng tiền hàng: <b>{currency(subTotal)}</b></div>
                <div>Cần trả NCC: <b>{currency(grandTotal)}</b></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HAI CỘT: Trái = Nguyên liệu, Phải = Nhà cung cấp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trái: Nguyên liệu */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chọn nguyên liệu</CardTitle>
            <Button variant="outline" onClick={() => setOpenAddIngredient(true)}>+ Thêm nguyên liệu</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nhập để tìm nguyên liệu…"
              value={ingSearch}
              onChange={(e) => setIngSearch(e.target.value)}
            />
            <ScrollArea className="h-[320px] rounded-md border">
              {ingQuery.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
              ) : (
                <ul className="divide-y">
                  {(ingFiltered ?? []).map((it) => (
                    <li key={it.id} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-slate-500">
                          Đơn vị: {it.unit} • Tồn: {it.quantity}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addLine(it.id, it.name, it.unit)}>
                        + Thêm
                      </Button>
                    </li>
                  ))}
                  {ingFiltered.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">Không có kết quả</li>
                  )}
                </ul>
              )}
            </ScrollArea>
            {/* gợi ý nhanh */}
            <div className="text-sm text-slate-600">
              <div className="mb-2 font-medium">Thêm nhanh:</div>
              <div className="flex flex-wrap gap-2">
                {(ingQuery.data ?? []).slice(0, 10).map((it) => (
                  <Badge
                    key={it.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => addLine(it.id, it.name, it.unit)}
                  >
                    + {it.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phải: Nhà cung cấp */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Chọn nhà cung cấp</CardTitle>
            <Button onClick={() => setOpenAddSupplier(true)}>+ Thêm NCC</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Nhập để tìm NCC (tên/SĐT/mã)…"
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setSupplierId(undefined); // đang gõ thì bỏ chọn
              }}
            />
            <div className="text-xs text-slate-500">Gõ để hiển thị kết quả bên dưới</div>

            <ScrollArea className="h-[320px] rounded-md border">
              {suppliersQuery.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">Đang tải…</div>
              ) : (supplierItems.length ?? 0) === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Không có kết quả</div>
              ) : (
                <ul className="divide-y">
                  {supplierItems.map((s) => (
                    <li
                      key={s.id}
                      onClick={() => setSupplierId(s.id)}
                      className={`px-3 py-2 cursor-pointer hover:bg-slate-50 ${
                        supplierId === s.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.phone ?? s.code ?? "-"}</div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            {selectedSupplier ? (
              <div className="text-xs text-slate-600">
                Đã chọn: <b>{selectedSupplier.name}</b>
              </div>
            ) : (
              <div className="text-xs text-amber-700">Chưa chọn NCC</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bảng dòng hàng */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hàng trong phiếu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <table className="min-w-[1320px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th className="w-[220px]">Tên hàng</Th>
                  <Th className="w-[88px]">SL</Th>
                  <Th className="w-[140px]">Đơn giá</Th>
                  <Th className="w-[240px]">CK dòng</Th>
                  <Th className="w-[130px]">Đơn vị nhận</Th>
                  <Th className="w-[110px]">Hệ số</Th>
                  <Th className="w-[140px]">Số lô</Th>
                  <Th className="w-[170px]">HSD</Th>
                  <Th className="w-[160px]">Ghi chú</Th>
                  <Th className="w-[140px] text-right">Thành tiền</Th>
                  <Th className="w-[72px]"></Th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const gross = asNum(l.quantity) * asNum(l.unitPrice);
                  const disc =
                    l.discountType === "PERCENT"
                      ? Math.max(0, Math.min(100, asNum(l.discountValue))) * 0.01 * gross
                      : asNum(l.discountValue);
                  const lineTotal = Math.max(0, gross - disc);

                  return (
                    <tr key={l.tmpId} className="border-t">
                      <Td className="align-middle font-medium">{l.itemName}</Td>

                      {/* SL */}
                      <Td>
                        <Input
                          type="number"
                          value={l.quantity === "" ? "" : String(l.quantity)}
                          onChange={(e) =>
                            updateLine(l.tmpId, { quantity: e.target.value === "" ? "" : Number(e.target.value) })
                          }
                          className="h-9 w-[84px]"
                        />
                      </Td>

                      {/* Đơn giá */}
                      <Td>
                        <Input
                          type="number"
                          value={l.unitPrice === "" ? "" : String(l.unitPrice)}
                          onChange={(e) =>
                            updateLine(l.tmpId, { unitPrice: e.target.value === "" ? "" : Number(e.target.value) })
                          }
                          className="h-9 w-[136px]"
                        />
                      </Td>

                      {/* CK dòng */}
                      <Td>
                        <div className="flex gap-2 items-center">
                          <Select
                            value={l.discountType}
                            onValueChange={(v) => updateLine(l.tmpId, { discountType: v as DiscountType })}
                          >
                            <SelectTrigger className="h-9 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AMOUNT">Số tiền</SelectItem>
                              <SelectItem value="PERCENT">%</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={l.discountValue === "" ? "" : String(l.discountValue)}
                            onChange={(e) =>
                              updateLine(l.tmpId, { discountValue: e.target.value === "" ? "" : Number(e.target.value) })
                            }
                            className="h-9 w-[110px]"
                          />
                        </div>
                      </Td>

                      {/* Đơn vị nhận */}
                      <Td>
                        <Input
                          value={l.receivedUnit}
                          onChange={(e) => updateLine(l.tmpId, { receivedUnit: e.target.value })}
                          placeholder="kg/chai/…"
                          className="h-9 w-[126px]"
                        />
                      </Td>

                      {/* Hệ số */}
                      <Td>
                        <Input
                          type="number"
                          value={l.conversionToBase === "" ? "" : String(l.conversionToBase)}
                          onChange={(e) =>
                            updateLine(l.tmpId, {
                              conversionToBase: e.target.value === "" ? "" : Number(e.target.value),
                            })
                          }
                          className="h-9 w-[106px]"
                        />
                      </Td>

                      {/* Số lô */}
                      <Td>
                        <Input
                          value={l.lotNumber ?? ""}
                          onChange={(e) => updateLine(l.tmpId, { lotNumber: e.target.value })}
                          className="h-9 w-[136px]"
                        />
                      </Td>

                      {/* HSD */}
                      <Td>
                        <Input
                          type="date"
                          value={l.expiryDate ?? ""}
                          onChange={(e) => updateLine(l.tmpId, { expiryDate: e.target.value })}
                          className="h-9 w-[166px]"
                        />
                      </Td>

                      {/* Ghi chú */}
                      <Td>
                        <Input
                          value={l.note ?? ""}
                          onChange={(e) => updateLine(l.tmpId, { note: e.target.value })}
                          className="h-9 w-[156px]"
                        />
                      </Td>

                      {/* Thành tiền */}
                      <Td className="text-right align-middle">{currency(lineTotal)}</Td>

                      {/* Xoá */}
                      <Td className="align-middle">
                        <Button variant="outline" size="sm" onClick={() => removeLine(l.tmpId)} className="h-9">
                          Xoá
                        </Button>
                      </Td>
                    </tr>
                  );
                })}

                {lines.length === 0 && (
                  <tr>
                    <Td colSpan={11} className="py-8 text-center text-slate-500">
                      Chưa có dòng hàng. Thêm ở panel <b>Nguyên liệu</b> bên trái.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
        <Button onClick={() => createMu.mutate()} disabled={createMu.isPending}>
          {createMu.isPending ? "Đang lưu..." : "Lưu phiếu nhập"}
        </Button>
      </div>

      {/* Modals */}
      <AddSupplierModal
        open={openAddSupplier}
        onOpenChange={(v) => {
          setOpenAddSupplier(v);
          if (!v) suppliersQuery.refetch();
        }}
      />
      <AddIngredientModal open={openAddIngredient} onOpenChange={setOpenAddIngredient} />
    </div>
  );
}

/* ---------- Helpers ---------- */
function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}
function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={["px-3 py-2 text-left font-medium", className].filter(Boolean).join(" ")}>{children}</th>;
}
function Td({
  children,
  className,
  colSpan,
}: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return <td className={["px-3 py-2 align-top", className].filter(Boolean).join(" ")} colSpan={colSpan}>{children}</td>;
}
