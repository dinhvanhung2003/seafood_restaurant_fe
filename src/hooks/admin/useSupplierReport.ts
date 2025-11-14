'use client';

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import api from '@/lib/axios';
import { DateRange } from 'react-day-picker';

// Report modes
export type Mode = 'purchase' | 'return' | 'net';

interface Meta {
    total: number; page: number; limit: number; pages: number;
}

interface SupplierMergeTotals {
    supplierCount?: number;
    // Purchases
    goodsAmount?: number;
    invoiceDiscount?: number;
    netGoods?: number;
    shippingFee?: number;
    totalAmount?: number;
    receiptCount?: number;
    // Returns
    returnQty?: number;          // mapped from returnQtyBase (base unit count)
    returnAmount?: number;       // refund money
    returnCount?: number;        // number of return vouchers
    // Computed
    netAfterReturn?: number;     // totalAmount - returnAmount
    // Items mode extras
    purchaseQty?: number;
    headerDiscount?: number;
    netAmount?: number;          // netGoods - returnAmount/refundAmount
    itemCount?: number;
    refundAmount?: number;       // alias for returnAmount in items endpoint
}

export function useSupplierReport() {
    const [mode, setMode] = useState<Mode>('purchase');
    const [date, setDate] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
    const [supplierQ, setSupplierQ] = useState<string>('');
    const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [limit] = useState(50); // default page size for report endpoints
    const [meta, setMeta] = useState<Meta | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [header, setHeader] = useState<SupplierMergeTotals>({});
    const [topRows, setTopRows] = useState<any[]>([]); // for chart (metric depends on mode)
    const [groups, setGroups] = useState<any[]>([]);   // main grouped dataset for current mode
    const [itemsGroups, setItemsGroups] = useState<any[]>([]); // items grouped dataset for purchase/return modes
    const [itemsHeader, setItemsHeader] = useState<any>({});

    // Sequence guard for race conditions
    const seq = useRef(0);

    // Utility to safely number
    const N = (v: any) => Number(v || 0);

    const fetchCore = useCallback(async (pageArg?: number) => {
        const mySeq = ++seq.current;
        const usePage = pageArg ?? page;
        setLoading(true);
        try {
            setError(null);
            // Common params
            const common: any = {
                page: usePage,
                limit,
            };
            if (date?.from) common.dateFrom = date.from.toISOString();
            if (date?.to) common.dateTo = date.to.toISOString();
            if (supplierQ) common.supplierQ = supplierQ;
            if (supplierId) common.supplierId = supplierId;

            if (mode === 'purchase') {
                const [receiptsRes, itemsRes] = await Promise.all([
                    api.get('/report/purchases/by-supplier', { params: common }),
                    api.get('/report/purchases/by-supplier/items', { params: common }),
                ]);
                if (seq.current !== mySeq) return;
                const receiptsData = receiptsRes.data?.data ?? receiptsRes.data;
                const itemsData = itemsRes.data?.data ?? itemsRes.data;
                setGroups(receiptsData.groups || []);
                setHeader(receiptsData.header || {});
                setMeta(receiptsRes.data?.meta);
                setItemsGroups(itemsData.groups || []);
                setItemsHeader(itemsData.header || {});
                // chart by purchase amount
                const top = (receiptsData.groups || []).map((g: any) => ({
                    supplierId: g.supplierId,
                    name: g.supplierName,
                    purchaseAmount: N(g.totals?.goodsAmount),
                    returnAmount: 0,
                    netAmount: N(g.totals?.goodsAmount),
                })).sort((a: any, b: any) => b.purchaseAmount - a.purchaseAmount);
                setTopRows(top);
            } else if (mode === 'return') {
                const [returnsRes, itemsRes] = await Promise.all([
                    api.get('/report/purchase-returns/by-supplier', { params: common }),
                    api.get('/report/purchase-returns/by-supplier/items', { params: common }),
                ]);
                if (seq.current !== mySeq) return;
                const returnsData = returnsRes.data?.data ?? returnsRes.data;
                const itemsData = itemsRes.data?.data ?? itemsRes.data;
                setGroups(returnsData.groups || []);
                setHeader(returnsData.header || {});
                setMeta(returnsRes.data?.meta);
                setItemsGroups(itemsData.groups || []);
                setItemsHeader(itemsData.header || {});
                // chart by return amount
                const top = (returnsData.groups || []).map((g: any) => ({
                    supplierId: g.supplierId,
                    name: g.supplierName,
                    purchaseAmount: 0,
                    returnAmount: N(g.totals?.returnAmount),
                    netAmount: N(g.totals?.returnAmount),
                })).sort((a: any, b: any) => b.returnAmount - a.returnAmount);
                setTopRows(top);
            } else {
                // net mode
                const res = await api.get('/report/suppliers/top', { params: { ...common, topLimit: 50 } });
                if (seq.current !== mySeq) return;
                const body = res.data?.data ?? res.data;
                setGroups([]);
                setItemsGroups([]);
                setItemsHeader({});
                setHeader(body.header || {});
                setTopRows(body.rows || []);
                setMeta(undefined);
            }
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const msg = err.message || 'Lỗi mạng khi tải báo cáo nhà cung cấp';
                setError(msg);
                console.warn('[SupplierReport]', msg);
            } else {
                setError('Có lỗi xảy ra khi tải báo cáo');
                console.warn('[SupplierReport] unknown error');
            }
        } finally {
            if (seq.current === mySeq) setLoading(false);
        }
    }, [date?.from, date?.to, supplierQ, supplierId, mode, page, limit]);

    const fetchReport = useCallback(() => {
        setPage(1);
        fetchCore(1);
    }, [fetchCore]);

    const goPage = useCallback((p: number) => {
        const next = Math.max(1, p);
        setPage(next);
        fetchCore(next);
    }, [fetchCore]);

    return {
        // filters
        mode, setMode,
        date, setDate,
        supplierQ, setSupplierQ,
        supplierId, setSupplierId,
        // data
        header,
        topRows,
        groups,
        itemsGroups,
        itemsHeader,
        meta,
        // status
        loading,
        error,
        // actions
        fetchReport,
        goPage,
        page,
    };
}
