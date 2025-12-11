// src/hooks/common/useInvoiceSocket.ts
"use client";

import { useEffect, useRef } from "react";
import { getPaymentSocket } from "@/lib/paymentSocket";

import { useQueryClient } from "@tanstack/react-query";

type PaidPayload = {
  invoiceId: string;
  orderId?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  amount?: number;
  method?: string | number;
  paidAt?: string;
};

type PartialPayload = {
  invoiceId: string;
  orderId?: string | null;
  amount: number;
  remaining: number;
};

type ExtraInvalidate = { key: unknown[] };

type Options = {
  onPaid?: (p: PaidPayload) => void;
  onPartial?: (p: PartialPayload) => void;
  extraInvalidate?: ExtraInvalidate[];
};

/**
 * Hook dùng chung Web / Mobile để lắng nghe socket thanh toán của 1 invoice
 */
export function useInvoiceSocket(
  invoiceId: string | null | undefined,
  opts: Options = {}
) {
  const qc = useQueryClient();
  const joined = useRef(false);

  useEffect(() => {
    if (!invoiceId) return;

    const s = getPaymentSocket();
    if (!s) return;

    const join = () => {
      if (!joined.current) {
        s.emit("join_invoice", { invoiceId });
        joined.current = true;
      }
    };

    if (s.connected) join();
    else s.once("connect", join);

    const invalidateAll = () => {
      // invalidate chung cho mọi app (web/mobile)
      qc.invalidateQueries({ queryKey: ["invoice.detail", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices.list"] });
      qc.invalidateQueries({ queryKey: ["active-orders"] });
      qc.invalidateQueries({ queryKey: ["pos-tables"] });

      // cho từng màn tự bơm thêm key
      opts.extraInvalidate?.forEach(({ key }) => {
        qc.invalidateQueries({ queryKey: key });
      });
    };

    const onPaid = (p: PaidPayload) => {
      if (p.invoiceId !== invoiceId) return;
      invalidateAll();
      opts.onPaid?.(p);
    };

    const onPartial = (p: PartialPayload) => {
      if (p.invoiceId !== invoiceId) return;
      invalidateAll();
      opts.onPartial?.(p);
    };

    s.on("invoice.paid", onPaid);
    s.on("invoice.partial", onPartial);

    return () => {
      try {
        s.emit("leave_invoice", { invoiceId });
      } catch {}

      s.off("invoice.paid", onPaid);
      s.off("invoice.partial", onPartial);
      joined.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);
}
