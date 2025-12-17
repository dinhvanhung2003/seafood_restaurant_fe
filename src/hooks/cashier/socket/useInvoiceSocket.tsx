"use client";

import { useEffect, useRef } from "react";
import { getPaymentSocket } from "@/lib/paymentSocket";
import { retainInvoiceRoom } from "@/lib/paymentRooms";
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

export function useInvoiceSocket(
  invoiceId: string | null | undefined,
  opts: Options = {}
) {
  const qc = useQueryClient();
  const releaseRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!invoiceId) return;

    const s = getPaymentSocket();
    if (!s) return;

    // ✅ retain room (ref-count)
    releaseRef.current = retainInvoiceRoom(invoiceId);

    // ✅ HÀM BỊ THIẾU → đây chính là invalidateAll
    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ["invoice.detail", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoices.list"] });
      qc.invalidateQueries({ queryKey: ["active-orders"] });
      qc.invalidateQueries({ queryKey: ["pos-tables"] });

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
      s.off("invoice.paid", onPaid);
      s.off("invoice.partial", onPartial);

      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, [invoiceId]);
}
