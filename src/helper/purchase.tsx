"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";

export function Field({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={["space-y-1", className].filter(Boolean).join(" ")}>
      <Label className="text-[13px]">{label}</Label>
      {children}
    </div>
  );
}

export function Th({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <th className={["px-3 py-2 text-left font-medium", className].filter(Boolean).join(" ")}>{children}</th>;
}

export function Td({ children, className, colSpan }: React.PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td className={["px-3 py-2 align-top", className].filter(Boolean).join(" ")} colSpan={colSpan}>
      {children}
    </td>
  );
}
