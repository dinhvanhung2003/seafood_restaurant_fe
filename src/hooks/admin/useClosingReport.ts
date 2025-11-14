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
    // BE default limit 20, set same to avoid client trimming
    const [limit, setLimit] = useState<number>(20);
    const [meta, setMeta] = useState<{ total: number; page: number; limit: number; pages: number } | undefined>(undefined);

    // Reset pagination and clear transient data when filter set changes
    useEffect(() => {
        setPage(1);
        // Clear rows quickly to avoid rendering old-shape rows when switching mode
        setRows([]);
        setSalesSummary(undefined);
        setCashbookSummary(undefined);
        setCancelSummary(undefined);
    }, [dateFrom, dateTo, mode, paymentMethod, areaId, tableId]);

    // Auto refetch when page/limit changes (for server pagination)
    useEffect(() => {
        // Avoid double requests: only trigger when user changes page/limit
        // Other filters already reset page to 1 and user can also hit fetchReport
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        // Abort previous request if any to avoid race when users switch tabs fast
        const controller = new AbortController();
        const signal = controller.signal;
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
            const res = await api.get(endpoint, { params, signal } as any);
            const body = res?.data ?? {};
            const payload = body?.data ?? body;
            let list: any[] = [];
            let hasServerSummary = false; // track if API already returned summary for totals
            if (Array.isArray(payload.rows)) list = payload.rows;
            else if (Array.isArray(payload.groups)) {
                list = payload.groups.flatMap((g: any) => g?.rows ?? []);
                // summary extraction
                if (mode === "sales") {
                    // Prefer top-level summary (grand total for date range) if present
                    const grand = (payload as any)?.summary ?? (payload as any)?.totalSum;
                    if (grand && (grand.goodsAmount != null || grand.revenue != null)) {
                        setSalesSummary({
                            goodsAmount: Number(grand.goodsAmount ?? 0),
                            invoiceDiscount: Number(grand.invoiceDiscount ?? 0),
                            revenue: Number(grand.revenue ?? 0),
                            otherIncome: Number(grand.otherIncome ?? 0),
                            tax: Number(grand.tax ?? 0),
                            returnFee: Number(grand.returnFee ?? 0),
                            paid: Number(grand.paid ?? 0),
                            debt: Number(grand.debt ?? 0),
                        });
                        hasServerSummary = true;
                    } else {
                        // Fallback: use first group's sum (page slice) – not ideal but keeps UI functional
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
                    // 1) Ưu tiên tổng từ payload.summary (tổng toàn bộ theo bộ lọc)
                    const sumAll = (payload as any)?.summary;
                    if (sumAll && (sumAll.totalReceipt != null || sumAll.totalPayment != null)) {
                        setCashbookSummary({
                            // set cả 2 dạng field để component dùng linh hoạt
                            receipt: Number(sumAll.totalReceipt ?? sumAll.receipt ?? 0),
                            payment: Number(sumAll.totalPayment ?? sumAll.payment ?? 0),
                            totalCount: Number(sumAll.voucherCount ?? list.length ?? 0),
                        });
                        hasServerSummary = true;
                    } else {
                        // 2) Fallback: Một số BE có thể trả nhiều group -> cộng dồn các group
                        const groups = Array.isArray(payload.groups) ? payload.groups : [];
                        const aggregate = groups.reduce(
                            (acc: { receipt: number; payment: number; count: number }, g: any) => {
                                if (g?.sum) {
                                    acc.receipt += Number(g.sum.totalReceipt ?? g.sum.receipt ?? 0);
                                    acc.payment += Number(g.sum.totalPayment ?? g.sum.payment ?? 0);
                                    acc.count += Number(g.totalCount ?? g.sum.totalCount ?? 0);
                                }
                                return acc;
                            },
                            { receipt: 0, payment: 0, count: 0 }
                        );
                        if (aggregate.receipt || aggregate.payment || aggregate.count) {
                            setCashbookSummary({
                                receipt: aggregate.receipt,
                                payment: aggregate.payment,
                                totalCount: aggregate.count || list.length,
                            });
                            hasServerSummary = true;
                        } else {
                            // defer summary, will compute below after mapping (and possibly fetch-all)
                            setCashbookSummary(undefined);
                        }
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
                // helper to normalize and summarize cashbook items
                const normalize = (rows: any[]) =>
                    rows.map((r: any) => {
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
                const summarize = (rows: any[]) =>
                    rows.reduce(
                        (acc: { receipt: number; payment: number; totalCount: number }, it: any) => {
                            const amt = Number(it.amount ?? 0);
                            if (amt >= 0) acc.receipt += amt;
                            else acc.payment += -amt;
                            acc.totalCount += 1;
                            return acc;
                        },
                        { receipt: 0, payment: 0, totalCount: 0 }
                    );

                const mapped = normalize(list);
                setRows(mapped as any);

                // If server didn't provide summary, compute across ALL filtered rows (not just current page)
                if (!hasServerSummary) {
                    const metaObj = body?.meta;
                    const total = Number(metaObj?.total ?? mapped.length ?? 0);
                    const hasMore = total > mapped.length;
                    if (hasMore && total <= 5000) {
                        // Fetch once with a big limit to aggregate client-side; guard with upper bound
                        const fullParams = { ...params, page: "1", limit: String(total) } as Record<string, string>;
                        try {
                            const r2 = await api.get(endpoint, { params: fullParams });
                            const b2 = r2?.data ?? {};
                            const p2 = b2?.data ?? b2;
                            let all: any[] = [];
                            if (Array.isArray(p2.rows)) all = p2.rows;
                            else if (Array.isArray(p2.groups)) all = p2.groups.flatMap((g: any) => g?.rows ?? []);
                            else if (Array.isArray(p2.data)) all = p2.data;
                            const mappedAll = normalize(all);
                            const sumAll = summarize(mappedAll);
                            setCashbookSummary(sumAll);
                        } catch (e) {
                            // Fallback to current-page aggregation if fetch-all fails
                            const sumPage = summarize(mapped);
                            setCashbookSummary(sumPage);
                        }
                    } else {
                        const sum = summarize(mapped);
                        setCashbookSummary(sum);
                    }
                }
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
        } catch (e: any) {
            if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") {
                // request aborted -> ignore silently
                return;
            }
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
