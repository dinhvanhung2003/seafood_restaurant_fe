"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";

// export type Channel = "ALL" | "DINEIN" | "DELIVERY" | "TAKEAWAY";
export type PaymentMethod = "ALL" | "CASH" | "CARD" | "MOMO" | "BANK";

export interface ClosingRow {
    orderId: string;
    createdAt: string; // ISO
    tableName?: string;
    itemCount: number;
    revenue: number;
    serviceFee?: number;
    tax?: number;
    returnFee?: number;
    paidAmount?: number;
    payMethod?: string;
    invoiceDiscount?: number;
}

export type EodMode = "sales" | "cashbook" | "cancel";

export function useClosingReport() {
    const today = new Date().toISOString().slice(0, 10);
    const [dateFrom, setDateFrom] = useState<string>(today); // yyyy-mm-dd
    const [dateTo, setDateTo] = useState<string>(today);
    //   const [channel, setChannel] = useState<Channel>("ALL");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ALL");

    const [mode, setMode] = useState<EodMode>("sales");
    // New location filters (applies to all modes)
    const [areaId, setAreaId] = useState<string | undefined>(undefined);
    const [tableId, setTableId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<ClosingRow[]>([]);
    const [salesSummary, setSalesSummary] = useState<{ goodsAmount: number; invoiceDiscount: number; revenue: number; otherIncome: number; tax: number; returnFee: number; paid: number; debt: number } | undefined>(undefined);
    const [cashbookSummary, setCashbookSummary] = useState<{ receipt: number; payment: number; totalCount: number } | undefined>(undefined);
    const [cancelSummary, setCancelSummary] = useState<{ cancelQty: number; cancelValue: number; totalCount: number } | undefined>(undefined);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [meta, setMeta] = useState<{ total: number; page: number; limit: number; pages: number } | undefined>(undefined);

    // Reset pagination when filter set changes
    useEffect(() => {
        setPage(1);
    }, [dateFrom, dateTo, mode, paymentMethod, areaId, tableId]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = { dateFrom };
            if (dateTo) params.dateTo = dateTo;
            params.page = String(page);
            params.limit = String(limit);
            // Khu vực / Bàn chỉ áp dụng cho sales & cancel, KHÔNG áp dụng cho cashbook
            if (mode !== "cashbook") {
                if (areaId) params.areaId = areaId;
                if (tableId) params.tableId = tableId;
            }
            let endpoint = "/report/daily-sales";
            if (mode === "cashbook") endpoint = "/report/daily-cashbook";
            if (mode === "cancel") endpoint = "/report/daily-cancel-items";
            if (mode === "sales" && paymentMethod !== "ALL") {
                const apiPayment =
                    (paymentMethod as any) === "BANK" || (paymentMethod as any) === "TRANSFER"
                        ? "VIETQR"
                        : (paymentMethod as any);
                params.paymentMethod = apiPayment;
            }
            const res = await api.get(endpoint, { params });
            const body = res?.data ?? {};
            const payload = body?.data ?? body;
            let list: any[] = [];
            if (Array.isArray(payload.rows)) list = payload.rows;
            else if (Array.isArray(payload.groups)) {
                list = payload.groups.flatMap((g: any) => g?.rows ?? []);
                // summary extraction
                if (mode === "sales") {
                    const sum = payload.groups?.[0]?.sum;
                    if (sum) {
                        setSalesSummary({
                            goodsAmount: Number(sum.goodsAmount ?? 0),
                            invoiceDiscount: Number(sum.invoiceDiscount ?? 0),
                            revenue: Number(sum.revenue ?? 0),
                            otherIncome: Number(sum.otherIncome ?? 0),
                            tax: Number(sum.tax ?? 0),
                            returnFee: Number(sum.returnFee ?? 0),
                            paid: Number(sum.paid ?? 0),
                            debt: Number(sum.debt ?? 0),
                        });
                    } else {
                        setSalesSummary(undefined);
                    }
                } else if (mode === "cancel") {
                    const g0 = payload.groups?.[0];
                    if (g0?.sum) {
                        setCancelSummary({
                            cancelQty: Number(g0.sum.cancelQty ?? 0),
                            cancelValue: Number(g0.sum.cancelValue ?? 0),
                            totalCount: Number(g0.totalCount ?? g0.sum.cancelQty ?? list.length ?? 0),
                        });
                    } else {
                        setCancelSummary(undefined);
                    }
                } else if (mode === 'cashbook') {
                    const g0 = payload.groups?.[0];
                    if (g0?.sum) {
                        setCashbookSummary({
                            receipt: Number(g0.sum.receipt ?? 0),
                            payment: Number(g0.sum.payment ?? 0),
                            totalCount: Number(g0.totalCount ?? list.length ?? 0),
                        });
                    } else {
                        setCashbookSummary(undefined);
                    }
                }
            } else if (Array.isArray(payload.data)) list = payload.data;

            if (mode === "sales") {
                const mapped: ClosingRow[] = list.map((r: any) => ({
                    orderId: r.docCode ?? r.orderId ?? r.order_id ?? r.id ?? "",
                    // Prefer occurredAt; avoid using plain time hh:mm which breaks Date()
                    createdAt: r.occurredAt ?? r.createdAt ?? r.updatedAt ?? new Date().toISOString(),
                    tableName: r.place ?? r.tableName ?? r.table ?? r.table_code ?? undefined,
                    itemCount: Number(r.itemsCount ?? r.itemCount ?? r.items ?? r.qty ?? r.slsp ?? 0),
                    revenue: Number(
                        r.revenue ?? (Number(r.goodsAmount ?? 0) - Number(r.invoiceDiscount ?? 0))
                    ),
                    serviceFee: Number(r.otherIncome ?? r.serviceFee ?? 0),
                    tax: Number(r.tax ?? 0),
                    returnFee: Number(r.returnFee ?? 0),
                    paidAmount: Number(r.paid ?? r.totalPaid ?? 0),
                    payMethod: r.payMethod ?? r.paymentMethod ?? r.payment_method ?? undefined,
                    invoiceDiscount: Number(r.invoiceDiscount ?? 0),
                }));
                setRows(mapped);
            } else if (mode === "cashbook") {
                // Normalize cashbook: compute signed amount and keep helpful fields
                const mapped = list.map((r: any) => {
                    const receipt = r.receipt != null ? parseFloat(String(r.receipt)) : 0;
                    const payment = r.payment != null ? parseFloat(String(r.payment)) : 0;
                    const amount = receipt ? receipt : payment ? -payment : Number(r.amount ?? r.value ?? r.total ?? 0);
                    const partner = r.counterparty ?? "Khách lẻ";
                    return {
                        ...r,
                        amount,
                        tableName: r.tableName ?? r.table ?? undefined,
                        areaName: r.areaName ?? r.area ?? undefined,
                        occurredAt: r.occurredAt ?? r.createdAt ?? undefined,
                        description:
                            r.note ?? r.description ?? r.content ?? [r.cashType, partner].filter(Boolean).join(" - "),
                    };
                });
                setRows(mapped as any);
            } else { // cancel mode raw rows
                const mapped = list.map((r: any) => ({
                    ...r,
                    cancelQty: Number(r.cancelQty ?? r.quantity ?? r.qty ?? 0),
                    cancelValue: Number(r.cancelValue ?? r.amount ?? r.total ?? 0),
                }));
                setRows(mapped as any);
            }
            // meta extraction
            const metaObj = body?.meta;
            if (metaObj && typeof metaObj === 'object') {
                setMeta({
                    total: Number(metaObj.total ?? 0),
                    page: Number(metaObj.page ?? page),
                    limit: Number(metaObj.limit ?? limit),
                    pages: Number(metaObj.pages ?? Math.ceil((metaObj.total ?? 0) / (metaObj.limit || limit))),
                });
            } else {
                setMeta(undefined);
            }
        } catch (e) {
            console.error("Fetch closing report failed", e);
            setRows([]);
            setSalesSummary(undefined);
            setCancelSummary(undefined);
            setCashbookSummary(undefined);
            setMeta(undefined);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, paymentMethod, mode, page, limit, areaId, tableId]);
    //   }, [date, channel, paymentMethod]);

    return {
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        // channel,
        // setChannel,
        paymentMethod,
        setPaymentMethod,
        rows,
        salesSummary,
        cancelSummary,
        cashbookSummary,
        mode,
        setMode,
        loading,
        fetchReport,
        // pagination state
        page,
        setPage,
        limit,
        setLimit,
        meta,
        // location filters
        areaId,
        setAreaId,
        tableId,
        setTableId,
    };
}
