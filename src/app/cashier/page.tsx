"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, UtensilsCrossed, LayoutGrid, Grid3X3, Search, CheckCircle2 } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

import { catalog, floors, tables as seedTables } from "@/data/catalog";
import type { Catalog as CatalogType, OrderItem, Table as TableType } from "@/types/types";

import { FloorFilter } from "@/components/cashier/filters/FloorFilter";
import { SearchField } from "@/components/cashier/inputs/SearchFiled";
import { TableGrid } from "@/components/cashier/tables/TableGrid";
import { CategoryFilter } from "@/components/cashier/menu/CategoryFilter";
import { MenuGrid } from "@/components/cashier/menu/MenuGrid";
import { OrderList } from "@/components/cashier/order/OrderList";
import { StatusFilter } from "@/components/cashier/filters/StatusFilter";
import { Checkbox } from "@/components/ui/checkbox";
import CheckoutModal, { type Receipt } from "@/components/cashier/modals/CheckoutModal";

// ================= helpers =================
const uid = () => Math.random().toString(36).slice(2, 9);
const hasWindow = () => typeof window !== "undefined";

function safeGet<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function safeSet<T>(key: string, val: T) {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// LS keys
const LS = {
  TABLES: "pos.tables",
  ORDERS: "pos.orders", // OrdersByTable
  SELECTED_TABLE_ID: "pos.selectedTableId",
  OPEN_MENU_ON_SELECT: "openMenuOnSelect",
  RECEIPTS: "receipts",
} as const;

// types cho orders
type TableOrder = { id: string; label: string; items: OrderItem[] };
type OrdersByTable = Record<string, { activeId: string; orders: TableOrder[] }>;

export default function POSPage() {
  // socket
  useEffect(() => {
    (async () => {
      await fetch("/api/socket").catch(() => {});
      const s = getSocket();
      s.on("connect", () => console.log("[socket] connect:", s.id));
      s.on("connect_error", (e) => console.error("[socket] connect_error:", e));
    })();
  }, []);

  // ================= state =================
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"tables" | "menu">("tables");

  const [selectedFloor, setSelectedFloor] = useState<typeof floors[number]>("Tất cả");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "using" | "empty">("all");

  const [categoryId, setCategoryId] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");

  // --- tables from localStorage (seed lần đầu bằng seedTables)
  const [tableList, setTableList] = useState<TableType[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

  // persist option
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [openMenuOnSelect, setOpenMenuOnSelect] = useState(false);

  // orders (persist)
  const [orders, setOrders] = useState<OrdersByTable>({});

  // search UI state
  const [isSearching, setIsSearching] = useState(false);
  const enterSearch = () => setIsSearching(true);
  const exitSearch = () => setIsSearching(false);

  // ================= bootstrap from LS =================
  useEffect(() => {
    // tables
    const lsTables = safeGet<TableType[]>(LS.TABLES, []);
    if (lsTables.length === 0) {
      // seed lần đầu
      safeSet(LS.TABLES, seedTables);
      setTableList(seedTables);
    } else {
      setTableList(lsTables);
    }

    // orders
    const lsOrders = safeGet<OrdersByTable>(LS.ORDERS, {});
    setOrders(lsOrders);

    // selected table
    const selId = safeGet<string | null>(LS.SELECTED_TABLE_ID, null);
    if (selId) {
      const found = lsTables.find((t) => t.id === selId) ?? seedTables.find((t) => t.id === selId) ?? null;
      setSelectedTable(found ?? (lsTables[0] ?? seedTables[0] ?? null));
    } else {
      setSelectedTable(lsTables[0] ?? seedTables[0] ?? null);
    }

    // option
    const v = safeGet<boolean | null>(LS.OPEN_MENU_ON_SELECT, null);
    setOpenMenuOnSelect(v === null ? true : v);
  }, []);

  // ================= persist to LS =================
  useEffect(() => {
    if (!mounted) return;
    safeSet(LS.TABLES, tableList);
  }, [mounted, tableList]);

  useEffect(() => {
    if (!mounted) return;
    safeSet(LS.ORDERS, orders);
  }, [mounted, orders]);

  useEffect(() => {
    if (!mounted) return;
    safeSet(LS.SELECTED_TABLE_ID, selectedTable?.id ?? null);
  }, [mounted, selectedTable]);

  useEffect(() => {
    if (!mounted) return;
    safeSet(LS.OPEN_MENU_ON_SELECT, openMenuOnSelect);
  }, [mounted, openMenuOnSelect]);

  // ================= derived =================
  const ensureBundle = (next: OrdersByTable, tableId: string) => {
    if (!next[tableId]) {
      const id = uid();
      next[tableId] = { activeId: id, orders: [{ id, label: "1", items: [] }] };
    }
  };

  const activeItems: OrderItem[] = useMemo(() => {
    const tid = selectedTable?.id;
    if (!tid || !orders[tid]) return [];
    const b = orders[tid];
    const cur = b.orders.find((o) => o.id === b.activeId);
    return cur?.items ?? [];
  }, [orders, selectedTable]);

  const orderTotal = useMemo(() => {
    return activeItems.reduce((sum: number, it) => {
      const item = catalog.items.find((m) => m.id === it.id)!;
      return sum + item.price * it.qty;
    }, 0);
  }, [activeItems]);

  const tableCounts = useMemo(() => {
    const r: Record<string, number> = {};
    for (const [tableId, bundle] of Object.entries(orders)) {
      r[tableId] = bundle.orders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0), 0);
    }
    return r;
  }, [orders]);

  const tableTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [tableId, bundle] of Object.entries(orders)) {
      totals[tableId] = bundle.orders.reduce((s, o) => {
        return s + o.items.reduce((ss, it) => {
          const item = catalog.items.find((m) => m.id === it.id);
          return ss + (item ? item.price * it.qty : 0);
        }, 0);
      }, 0);
    }
    return totals;
  }, [orders]);

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
      const byStatus =
        statusFilter === "all" ? true : statusFilter === "using" ? t.status === "using" : t.status === "empty";
      return byFloor && bySearch && byStatus;
    });
  }, [tableList, selectedFloor, tableSearch, statusFilter]);

  const filteredCatalog = useMemo(() => {
    return catalog.items.filter(
      (m) => (categoryId === "all" || m.categoryId === categoryId) && m.name.toLowerCase().includes(menuSearch.toLowerCase()),
    );
  }, [categoryId, menuSearch]);

  // ================= actions =================
  const addItem = (id: string) => {
    if (!selectedTable) return;
    const tid = selectedTable.id;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];
      const idx = bundle.orders.findIndex((o) => o.id === bundle.activeId);
      const order = bundle.orders[idx];

      const exists = order.items.find((x) => x.id === id);
      const newItems = exists
        ? order.items.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x))
        : [...order.items, { id, qty: 1 }];

      const newOrders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: newItems } : o));
      next[tid] = { ...bundle, orders: newOrders };
      return next;
    });

    setTableList((list) => list.map((t) => (t.id === tid ? { ...t, status: "using" } : t)));
  };

  const changeQty = (id: string, delta: number) => {
    if (!selectedTable) return;
    const tid = selectedTable.id;
    let stillHasAfter = false;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];
      const idx = bundle.orders.findIndex((o) => o.id === bundle.activeId);
      const order = bundle.orders[idx];

      const newItems = order.items
        .map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x))
        .filter((x) => x.qty > 0);

      const newOrders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: newItems } : o));
      next[tid] = { ...bundle, orders: newOrders };

      stillHasAfter = newOrders.some((o) => o.items.length > 0);
      return next;
    });

    setTableList((list) => list.map((t) => (t.id === tid ? { ...t, status: stillHasAfter ? "using" : "empty" } : t)));
  };

  const clearOrder = () => {
    if (!selectedTable) return;
    const tid = selectedTable.id;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];
      const idx = bundle.orders.findIndex((o) => o.id === bundle.activeId);

      const newOrders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: [] } : o));
      next[tid] = { ...bundle, orders: newOrders };
      return next;
    });

    setTableList((list) => list.map((t) => (t.id === tid ? { ...t, status: "empty" } : t)));
  };

  const addOrderTab = () => {
    if (!selectedTable) return;
    const tid = selectedTable.id;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];
      const newId = uid();
      const label = String(bundle.orders.length + 1);

      next[tid] = {
        activeId: newId,
        orders: [...bundle.orders.map((o) => ({ ...o, items: [...o.items] })), { id: newId, label, items: [] }],
      };
      return next;
    });
  };

  const switchOrderTab = (orderId: string) => {
    if (!selectedTable) return;
    const tid = selectedTable.id;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);
      next[tid] = { ...next[tid], activeId: orderId };
      return next;
    });
  };

  const closeOrderTab = (orderId: string) => {
    if (!selectedTable) return;
    const tid = selectedTable.id;
    let stillHasAfter = false;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];

      if (bundle.orders.length === 1) {
        const only = bundle.orders[0];
        next[tid] = { activeId: only.id, orders: [{ ...only, items: [] }] };
        stillHasAfter = false;
        return next;
      }

      const remaining = bundle.orders.filter((o) => o.id !== orderId);
      const activeId = bundle.activeId === orderId ? remaining[remaining.length - 1].id : bundle.activeId;

      next[tid] = { activeId, orders: remaining.map((o) => ({ ...o, items: [...o.items] })) };
      stillHasAfter = next[tid].orders.some((o) => o.items.length > 0);
      return next;
    });

    setTableList((list) => list.map((t) => (t.id === tid ? { ...t, status: stillHasAfter ? "using" : "empty" } : t)));
  };

  const orderTabs = useMemo(() => {
    const tid = selectedTable?.id;
    if (!tid || !orders[tid]) return { activeId: "", orders: [] as { id: string; label: string }[] };
    return {
      activeId: orders[tid].activeId,
      orders: orders[tid].orders.map((o) => ({ id: o.id, label: o.label })),
    };
  }, [orders, selectedTable]);

  // ================= checkout =================
  const handleCheckout = () => {
    if (!selectedTable || activeItems.length === 0) return;
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (r: Receipt) => {
    const arr = safeGet<Receipt[]>(LS.RECEIPTS, []);
    safeSet(LS.RECEIPTS, [r, ...arr]);

    clearOrder();
    if (selectedTable) {
      setTableList((list) => list.map((t) => (t.id === selectedTable.id ? { ...t, status: "empty" } : t)));
    }
  };

  // ================= notify kitchen =================
  const onNotify = async () => {
    if (!selectedTable) {
      toast.error("Chưa chọn bàn!");
      return;
    }
    try {
      const s = await getSocket();

      const activeBundle = orders[selectedTable.id];
      const activeOrderId = activeBundle?.activeId ?? "default";

      await Promise.all(
        activeItems.map(async ({ id: itemId, qty }) => {
          const item = catalog.items.find((m) => m.id === itemId);
          if (!item) return;

          s.emit(
            "cashier:notify_item",
            {
              orderId: `${selectedTable.id}-${activeOrderId}`,
              itemId,
              name: item.name,
              qty,
              tableName: selectedTable.name,
              createdAt: new Date().toLocaleString(),
              staff: "Nguyễn Văn Hưng",
              priority: true,
            },
            (_ack: string) => {
              toast.success("Đã gửi tới bếp", {
                description: item.name,
                duration: 3000,
                icon: <CheckCircle2 className="h-5 w-5 text-white" />,
                style: { background: "#16a34a", color: "#fff", border: "1px solid #15803d" },
                className: "shadow-lg",
              });
            },
          );
        }),
      );
    } catch (e) {
      toast.error("Không gửi được đến bếp");
      console.error(e);
    }
  };

  // ================= UI =================
  return (
    <div className="h-[100dvh] w-full text-slate-900 bg-[#0A2B61]">
      <div
        className="
          grid h-[calc(100dvh-56px)] grid-cols-1 gap-3 p-3 min-h-0
          md:grid-cols-[3fr_2fr]
        "
      >
        {/* Left */}
        <Card className="bg-white shadow rounded-xl h-full flex flex-col">
          <CardHeader className="pb-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tables" | "menu")}>
              <TabsList className="grid w-full grid-cols-2 md:w-max">
                <TabsTrigger
                  value="tables"
                  className="gap-2 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Phòng bàn
                </TabsTrigger>
                <TabsTrigger
                  value="menu"
                  className="gap-2 px-4 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=inactive]:text-slate-600"
                >
                  <UtensilsCrossed className="h-4 w-4" />
                  Thực đơn
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-0 flex-1 min-h-0 flex flex-col">
            <Tabs value={activeTab} className="flex-1 min-h-0 flex flex-col">
              <TabsContent value="tables" className="mt-0 flex-1 min-h-0 flex flex-col">
                {/* FILTER BAR */}
                <div className="space-y-2 pb-3">
                  {!isSearching ? (
                    <>
                      <div className="flex items-center gap-3">
                        <FloorFilter
                          floors={floors}
                          selected={selectedFloor}
                          onSelect={(f) => setSelectedFloor(f as typeof selectedFloor)}
                        />
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                            aria-label="Bố cục"
                          >
                            <Grid3X3 className="h-4 w-4 text-slate-700" />
                          </button>

                          <button
                            type="button"
                            onClick={enterSearch}
                            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                            aria-label="Tìm kiếm (F3)"
                          >
                            <Search className="h-4 w-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <StatusFilter value={statusFilter} onChange={setStatusFilter} counts={counts} />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={exitSearch} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">
                        …
                      </button>
                      <div className="flex-1">
                        <SearchField
                          placeholder="Tìm theo tên bàn, tên khách hàng, món trong đơn…"
                          value={tableSearch}
                          onChange={setTableSearch}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") exitSearch();
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <TableGrid
                  tables={filteredTables}
                  selectedId={selectedTable?.id}
                  totals={tableTotals}
                  counts={tableCounts}
                  onSelect={(t) => {
                    setSelectedTable(t);
                    if (openMenuOnSelect) setActiveTab("menu");
                  }}
                />

                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center gap-2" suppressHydrationWarning>
                    {mounted && (
                      <>
                        <Checkbox
                          id="openMenuOnSelect"
                          checked={openMenuOnSelect}
                          onCheckedChange={(v) => setOpenMenuOnSelect(Boolean(v))}
                        />
                        <label htmlFor="openMenuOnSelect" className="cursor-pointer select-none">
                          Mở thực đơn khi chọn bàn
                        </label>
                      </>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button size="icon" variant="outline">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="menu" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 pb-3">
                  <CategoryFilter
                    categories={catalog.categories}
                    selected={categoryId}
                    onSelect={setCategoryId}
                  />
                  <SearchField placeholder="Tìm món (F3)" value={menuSearch} onChange={setMenuSearch} />
                </div>

                <MenuGrid items={filteredCatalog} onAdd={addItem} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
<Button
  variant="outline"
  className="fixed bottom-4 right-4"
  onClick={() => {
    const tables = JSON.parse(localStorage.getItem("pos.tables") ?? "[]");

    const resetTables = tables.map((t:any) => ({
      ...t,
      status: "empty",
      startedAt: null,
      currentAmount: 0, 
    }));

    localStorage.setItem("pos.tables", JSON.stringify(resetTables));
    localStorage.setItem("pos.orders", "{}");
    localStorage.setItem("pos.selectedTableId", "null");
    location.reload();
  }}
>
  Reset
</Button>


        {/* Right: Order Panel */}
        <OrderList
          table={selectedTable}
          items={activeItems}
          catalog={catalog as CatalogType}
          onChangeQty={changeQty}
          onClear={clearOrder}
          total={orderTotal}
          orderTabs={orderTabs}
          onAddOrder={addOrderTab}
          onSwitchOrder={switchOrderTab}
          onCloseOrder={closeOrderTab}
          onNotify={onNotify}
          onCheckout={handleCheckout}
        />

        {selectedTable && (
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            table={selectedTable}
            items={activeItems}
            catalog={catalog as CatalogType}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </div>
    </div>
  );
}
