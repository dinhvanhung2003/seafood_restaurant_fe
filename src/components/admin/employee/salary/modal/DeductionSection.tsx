// src/app/(admin)/.../DeductionSection.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DeductionItem = {
  name: string;
  kind: "LATE" | "EARLY" | "FIXED";            // Đi muộn / Về sớm / Cố định
  condition: "BY_TIMES" | "BY_BLOCK";          // Theo số lần / Theo block
  blockMinutes?: string;                       // phút mỗi block (string để bind input)
  amountPerUnit: string;                       // Khoản giảm trừ
};

type Props = {
  enabled: boolean;
  items: DeductionItem[];
  onEnabledChange: (v: boolean) => void;
  onItemsChange: (items: DeductionItem[]) => void;
};

export function DeductionSection({
  enabled,
  items,
  onEnabledChange,
  onItemsChange,
}: Props) {
  const updateItem = (idx: number, patch: Partial<DeductionItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onItemsChange(next);
  };

  const addRow = () => {
    onItemsChange([
      ...items,
      {
        name: "",
        kind: "LATE",
        condition: "BY_TIMES",
        blockMinutes: "",
        amountPerUnit: "0",
      },
    ]);
  };

  const removeRow = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Giảm trừ</div>
          <div className="text-xs text-muted-foreground">
            Thiết lập khoản giảm trừ như đi muộn, về sớm, vi phạm nội quy...
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tắt</span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
          <span className="text-sm font-medium">Bật</span>
        </div>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-[2fr,1.5fr,2.5fr,1.2fr,40px] gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>Tên giảm trừ</div>
              <div>Loại giảm trừ</div>
              <div>Điều kiện</div>
              <div>Khoản giảm trừ</div>
              <div></div>
            </div>

            <div className="divide-y">
              {items.map((d, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2fr,1.5fr,2.5fr,1.2fr,40px] gap-2 px-3 py-2 items-center"
                >
                  {/* Tên giảm trừ */}
                  <Input
                    value={d.name}
                    onChange={(e) =>
                      updateItem(idx, { name: e.target.value })
                    }
                    placeholder="Ví dụ: Đi muộn quá 15 phút"
                  />

                  {/* Loại giảm trừ */}
                  <Select
                    value={d.kind}
                    onValueChange={(v) =>
                      updateItem(idx, { kind: v as DeductionItem["kind"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LATE">Đi muộn</SelectItem>
                      <SelectItem value="EARLY">Về sớm</SelectItem>
                      <SelectItem value="FIXED">Cố định</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Điều kiện */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={d.condition}
                      onValueChange={(v) =>
                        updateItem(idx, {
                          condition: v as DeductionItem["condition"],
                        })
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Điều kiện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BY_TIMES">Theo số lần</SelectItem>
                        <SelectItem value="BY_BLOCK">Theo block</SelectItem>
                      </SelectContent>
                    </Select>

                    {d.condition === "BY_BLOCK" && (
                      <div className="flex items-center gap-1">
                        <Input
                          className="w-[72px]"
                          type="number"
                          min={1}
                          value={d.blockMinutes ?? ""}
                          onChange={(e) =>
                            updateItem(idx, { blockMinutes: e.target.value })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          phút/block
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Khoản giảm trừ */}
                  <Input
                    type="number"
                    min={0}
                    value={d.amountPerUnit}
                    onChange={(e) =>
                      updateItem(idx, { amountPerUnit: e.target.value })
                    }
                  />

                  {/* Xóa */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeRow(idx)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={addRow}>
            + Thêm giảm trừ
          </Button>
        </div>
      )}
    </div>
  );
}
