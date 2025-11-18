"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AllowanceItem = {
  name: string;
  type: "PER_DAY_FIXED" | "PER_MONTH_FIXED";
  amount: string;
};

type Props = {
  enabled: boolean;
  items: AllowanceItem[];
  onEnabledChange: (v: boolean) => void;
  onItemsChange: (items: AllowanceItem[]) => void;
};

export function AllowanceSection({
  enabled,
  items,
  onEnabledChange,
  onItemsChange,
}: Props) {
  const updateItem = (idx: number, patch: Partial<AllowanceItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onItemsChange(next);
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Phụ cấp</div>
          <div className="text-xs text-muted-foreground">
            Thiết lập khoản hỗ trợ như ăn trưa, đi lại, điện thoại...
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
            <div className="grid grid-cols-[2fr,2fr,1fr,40px] gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>Tên phụ cấp</div>
              <div>Loại phụ cấp</div>
              <div>Phụ cấp thụ hưởng</div>
              <div></div>
            </div>
            <div className="divide-y">
              {items.map((a, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[2fr,2fr,1fr,40px] gap-2 px-3 py-2 items-center"
                >
                  <Input
                    value={a.name}
                    onChange={(e) =>
                      updateItem(idx, { name: e.target.value })
                    }
                    placeholder="Ví dụ: Phụ cấp ăn trưa"
                  />

                  <Select
                    value={a.type}
                    onValueChange={(v) =>
                      updateItem(idx, {
                        type: v as "PER_DAY_FIXED" | "PER_MONTH_FIXED",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PER_DAY_FIXED">
                        Phụ cấp cố định theo ngày
                      </SelectItem>
                      <SelectItem value="PER_MONTH_FIXED">
                        Phụ cấp hàng tháng cố định
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min={0}
                    value={a.amount}
                    onChange={(e) =>
                      updateItem(idx, { amount: e.target.value })
                    }
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      onItemsChange(items.filter((_, i) => i !== idx))
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onItemsChange([
                ...items,
                { name: "", type: "PER_DAY_FIXED", amount: "0" },
              ])
            }
          >
            + Thêm phụ cấp
          </Button>
        </div>
      )}
    </div>
  );
}
 