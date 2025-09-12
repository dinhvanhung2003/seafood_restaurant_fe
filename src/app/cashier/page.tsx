"use client";
import api from "@/lib/axios";
import React, { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {StatusFilter} from "@/components/cashier/filters/StatusFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, UtensilsCrossed, LayoutGrid, Grid3X3, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ensureSocketReady } from "@/lib/socket";

import { FloorFilter } from "@/components/cashier/filters/FloorFilter";
import { SearchField } from "@/components/cashier/inputs/SearchFiled";
import { TableGrid } from "@/components/cashier/tables/TableGrid";
import { CategoryFilter } from "@/components/cashier/menu/CategoryFilter";
import { MenuGrid } from "@/components/cashier/menu/MenuGrid";
import { OrderList } from "@/components/cashier/order/OrderList";
import CheckoutModal from "@/components/cashier/modals/CheckoutModal";
import type { Catalog as CatalogType, Table as TableType } from "@/types/types";

import { getSocket } from "@/lib/socket";
import { useAreas } from "@/hooks/cashier/useAreas";
import { useMenu } from "@/hooks/cashier/useMenu";
import { useOrders } from "@/hooks/cashier/useOrders";
import { calcOrderTotal, mapAreasToTables, selectMenuItems } from "@/lib/cashier/pos-helpers";

export default function POSPage() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string | undefined;

  // ===== local UI state =====
  const [activeTab, setActiveTab] = useState<"tables" | "menu">("tables");
  const [menuPage, setMenuPage] = useState(1);
  const [menuLimit] = useState(12);
  const [selectedFloor, setSelectedFloor] = useState<string>("Tất cả");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "using" | "empty">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [openMenuOnSelect, setOpenMenuOnSelect] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const enterSearch = () => setIsSearching(true);
  const exitSearch = () => setIsSearching(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notified, setNotified] = useState<Record<string, Record<string, number>>>({});

useEffect(() => {
  (async () => {
    await fetch("/api/socket").catch(() => {}); // khởi tạo server 1 lần
    getSocket(); // mở kết nối client
  })();
}, []);

  // ===== queries =====
  const areasQuery = useAreas(token);
  const menuQuery = useMenu({ page: menuPage, limit: menuLimit, search: menuSearch, categoryId, token });

  // ===== derive =====
  const baseTables: TableType[] = useMemo(() => mapAreasToTables(areasQuery.data ?? []), [areasQuery.data]);
  const menuItems = useMemo(() => selectMenuItems(menuQuery.data?.data), [menuQuery.data]);
  const menuCategories = useMemo(
    () => [{ id: "all", name: "Tất cả" }, ...((menuQuery.data?.data ?? []).reduce((s:any[], r:any) => {
      if (!s.find((x) => x.id === r.category.id)) s.push({ id: r.category.id, name: r.category.name });
      return s;
    }, []))],
    [menuQuery.data],
  );
  const menuCatalog = useMemo(() => ({ categories: menuCategories, items: menuItems }) as unknown as CatalogType, [menuCategories, menuItems]);

  // ===== orders hook (logic gọi API) =====
 const { activeOrdersQuery, orders, orderIds, addOne, changeQty, clear, confirm: confirmOrder, pay,cancel } =
  useOrders({ token, menuItems });



  // ===== table list (view state) =====
  const [tableList, setTableList] = useState<TableType[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

  useEffect(() => {
    const priceDict = new Map(menuItems.map((i) => [i.id, i.price]));
    const totals: Record<string, number> = {};
    for (const [tid, b] of Object.entries(orders)) {
      const items = b.orders[0]?.items ?? [];
      totals[tid] = calcOrderTotal(items, priceDict);
    }
    setTableList(
      baseTables.map((t) => ({
        ...t,
        status: orders[t.id] ? "using" : "empty",
        currentAmount: totals[t.id] ?? 0,
      })),
    );
    setSelectedTable((prev) => prev ?? (baseTables[0] ?? null));
  }, [baseTables, orders, menuItems]);

  // ===== active items & totals =====
  const activeItems = useMemo(() => {
    const tid = selectedTable?.id;
    if (!tid || !orders[tid]) return [];
    const b = orders[tid];
    const cur = b.orders.find((o) => o.id === b.activeId);
    return cur?.items ?? [];
  }, [orders, selectedTable]);

  const orderTotal = useMemo(() => {
    const price = new Map(menuItems.map((i) => [i.id, i.price]));
    return activeItems.reduce((s, it) => s + (price.get(it.id) ?? 0) * it.qty, 0);
  }, [activeItems, menuItems]);

  const counts = useMemo(() => {
    const all = tableList.length;
    const using = tableList.filter((t) => t.status === "using").length;
    const empty = all - using;
    return { all, using, empty };
  }, [tableList]);

  const filteredTables = useMemo(() => {
    return tableList.filter((t) => {
      const byFloor = selectedFloor === "Tất cả" || t.floor === selectedFloor;
      const bySearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
      const byStatus = statusFilter === "all" ? true : statusFilter === "using" ? t.status === "using" : t.status === "empty";
      return byFloor && bySearch && byStatus;
    });
  }, [tableList, selectedFloor, tableSearch, statusFilter]);

  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.toLowerCase();
    return menuItems.filter((m) => (categoryId === "all" || m.categoryId === categoryId) && m.name.toLowerCase().includes(q));
  }, [categoryId, menuSearch, menuItems]);

  // ===== UI handlers (gọi hook actions) =====
  const onAdd = async (menuItemId: string) => {
    if (!selectedTable) return;
    await addOne(selectedTable.id, menuItemId);
  };

  const onChangeQty = async (id: string, delta: number) => {
    if (!selectedTable) return;
    await changeQty(selectedTable.id, id, delta, activeItems);
  };

  const onClear = async () => {
    if (!selectedTable) return;
    await clear(selectedTable.id, activeItems);
  };
// chỉ thông báo 1 lần 
const currentOrderId = selectedTable ? orderIds[selectedTable.id] : undefined;

// snapshot của đơn hiện tại (nếu chưa có thì rỗng)
const notifiedSnapshot = useMemo(
  () => (currentOrderId ? (notified[currentOrderId] ?? {}) : {}),
  [currentOrderId, notified]
);

// các item cần báo (mới hoặc tăng số lượng so với snapshot)
const deltaItems = useMemo(() => {
  if (!currentOrderId) return [];
  return activeItems
    .map((i) => {
      const sent = notifiedSnapshot[i.id] ?? 0;
      const delta = i.qty - sent;
      return { id: i.id, name: menuItems.find((m) => m.id === i.id)?.name, delta };
    })
    .filter((x) => x.delta > 0);
}, [activeItems, notifiedSnapshot, currentOrderId, menuItems]);
  // chỗ onNotify trên POS
// ---- onNotify: gửi theo DELTA ----
const onNotify = async () => {
  if (!selectedTable) return toast.error("Chưa chọn bàn!");
  const orderId = orderIds[selectedTable.id];
  if (!orderId) return toast.error("Chưa có orderId cho bàn này!");

  try {
    // 1) Lấy rows hiện tại (ưu tiên từ state; thiếu rowId thì fallback gọi /orders/:id)
    let rows =
      activeItems
        .filter((i) => !!i.rowId && i.qty > 0)
        .map((i) => ({
          orderItemId: i.rowId!, // quan trọng
          name: menuItems.find((m) => m.id === i.id)?.name ?? "",
          qty: i.qty,            // tổng hiện tại
        }));

    if (rows.length === 0) {
      const r = await api.get(`/orders/${orderId}`);
      const fresh = Array.isArray(r.data?.items) ? r.data.items : [];
      rows = fresh
        .filter((it: any) => ["PENDING", "CONFIRMED"].includes(it.status))
        .map((it: any) => ({
          orderItemId: it.id,
          name: it.menuItem?.name ?? "",
          qty: it.quantity,   // tổng hiện tại
        }));
      if (rows.length === 0) return toast.info("Không có món để báo bếp.");
    }

    // 2) Chuyển sang DELTA (chỉ gửi phần tăng thêm so với snapshot đã gửi)
    const snapshot = notified[orderId] ?? {};
    const lines = rows
      .map((r) => {
        const sent = snapshot[r.orderItemId] ?? 0;
        const delta = r.qty - sent;
        return delta > 0 ? { orderItemId: r.orderItemId, name: r.name, qty: delta } : null;
      })
      .filter(Boolean) as { orderItemId: string; name: string; qty: number }[];

    if (!lines.length) return toast.info("Không có phần tăng thêm để báo bếp.");

    // 3) (tuỳ chọn) soft reconfirm
    await api.patch(`/orders/${orderId}/status`, { status: "CONFIRMED" }).catch(() => {});

    // 4) Phát socket
    const batchId =
      (typeof crypto !== "undefined" && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const s = getSocket();
    s.emit("cashier:notify_items", {
      orderId,
      tableName: selectedTable.name,
      createdAt: new Date().toISOString(),
      batchId,
      items: lines,               // <-- CHỈ DELTA
      staff: "Thu ngân",
      priority: true,
    });

    // 5) Cập nhật snapshot: +delta cho từng item đã gửi
    setNotified((prev) => {
      const cur = { ...(prev[orderId] || {}) };
      for (const ln of lines) cur[ln.orderItemId] = (cur[ln.orderItemId] ?? 0) + ln.qty;
      return { ...prev, [orderId]: cur };
    });

    toast.success("Đã gửi bếp!");
  } catch (e: any) {
    toast.error("Không thể gửi bếp", {
      description: e?.response?.data?.message || e.message,
    });
  }
};




const onCancelOrder = async () => {
  if (!selectedTable) return;
  const ok = confirm('Xác nhận huỷ đơn? Hệ thống sẽ hoàn kho (nếu đã trừ) và huỷ hóa đơn chưa thanh toán.');
  if (!ok) return;
  try {
    await cancel(selectedTable.id);
    toast.success('Đã huỷ đơn');
  } catch (e:any) {
    toast.error('Huỷ đơn thất bại', { description: e?.response?.data?.message || e.message });
  }
};
const hasOrder = !!(selectedTable && orderIds[selectedTable.id]);

  const handleCheckout = () => {
    if (!selectedTable || activeItems.length === 0) return;
    setCheckoutOpen(true);
  };

 // Nhận số tiền thanh toán (nếu modal trả ra), hoặc dùng orderTotal hiện tại
const handleCheckoutSuccess = async () => {
  if (!selectedTable) return;
  await pay(selectedTable.id, orderTotal);  // <-- NEW: tạo invoice + trả tiền mặt
  setCheckoutOpen(false);
};







// chỉ cho bấm khi đơn còn PENDING
// const canNotify = !!currentOrderRow && currentOrderRow.status === "PENDING";
// Nếu vẫn muốn ràng buộc trạng thái, giữ thêm điều kiện PENDING/CONFIRMED tùy bạn:
const currentOrderRow = useMemo(
  () => activeOrdersQuery.data?.find((o: any) => o.id === currentOrderId),
  [activeOrdersQuery.data, currentOrderId]
);

// Ví dụ: chỉ cần có delta là cho bấm (không phụ thuộc status)
const canNotify = !!currentOrderId && deltaItems.length > 0;

// hoặc kết hợp trạng thái:
// const canNotify = !!currentOrderId && deltaItems.length > 0
//   && currentOrderRow && (currentOrderRow.status === "PENDING" || currentOrderRow.status === "CONFIRMED");



  // ===== UI =====
  return (
    <div className="h-[100dvh] w-full text-slate-900 bg-[#0A2B61]">
      <div className="grid h-[calc(100dvh-56px)] grid-cols-1 gap-3 p-3 min-h-0 md:grid-cols-[3fr_2fr]">
        {/* Left */}
        <Card className="bg-white shadow rounded-xl h-full flex flex-col">
          <CardHeader className="pb-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tables" | "menu")}>
              <TabsList className="grid w-full grid-cols-2 md:w-max">
                <TabsTrigger value="tables" className="gap-2 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600">
                  <LayoutGrid className="h-4 w-4" />
                  Phòng bàn
                </TabsTrigger>
                <TabsTrigger value="menu" className="gap-2 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600">
                  <UtensilsCrossed className="h-4 w-4" />
                  Thực đơn
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
            <Tabs value={activeTab} className="flex-1 min-h-0 flex flex-col">
              <TabsContent value="tables" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="space-y-2 pb-3">
                  {!isSearching ? (
                    <>
                      <div className="flex items-center gap-3">
                        <FloorFilter floors={["Tất cả", ...Array.from(new Set((areasQuery.data ?? []).map((a:any)=>a.name)))]}
                          selected={selectedFloor}
                          onSelect={setSelectedFloor}
                        />
                        <div className="ml-auto flex items-center gap-2">
                          <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition" aria-label="Bố cục">
                            <Grid3X3 className="h-4 w-4 text-slate-700" />
                          </button>
                          <button type="button" onClick={enterSearch} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition" aria-label="Tìm kiếm (F3)">
                            <Search className="h-4 w-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={exitSearch} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">…</button>
                      <div className="flex-1">
                        <SearchField
                          placeholder="Tìm theo tên bàn, tên khách hàng, món trong đơn…"
                          value={tableSearch}
                          onChange={setTableSearch}
                          autoFocus
                          onKeyDown={(e) => e.key === "Escape" && exitSearch()}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <TableGrid
                  tables={filteredTables}
                  selectedId={selectedTable?.id}
                  totals={
                    Object.fromEntries(
                      tableList.map((t) => [t.id, t.currentAmount ?? 0]),
                    )
                  }
                  counts={{
                    ...Object.fromEntries(tableList.map((t) => [t.id,
                      (orders[t.id]?.orders[0]?.items ?? []).reduce((s,i)=>s+i.qty,0),
                    ])),
                  }}
                  onSelect={(t) => {
                    setSelectedTable(t);
                    if (openMenuOnSelect) setActiveTab("menu");
                  }}
                />

                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Checkbox id="openMenuOnSelect" checked={openMenuOnSelect} onCheckedChange={(v) => setOpenMenuOnSelect(Boolean(v))} />
                    <label htmlFor="openMenuOnSelect" className="cursor-pointer select-none">Mở thực đơn khi chọn bàn</label>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="menu" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 pb-3">
                  <CategoryFilter categories={menuCategories} selected={categoryId} onSelect={setCategoryId} />
                  <SearchField placeholder="Tìm món (F3)" value={menuSearch} onChange={setMenuSearch} />
                </div>

                <MenuGrid items={filteredMenuItems} onAdd={onAdd} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right: Order Panel */}
        <OrderList
          orderId={currentOrderId}
          table={selectedTable}
          items={activeItems}
          catalog={menuCatalog}
          total={orderTotal}
          onChangeQty={onChangeQty}     // <- BẮT BUỘC truyền prop này
          onClear={onClear}
          orderTabs={
            selectedTable && orders[selectedTable.id]
              ? {
                  activeId: orders[selectedTable.id].activeId,
                  orders: orders[selectedTable.id].orders.map((o) => ({ id: o.id, label: o.label })),
                }
              : { activeId: "", orders: [] }
          }
          onAddOrder={() => {}}
          onSwitchOrder={() => {}}
          onCloseOrder={() => {}}
          onNotify={onNotify}
          onCheckout={handleCheckout}
          onCancelOrder={() => {
  if (!selectedTable) return;
  const ok = window.confirm("Xác nhận huỷ đơn? Hệ thống sẽ hoàn kho và huỷ hoá đơn chưa thanh toán.");
  if (!ok) return;
  cancel(selectedTable.id)
    .then(() => toast.success("Đã huỷ đơn"))
    .catch((e:any) =>
      toast.error("Huỷ đơn thất bại", { description: e?.response?.data?.message || e.message })
    );
}}
canCancel={hasOrder} 
canNotify={canNotify}
        />

        {selectedTable && (
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            table={selectedTable}
            items={activeItems}
            catalog={menuCatalog}
            onSuccess={handleCheckoutSuccess}
            orderId={orderIds[selectedTable.id] ?? null}
          />
        )}
      </div>
    </div>
  );
}
