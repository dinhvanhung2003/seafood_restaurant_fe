"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  LayoutGrid,
  Grid3X3,
  Search,
  CheckCircle2,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

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

/* =========================================================
 * LocalStorage keys + helpers
 * =======================================================*/
const KV_AREAS = "kv.areas"; // từ trang Admin
const KV_TABLES = "kv.tables"; // từ trang Admin
const KV_CATALOG = "kv.catalog"; // {categories, items}

const KV_POS_TABLES = "pos.tables"; // danh sách bàn (đã map cho POS)
const KV_POS_FLOORS = "pos.tables.floors"; // danh sách tầng
const KV_POS_ORDERS = "pos.orders"; // orders theo bàn
const KV_POS_PREFS = "pos.prefs"; // các thiết lập UI
const KV_POS_ACTIVE = "pos.activeTableId"; // id bàn đang active
const KV_RECEIPTS = "receipts"; // biên lai

function safeGet<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.error("[safeGet] parse fail @", k, e);
    return fallback;
  }
}
function safeSet<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(k, JSON.stringify(v));
  } catch {
    // ignore
  }
}

/* =========================================================
 * Admin data -> POS mapping
 * =======================================================*/
type AdminArea = { id: string; name: string };
type AdminTable = { id: string; name: string; areaId: string; order?: number };
type POSTable = TableType & { status: "empty" | "using" };

function buildPosTablesFromAdmin(): { floors: string[]; tables: POSTable[] } {
  const areas = safeGet<AdminArea[]>(KV_AREAS, []);
  const rawTables = safeGet<AdminTable[]>(KV_TABLES, []);
  if (!areas.length || !rawTables.length) return { floors: ["Tất cả"], tables: [] };

  const areaMap = new Map(areas.map((a) => [a.id, a.name]));
  const floorSet = new Set<string>();

  const tables: POSTable[] = rawTables
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "vi"))
    .map((t) => {
      const floor = areaMap.get(t.areaId) || "Khác";
      floorSet.add(floor);
      return { id: t.id, name: t.name, floor, status: "empty" };
    });

  const floors = ["Tất cả", ...Array.from(floorSet).sort((a, b) => a.localeCompare(b, "vi"))];
  return { floors, tables };
}

/* =========================================================
 * Catalog từ localStorage
 * =======================================================*/
type CatalogStore = {
  categories: { id: string; name: string }[];
  items: { id: string; name: string; categoryId: string; price: number }[];
};

/* =========================================================
 * Orders nhiều tab/ bàn
 * =======================================================*/
const uid = () => Math.random().toString(36).slice(2, 9);
type TableOrder = { id: string; label: string; items: OrderItem[] };
type OrdersByTable = Record<string, { activeId: string; orders: TableOrder[] }>;

export default function POSPage() {
  /* Socket (optional) */
  useEffect(() => {
    (async () => {
      try {
        await fetch("/api/socket").catch(() => {});
        const s = getSocket();
        s.on("connect", () => console.log("[socket] connect:", s.id));
        s.on("connect_error", (e) => console.error("[socket] connect_error:", e));
      } catch {}
    })();
  }, []);

  /* ================== STATE (hydrate-safe: init rỗng) ================== */
  const [ready, setReady] = useState(false);

  // Catalog
  const [catalogLS, setCatalogLS] = useState<CatalogStore>({ categories: [], items: [] });

  // Floors & Tables
  const [floorsLS, setFloorsLS] = useState<string[]>([]);
  const [tableList, setTableList] = useState<POSTable[]>([]);

  // Orders
  const [orders, setOrders] = useState<OrdersByTable>({});

  // Preferences
  const [activeTab, setActiveTab] = useState<"tables" | "menu">("tables");
  const [selectedFloor, setSelectedFloor] = useState<string>("Tất cả");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "using" | "empty">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [openMenuOnSelect, setOpenMenuOnSelect] = useState(true);

  // Selected table
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);

  // Search mode
  const [isSearching, setIsSearching] = useState(false);
  const enterSearch = () => setIsSearching(true);
  const exitSearch = () => setIsSearching(false);

  // UI mount flag for hydration-safe controls
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ================== LOAD TỪ localStorage SAU KHI MOUNT ================== */
  useEffect(() => {
    // catalog
    setCatalogLS(safeGet<CatalogStore>(KV_CATALOG, { categories: [], items: [] }));

    // prefs
    const p = safeGet(KV_POS_PREFS, {
      activeTab: "tables",
      selectedFloor: "Tất cả",
      tableSearch: "",
      statusFilter: "all",
      categoryId: "all",
      menuSearch: "",
      openMenuOnSelect: true,
    } as {
      activeTab: "tables" | "menu";
      selectedFloor: string;
      tableSearch: string;
      statusFilter: "all" | "using" | "empty";
      categoryId: string;
      menuSearch: string;
      openMenuOnSelect: boolean;
    });
    setActiveTab(p.activeTab);
    setSelectedFloor(p.selectedFloor);
    setTableSearch(p.tableSearch);
    setStatusFilter(p.statusFilter);
    setCategoryId(p.categoryId);
    setMenuSearch(p.menuSearch);
    setOpenMenuOnSelect(p.openMenuOnSelect);

    // orders
    setOrders(safeGet<OrdersByTable>(KV_POS_ORDERS, {}));

    // floors/tables: ưu tiên cache POS, nếu trống thì rebuild từ Admin
    const cachedFloors = safeGet<string[]>(KV_POS_FLOORS, []);
    const cachedTables = safeGet<POSTable[]>(KV_POS_TABLES, []);
    if (cachedFloors.length && cachedTables.length) {
      setFloorsLS(cachedFloors);
      setTableList(cachedTables);
    } else {
      const r = buildPosTablesFromAdmin(); // đọc KV_AREAS/KV_TABLES
      setFloorsLS(r.floors);
      setTableList(r.tables);
      safeSet(KV_POS_FLOORS, r.floors);
      safeSet(KV_POS_TABLES, r.tables);
      console.log("[POS] rebuilt from Admin:", r);
    }

    // selected table sau khi đã có bảng trong localStorage
    const id = safeGet<string | null>(KV_POS_ACTIVE, null);
    const list = safeGet<POSTable[]>(KV_POS_TABLES, []);
    setSelectedTable(id ? list.find((t) => t.id === id) ?? list[0] ?? null : list[0] ?? null);

    setReady(true);
  }, []);

  /* ================== PERSIST về localStorage ================== */
  useEffect(() => {
    if (ready) safeSet(KV_CATALOG, catalogLS);
  }, [ready, catalogLS]);
  useEffect(() => {
    if (ready) safeSet(KV_POS_TABLES, tableList);
  }, [ready, tableList]);
  useEffect(() => {
    if (ready) safeSet(KV_POS_FLOORS, floorsLS);
  }, [ready, floorsLS]);
  useEffect(() => {
    if (ready) safeSet(KV_POS_ORDERS, orders);
  }, [ready, orders]);
  useEffect(() => {
    if (!ready) return;
    safeSet(KV_POS_PREFS, {
      activeTab,
      selectedFloor,
      tableSearch,
      statusFilter,
      categoryId,
      menuSearch,
      openMenuOnSelect,
    });
  }, [
    ready,
    activeTab,
    selectedFloor,
    tableSearch,
    statusFilter,
    categoryId,
    menuSearch,
    openMenuOnSelect,
  ]);
  useEffect(() => {
    if (ready) safeSet(KV_POS_ACTIVE, selectedTable?.id ?? null);
  }, [ready, selectedTable]);

  // Optional: rebuild một lần nếu trước đó POS chưa có bảng mà Admin vừa lưu xong
  useEffect(() => {
    const { floors, tables } = buildPosTablesFromAdmin();
    if (tables.length && !tableList.length) {
      setFloorsLS(floors);
      setTableList(tables);
      setSelectedTable(tables[0] ?? null);
      safeSet(KV_POS_FLOORS, floors);
      safeSet(KV_POS_TABLES, tables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================== CHECKOUT ================== */
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const handleCheckout = () => {
    if (!selectedTable || activeItems.length === 0) return;
    setCheckoutOpen(true);
  };
  const handleCheckoutSuccess = (r: Receipt) => {
    const arr = safeGet<Receipt[]>(KV_RECEIPTS, []);
    safeSet(KV_RECEIPTS, [r, ...arr]);
    clearOrder();
    if (selectedTable) {
      setTableList((list) =>
        list.map((t) => (t.id === selectedTable.id ? { ...t, status: "empty" } : t))
      );
    }
  };

  /* ================== ORDERS HELPERS ================== */
  const ensureBundle = (next: OrdersByTable, tableId: string) => {
    if (!next[tableId]) {
      const id = uid();
      next[tableId] = { activeId: id, orders: [{ id, label: "1", items: [] }] };
    }
  };

  /* ================== ACTIVE ORDER & TOTAL ================== */
  const activeItems: OrderItem[] = useMemo(() => {
    const tid = selectedTable?.id;
    if (!tid || !orders[tid]) return [];
    const b = orders[tid];
    const cur = b.orders.find((o) => o.id === b.activeId);
    return cur?.items ?? [];
  }, [orders, selectedTable]);

  const orderTotal = useMemo(() => {
    return activeItems.reduce((sum, it) => {
      const item = catalogLS.items.find((m) => m.id === it.id);
      return sum + (item?.price ?? 0) * it.qty;
    }, 0);
  }, [activeItems, catalogLS]);

  /* ================== COUNTS & FILTERS ================== */
  const tableCounts = useMemo(() => {
    const r: Record<string, number> = {};
    for (const [tableId, bundle] of Object.entries(orders)) {
      r[tableId] = bundle.orders.reduce(
        (sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0),
        0
      );
    }
    return r;
  }, [orders]);

  const tableTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const [tableId, bundle] of Object.entries(orders)) {
      totals[tableId] = bundle.orders.reduce((s, o) => {
        return s + o.items.reduce((ss, it) => {
          const item = catalogLS.items.find((m) => m.id === it.id);
          return ss + (item ? item.price * it.qty : 0);
        }, 0);
      }, 0);
    }
    return totals;
  }, [orders, catalogLS]);

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
        statusFilter === "all"
          ? true
          : statusFilter === "using"
          ? t.status === "using"
          : t.status === "empty";
      return byFloor && bySearch && byStatus;
    });
  }, [tableList, selectedFloor, tableSearch, statusFilter]);

  const filteredCatalog = useMemo(() => {
    return catalogLS.items.filter(
      (m) =>
        (categoryId === "all" || m.categoryId === categoryId) &&
        m.name.toLowerCase().includes(menuSearch.toLowerCase())
    );
  }, [catalogLS, categoryId, menuSearch]);

  /* ================== ORDER ACTIONS ================== */
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

      bundle.orders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: newItems } : o));
      next[tid] = { ...bundle };
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

      bundle.orders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: newItems } : o));
      next[tid] = { ...bundle };

      stillHasAfter = bundle.orders.some((o) => o.items.length > 0);
      return next;
    });

    setTableList((list) =>
      list.map((t) => (t.id === tid ? { ...t, status: stillHasAfter ? "using" : "empty" } : t))
    );
  };

  const clearOrder = () => {
    if (!selectedTable) return;
    const tid = selectedTable.id;

    setOrders((prev) => {
      const next: OrdersByTable = { ...prev };
      ensureBundle(next, tid);

      const bundle = next[tid];
      const idx = bundle.orders.findIndex((o) => o.id === bundle.activeId);
      bundle.orders = bundle.orders.map((o, i) => (i === idx ? { ...o, items: [] } : o));
      next[tid] = { ...bundle };
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
        orders: [
          ...bundle.orders.map((o) => ({ ...o, items: [...o.items] })),
          { id: newId, label, items: [] },
        ],
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
      const activeId =
        bundle.activeId === orderId ? remaining[remaining.length - 1].id : bundle.activeId;

      next[tid] = { activeId, orders: remaining.map((o) => ({ ...o, items: [...o.items] })) };
      stillHasAfter = next[tid].orders.some((o) => o.items.length > 0);
      return next;
    });

    setTableList((list) =>
      list.map((t) => (t.id === tid ? { ...t, status: stillHasAfter ? "using" : "empty" } : t))
    );
  };

  // bundle tabs cho OrderList
  const orderTabs = useMemo(() => {
    const tid = selectedTable?.id;
    if (!tid || !orders[tid])
      return { activeId: "", orders: [] as { id: string; label: string }[] };
    return {
      activeId: orders[tid].activeId,
      orders: orders[tid].orders.map((o) => ({ id: o.id, label: o.label })),
    };
  }, [orders, selectedTable]);

  /* ================== GỬI BẾP (socket) ================== */
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
          const item = catalogLS.items.find((m) => m.id === itemId);
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
            () => {
              toast.success("Đã gửi tới bếp", {
                description: "" + item.name,
                duration: 3000,
                icon: <CheckCircle2 className="h-5 w-5 text-white" />,
                style: { background: "#16a34a", color: "#fff", border: "1px solid #15803d" },
                className: "shadow-lg",
              });
            }
          );
        })
      );
    } catch (e) {
      toast.error("Không gửi được đến bếp");
      console.error(e);
    }
  };

  /* ================== Render guard ================== */
  if (!ready) return null;

  /* ================== RENDER ================== */
  return (
    <div className="h-[100dvh] w-full text-slate-900 bg-[#0A2B61]">
      <div className="grid h-[calc(100dvh-56px)] grid-cols-1 gap-3 p-3 min-h-0 md:grid-cols-[3fr_2fr]">
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
              {/* TAB: TABLES */}
              <TabsContent value="tables" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="space-y-2 pb-3">
                  {!isSearching ? (
                    <>
                      <div className="flex items-center gap-3">
                        <FloorFilter
                          floors={floorsLS}
                          selected={selectedFloor}
                          onSelect={(f) => setSelectedFloor(String(f))}
                        />

                        <div className="ml-auto flex items-center gap-2">
                          {/* Nút rebuild từ Admin */}
                          <button
                            type="button"
                            className="px-3 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-sm"
                            onClick={() => {
                              const r = buildPosTablesFromAdmin();
                              setFloorsLS(r.floors);
                              setTableList(r.tables);
                              safeSet(KV_POS_FLOORS, r.floors);
                              safeSet(KV_POS_TABLES, r.tables);
                              setSelectedTable(r.tables[0] ?? null);
                              toast.success("Đã rebuild danh sách bàn từ Admin");
                            }}
                          >
                            Rebuild từ Admin
                          </button>

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
                      <button
                        onClick={exitSearch}
                        className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"
                      >
                        ←
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

              {/* TAB: MENU */}
              <TabsContent value="menu" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 pb-3">
                  <CategoryFilter
                    categories={catalogLS.categories}
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

        {/* Right: Order Panel */}
        <OrderList
          table={selectedTable}
          items={activeItems}
          catalog={catalogLS as unknown as CatalogType}
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
            catalog={catalogLS as unknown as CatalogType}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </div>
    </div>
  );
}
