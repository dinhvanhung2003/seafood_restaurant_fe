"use client";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useComboDetailQuery,
  useUpdateComboMutation,
  ComboComponent,
} from "@/hooks/admin/useCombo";
import {
  getFriendlyMessageFromError,
  mapBackendCodeToVI,
} from "@/lib/errorMap";
import { toast } from "sonner";
import ComboComponentsBuilder, { ComboRow } from "./ComboComponentsBuilder";

export default function ComboUpdateDialog({
  id,
  open,
  onOpenChange,
  onUpdated,
}: {
  id?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated?: () => void;
}) {
  const detail = useComboDetailQuery(id);
  const update = useUpdateComboMutation();

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [desc, setDesc] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // builder rows
  const [rows, setRows] = useState<ComboRow[]>([]);
  // thành phần luôn hiển thị, có thể chỉnh sửa

  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lockedDueToOpenOrders, setLockedDueToOpenOrders] = useState(false);

  // hydrate từ API
  useEffect(() => {
    if (detail.data) {
      setName(detail.data.name ?? "");
      // Defensive parse: backend may return null/undefined or non-numeric string
      const p = Number(detail.data.price ?? 0);
      setPrice(Number.isFinite(p) ? p : 0);
      setDesc(detail.data.description ?? "");
      setIsAvailable(Boolean(detail.data.isAvailable));
      setRows(
        (detail.data.components || []).map((c: any) => ({
          itemId: c.item.id,
          quantity: Number(c.quantity) || 1,
        }))
      );
      // set preview from existing image when opening
      if (detail.data.image) {
        setImagePreview(detail.data.image);
      } else {
        setImagePreview(null);
      }
      // reset locked state when loading fresh detail
      setLockedDueToOpenOrders(false);
    }
  }, [detail.data]);

  // clean up object URL when a new file is selected or component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch (e) {}
      }
    };
  }, [imagePreview]);

  const validate = () => {
    if (!name.trim()) return "Vui lòng nhập tên combo";
    if (price <= 0) return "Giá combo phải > 0";
    // Always validate components (they're always visible/editable now)
    {
      const ids = rows.map((r) => r.itemId).filter(Boolean) as string[];
      if (ids.length === 0) return "Vui lòng chọn ít nhất 1 món thành phần";
      if (ids.length !== new Set(ids).size)
        return "Danh sách thành phần có món trùng";
      if (rows.some((r) => !r.itemId || !r.quantity || r.quantity <= 0))
        return "Thiếu món hoặc số lượng không hợp lệ";
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Cập nhật combo</DialogTitle>
        </DialogHeader>

        {detail.isLoading || (!detail.data && !detail.error) ? (
          <div className="py-6 text-center">Đang tải…</div>
        ) : detail.error ? (
          <div className="py-6 text-center text-red-500">
            {/* Hiện thông báo lỗi bằng tiếng Việt */}
            {detail.error.message ?? "Không tải được thông tin combo"}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Tên</Label>
              <Input
                disabled={lockedDueToOpenOrders}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label>Giá combo</Label>
              <Input
                disabled={lockedDueToOpenOrders}
                type="number"
                value={Number.isFinite(price) ? price : 0}
                onChange={(e) => {
                  const v = e.target.value;
                  // keep value numeric; empty -> 0
                  const n = v === "" ? 0 : Number(v);
                  setPrice(Number.isFinite(n) ? n : 0);
                }}
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                disabled={lockedDueToOpenOrders}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                disabled={lockedDueToOpenOrders}
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
              <span>Sẵn sàng</span>
            </div>

            {/* Thành phần luôn hiện sẵn để chỉnh sửa */}
            <div>
              {lockedDueToOpenOrders && (
                <div className="p-3 mb-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
                  Combo đang được sử dụng trên đơn hàng đang mở, không thể cập
                  nhật.
                </div>
              )}
              <Label>Thành phần</Label>
              {lockedDueToOpenOrders ? (
                <div className="space-y-2">
                  {(detail.data?.components || []).map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between border rounded-md p-2"
                    >
                      <div className="font-medium">{c.item?.name ?? "—"}</div>
                      <div className="text-sm text-muted-foreground">
                        SL: {Number(c.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ComboComponentsBuilder rows={rows} onChange={setRows} />
              )}
            </div>

            <div>
              <Label>Ảnh (tuỳ chọn)</Label>
              <div className="flex items-start gap-3">
                <Input
                  disabled={lockedDueToOpenOrders}
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (imagePreview && imagePreview.startsWith("blob:")) {
                      try {
                        URL.revokeObjectURL(imagePreview);
                      } catch (e) {}
                    }
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setImagePreview(url);
                    } else if (detail.data?.image) {
                      setImagePreview(detail.data.image);
                    } else {
                      setImagePreview(null);
                    }
                  }}
                />
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    Không có ảnh
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            onClick={() => {
              if (!id) return;
              const err = validate();
              if (err) return alert(err);

              const file = fileRef.current?.files?.[0]; // optional
              const components = rows.map((r) => ({
                itemId: r.itemId!, // đã validate
                quantity: Number(r.quantity),
              }));

              update.mutate(
                {
                  args: { id }, // ✅ path params phải nằm trong args
                  data: {
                    name,
                    comboPrice: price,
                    description: desc,
                    isAvailable,
                    components, // always send updated components
                    image: file, // có thể undefined, ok vì UpdateComboDto là Partial
                  },
                },
                {
                  onSuccess: () => {
                    onUpdated?.();
                    onOpenChange(false);
                  },
                  onError: (e: any) => {
                    const resp = e?.response?.data ?? {};
                    const codeCandidate =
                      resp.errorMessage ?? resp.code ?? resp.message;

                    if (
                      codeCandidate === "COMBO_IN_USE_BY_OPEN_ORDERS" ||
                      resp.code === "COMBO_IN_USE_BY_OPEN_ORDERS" ||
                      resp.errorMessage === "COMBO_IN_USE_BY_OPEN_ORDERS"
                    ) {
                      setLockedDueToOpenOrders(true);
                      const desc =
                        mapBackendCodeToVI("COMBO_IN_USE_BY_OPEN_ORDERS") ||
                        "Combo đang được sử dụng trên đơn hàng đang mở.";
                      toast.error("Không thể cập nhật", { description: desc });
                      return;
                    }

                    const friendly = getFriendlyMessageFromError(e);
                    toast.error("Cập nhật combo thất bại", {
                      description: friendly,
                    });
                  },
                }
              );
            }}
            disabled={
              update.isPending || detail.isLoading || lockedDueToOpenOrders
            }
          >
            {update.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
