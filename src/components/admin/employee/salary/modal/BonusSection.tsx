"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Rule = { fromRevenue: string; percent: string };

type Props = {
  enabled: boolean;
  rules: Rule[];
  onEnabledChange: (v: boolean) => void;
  onRulesChange: (rules: Rule[]) => void;
};

export function BonusSection({
  enabled,
  rules,
  onEnabledChange,
  onRulesChange,
}: Props) {
  const updateRule = (idx: number, patch: Partial<Rule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...patch };
    onRulesChange(next);
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Thưởng</div>
          <div className="text-xs text-muted-foreground">
            Thiết lập thưởng theo doanh thu cá nhân
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
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-full md:w-1/3">
              <Label className="text-xs text-muted-foreground">Loại thưởng</Label>
              <Input disabled value="Theo doanh thu cá nhân" />
            </div>
            <div className="w-full md:w-1/3">
              <Label className="text-xs text-muted-foreground">Hình thức</Label>
              <Input disabled value="Tính theo mức tổng doanh thu" />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div>Doanh thu từ</div>
              <div>% Thưởng</div>
            </div>
            <div className="divide-y">
              {rules.map((r, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 gap-2 px-3 py-2 items-center"
                >
                  <Input
                    type="number"
                    min={0}
                    value={r.fromRevenue}
                    onChange={(e) =>
                      updateRule(idx, { fromRevenue: e.target.value })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={r.percent}
                      onChange={(e) => updateRule(idx, { percent: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    {rules.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onRulesChange(rules.filter((_, i) => i !== idx))
                        }
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onRulesChange([...rules, { fromRevenue: "0", percent: "0" }])
            }
          >
            + Thêm mức thưởng
          </Button>
        </div>
      )}
    </div>
  );
}
