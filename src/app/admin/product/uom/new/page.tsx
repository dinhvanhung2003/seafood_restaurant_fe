"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUomMutation } from "@/hooks/admin/useUnitsOfMeasure";
import type { CreateUomPayload } from "@/types/admin/product/uom";
import { useAppToast } from "@/lib/toast";
import { ArrowLeft, Save } from "lucide-react";

const DIMENSIONS = [
  { value: "count", label: "Số lượng (count)" },
  { value: "mass", label: "Khối lượng (mass)" },
  { value: "volume", label: "Thể tích (volume)" },
] as const;

export default function CreateUomPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [form, setForm] = useState<CreateUomPayload>({
    code: "",
    name: "",
    dimension: "count",
  });
  const [submitting, setSubmitting] = useState(false);

  const createMut = useCreateUomMutation({
    onSuccess: () => {
      toast.success("Đã tạo đơn vị tính");
      router.push("/admin/product/uom");
    },
    onError: (e) => toast.error("Tạo thất bại", (e as Error)?.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    createMut.mutate(form, {
      onSettled: () => setSubmitting(false),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
        <h1 className="text-2xl font-semibold">Thêm đơn vị tính</h1>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Mã đơn vị</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                placeholder="VD: G, KG, CAN"
                required
              />
            </div>
            <div>
              <Label>Tên đơn vị</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="VD: Gram, Kilogram, Lon"
                required
              />
            </div>
          </div>

          <div className="sm:w-1/2">
            <Label>Quy cách đo</Label>
            <Select
              value={form.dimension}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, dimension: v as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIMENSIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={submitting}>
              <Save className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
