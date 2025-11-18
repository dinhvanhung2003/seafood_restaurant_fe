"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  SalaryType,
  SalaryMeta,
  useSalarySetting,
  useUpsertSalarySetting,
} from "@/hooks/admin/useSalarySetting";

import { BaseSalarySection } from "./BaseSalarySection";
import { BonusSection } from "./BonusSection";
import { AllowanceSection } from "./AllowanceSection";
import { DeductionSection } from "./DeductionSection";

type Props = {
  staffId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// 👇 type local cho 1 dòng giảm trừ trên UI
type DeductionItem = {
  name: string;
  kind: "LATE" | "EARLY" | "FIXED";
  condition: "BY_TIMES" | "BY_BLOCK";
  blockMinutes?: string;        // để rỗng khi không dùng
  amountPerUnit: string;
};

export default function SalarySettingDialog({
  staffId,
  open,
  onOpenChange,
}: Props) {
  const { data, isLoading } = useSalarySetting(staffId);
  const upsertMutation = useUpsertSalarySetting();

  const [salaryType, setSalaryType] = useState<SalaryType | undefined>();
  const [baseAmount, setBaseAmount] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("");

  // ---- meta state (bonus / allowance / deduction) ----
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [bonusRules, setBonusRules] = useState<
    { fromRevenue: string; percent: string }[]
  >([{ fromRevenue: "0", percent: "0" }]);

  const [allowanceEnabled, setAllowanceEnabled] = useState(false);
  const [allowances, setAllowances] = useState<
    { name: string; type: "PER_DAY_FIXED" | "PER_MONTH_FIXED"; amount: string }[]
  >([]);

  const [deductionEnabled, setDeductionEnabled] = useState(false);
  const [deductions, setDeductions] = useState<DeductionItem[]>([]);

  // ---- fill form when open / data loaded ----
  useEffect(() => {
    if (!open || !staffId) return;

    if (data) {
      setSalaryType(data.salaryType);
      setBaseAmount(data.baseAmount ?? "");
      setOvertimeRate(data.overtimeRate ?? "");

      const m: SalaryMeta = data.meta ?? {};

      // thưởng
      setBonusEnabled(!!m.bonusEnabled);
      setBonusRules(
        (m.bonusRules && m.bonusRules.length
          ? m.bonusRules
          : [{ fromRevenue: 0, percent: 0 }]
        ).map((r) => ({
          fromRevenue: String(r.fromRevenue),
          percent: String(r.percent),
        })),
      );

      // phụ cấp
      setAllowanceEnabled(!!m.allowanceEnabled);
      setAllowances(
        (m.allowances ?? []).map((a) => ({
          name: a.name,
          type: a.type,
          amount: String(a.amount),
        })),
      );

      // giảm trừ
      setDeductionEnabled(!!m.deductionEnabled);
      setDeductions(
        (m.deductions ?? []).map((d) => ({
          name: d.name,
          kind: d.kind ?? "LATE",
          condition: d.condition ?? "BY_TIMES",
          blockMinutes:
            d.condition === "BY_BLOCK" && d.blockMinutes != null
              ? String(d.blockMinutes)
              : "",
          amountPerUnit: String(d.amountPerUnit ?? 0),
        })),
      );
    } else {
      setSalaryType(undefined);
      setBaseAmount("");
      setOvertimeRate("");

      setBonusEnabled(false);
      setBonusRules([{ fromRevenue: "0", percent: "0" }]);

      setAllowanceEnabled(false);
      setAllowances([]);

      setDeductionEnabled(false);
      setDeductions([]);
    }
  }, [open, staffId, data]);

  const buildMetaPayload = (): SalaryMeta => {
    const meta: SalaryMeta = {};

    if (bonusEnabled) {
      meta.bonusEnabled = true;
      meta.bonusType = "PERSONAL_REVENUE";
      meta.bonusRules = bonusRules
        .map((r) => ({
          fromRevenue: Number(r.fromRevenue || 0),
          percent: Number(r.percent || 0),
        }))
        .filter((r) => r.fromRevenue >= 0 && r.percent > 0);
    }

    if (allowanceEnabled) {
      meta.allowanceEnabled = true;
      meta.allowances = allowances
        .map((a) => ({
          name: a.name.trim(),
          type: a.type,
          amount: Number(a.amount || 0),
        }))
        .filter((a) => a.name && a.amount > 0);
    }

    if (deductionEnabled) {
      meta.deductionEnabled = true;
      meta.deductions = deductions
        .map((d) => ({
          name: d.name.trim(),
          kind: d.kind,
          condition: d.condition,
          blockMinutes:
            d.condition === "BY_BLOCK"
              ? Number(d.blockMinutes || 0) || 0
              : null,
          amountPerUnit: Number(d.amountPerUnit || 0),
        }))
        .filter((d) => d.name && d.amountPerUnit > 0);
    }

    return meta;
  };

  const handleSave = () => {
    if (!staffId) return;
    if (!salaryType) {
      toast.error("Vui lòng chọn loại lương");
      return;
    }
    if (!baseAmount || Number(baseAmount) <= 0) {
      toast.error("Mức lương phải lớn hơn 0");
      return;
    }

    const meta = buildMetaPayload();

    upsertMutation.mutate(
      {
        staffId,
        salaryType,
        baseAmount,
        overtimeRate: overtimeRate || undefined,
        meta,
      },
      {
        onSuccess() {
          toast.success("Lưu thiết lập lương thành công");
          onOpenChange(false);
        },
        onError(err: any) {
          toast.error(err?.message || "Lưu thiết lập lương thất bại");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw]
          sm:max-w-3xl
          lg:max-w-5xl
          xl:max-w-6xl
          max-h-[90vh]
          overflow-y-auto
        "
      >
        <DialogHeader>
          <DialogTitle>Thiết lập lương</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Đang tải dữ liệu lương...
          </div>
        ) : (
          <div className="space-y-8 pt-2 pb-4">
            <BaseSalarySection
              salaryType={salaryType}
              baseAmount={baseAmount}
              overtimeRate={overtimeRate}
              onSalaryTypeChange={setSalaryType}
              onBaseAmountChange={setBaseAmount}
              onOvertimeChange={setOvertimeRate}
            />

            <BonusSection
              enabled={bonusEnabled}
              rules={bonusRules}
              onEnabledChange={setBonusEnabled}
              onRulesChange={setBonusRules}
            />

            <AllowanceSection
              enabled={allowanceEnabled}
              items={allowances}
              onEnabledChange={setAllowanceEnabled}
              onItemsChange={setAllowances}
            />

            <DeductionSection
              enabled={deductionEnabled}
              items={deductions}
              onEnabledChange={setDeductionEnabled}
              onItemsChange={setDeductions}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={upsertMutation.isPending}
              >
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
