'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { DateRange } from 'react-day-picker';

interface CustomerInvoiceRow {
    invoiceId?: string;
    code?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    occurredAt?: string;
    goodsAmount?: number;
    discount?: number;
    revenue?: number; // goods - discount
    paid?: number;
}

interface CustomerItemRow {
    customerId?: string;
    customerName?: string;
    itemCode?: string;
    itemName?: string;
    soldQty?: number;
    goodsAmount?: number;
    discount?: number;
    netRevenue?: number; // goods - discount
}

export function useCustomerReport() {
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
    const [customerQ, setCustomerQ] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [summary, setSummary] = useState<any | undefined>(undefined);
    const [top10Customers, setTop10Customers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [meta, setMeta] = useState<{ total: number; page: number; limit: number; pages: number } | undefined>(undefined);

    const buildRangeParams = () => {
        if (!date?.from) return null;
        // If only one date picked, treat as single-day range
        const fromDate = new Date(date.from);
        const toDate = date?.to ? new Date(date.to) : new Date(date.from);
        // Ensure from <= to
        let start = fromDate < toDate ? fromDate : toDate;
        let end = fromDate < toDate ? toDate : fromDate;
        // Normalize to local start-of-day for start
        start.setHours(0, 0, 0, 0);
        // Inclusive end date: next day start-of-day
        end.setHours(0, 0, 0, 0);
        const nextDay = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        return {
            dateFrom: start.toISOString(),
            dateTo: nextDay.toISOString(),
        } as { dateFrom: string; dateTo: string };
    };

    const fetchReport = useCallback(async () => {
        const range = buildRangeParams();
        // Avoid calling API while the user is still picking the date
        if (!range) return;
        setLoading(true);
        try {
            const res = await api.get('/report/customer-sales', {
                params: { ...range, customerQ, page, limit },
            });
            const body = res.data as any;
            const payload = body?.data ?? body;
            const list = payload?.rows ?? payload?.data ?? [];
            const arrList = Array.isArray(list) ? list : [];
            const mRaw = body?.meta ?? payload?.meta;
            const hasValidServerMeta = !!(mRaw && Number(mRaw.limit) > 0);
            let m = mRaw as any;
            // If backend meta missing or invalid, build client-side meta & slice
            if (!hasValidServerMeta) {
                const total = arrList.length;
                const pages = Math.max(1, Math.ceil(total / limit));
                const start = (page - 1) * limit;
                const end = start + limit;
                setRows(arrList.slice(start, end));
                m = { total, page, limit, pages };
            } else {
                setRows(arrList);
            }
            setMeta(
                m
                    ? {
                        total: Number(m.total || 0),
                        page: Number(m.page || 1),
                        limit: Number(m.limit || limit),
                        pages: Number(m.pages || Math.ceil((m.total || 0) / (m.limit || limit))),
                    }
                    : undefined
            );
            // Normalize summary for KPI (after meta for invoice count fallback)
            const s = payload?.sum ?? payload?.header ?? payload?.summary;
            const norm = s
                ? {
                    totalCustomers: Number(payload?.customersCount ?? s.totalCustomers ?? s.customers ?? s.totalCustomer ?? 0),
                    totalInvoices: Number(s.totalInvoices ?? s.invoices ?? s.totalInvoice ?? (m?.total ?? (Array.isArray(list) ? list.length : 0))),
                    totalItems: Number(s.totalItems ?? s.items ?? s.totalItem ?? s.itemsCount ?? s.soldQty ?? 0),
                    goodsAmount: Number(s.goodsAmount ?? s.goods ?? 0),
                    discountOrder: Number(s.discountOrder ?? s.invoiceDiscount ?? 0),
                    // optional fields kept for extensibility; may be hidden in UI
                    discountCategory: Number(s.discountCategory ?? 0),
                    discountItem: Number(s.discountItem ?? 0),
                    allocatedDiscount: Number(s.allocatedDiscount ?? s.discount ?? 0),
                    revenue: Number(s.netRevenue ?? s.revenue ?? 0),
                }
                : undefined;
            setSummary(norm);

            // Fetch top 10 customers for chart (only if we have paginated data)
            if (hasValidServerMeta && m?.total > limit) {
                try {
                    const topRes = await api.get('/report/customer-sales', {
                        params: { ...range, customerQ, page: 1, limit: 10 },
                    });
                    const topBody = topRes.data as any;
                    const topPayload = topBody?.data ?? topBody;
                    const topList = topPayload?.rows ?? topPayload?.data ?? [];
                    setTop10Customers(Array.isArray(topList) ? topList.slice(0, 10) : []);
                } catch (err) {
                    console.error('Failed to fetch top 10 customers', err);
                    setTop10Customers(arrList.slice(0, 10)); // fallback to current page
                }
            } else {
                // No pagination or small dataset, use current rows
                setTop10Customers(arrList.slice(0, 10));
            }
        } catch (e) {
            console.error('Fetch customer report failed', e);
            setRows([]);
            setSummary(undefined);
            setMeta(undefined);
            setTop10Customers([]);
        } finally {
            setLoading(false);
        }
    }, [date?.from, date?.to, customerQ, page, limit]);

    // Auto reset to page 1 when filters change (excluding page itself)
    useEffect(() => { setPage(1); }, [date?.from, date?.to, customerQ]);

    // Optional auto fetch debounce
    useEffect(() => {
        const t = setTimeout(() => { fetchReport(); }, 300);
        return () => clearTimeout(t);
    }, [fetchReport]);

    return {
        date, setDate,
        customerQ, setCustomerQ,
        loading,
        rows,
        summary,
        top10Customers,
        page, setPage,
        limit, setLimit,
        meta,
        fetchReport,
    };
}

export default useCustomerReport;
