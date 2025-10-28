"use client";

import api from "@/lib/axios";
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";

import { usePosTables } from "@/hooks/cashier/usePosTable";
import { useAreas } from "@/hooks/cashier/useAreas";
import { useMenu } from "@/hooks/cashier/useMenu";
import { useOrders } from "@/hooks/cashier/useOrders";

import { calcOrderTotal, mapAreasToTables, selectMenuItems } from "@/lib/cashier/pos-helpers";
import type { Catalog as CatalogType, Table as TableType } from "@/types/types";
import { useKitchenProgress } from "@/hooks/cashier/useKitchenProgress";
import { useKitchenHistory } from "@/hooks/cashier/useKitchenHistory";
export type CancelTarget = { orderItemId: string; name: string; qty: number };

export function usePosPage() {
  const qc = useQueryClient();

  // ===== local UI state =====
    const [tablePage, setTablePage] = useState(1);
const [tableLimit, setTableLimit] = useState(24);
const [areaId, setAreaId] = useState<string | undefined>(undefined); // chọn theo ID để query BE
    // state filter cho bảng có phân trang 
    

    
  const [localOrderCreatedAt, setLocalOrderCreatedAt] = useState<Record<string, string>>({});
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
  // const [notified, setNotified] = useState<Record<string, Record<string, number>>>({});

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelTargets, setCancelTargets] = useState<CancelTarget[]>([]);
 const [socketReady, setSocketReady] = useState(false);
  const [kitchenOnline, setKitchenOnline] = useState(false);
  useEffect(() => {
  getSocket(); // không fetch /api/socket nữa
}, []);




 useEffect(() => {
    const s = getSocket();
    const onConnect = () => setSocketReady(true);
    const onDisconnect = () => setSocketReady(false);

    // tham gia room 'cashier' để sau này muốn phát riêng cho thu ngân thì tiện
    const join = () => s.emit("room:join", "cashier");
    s.connected ? join() : s.once("connect", join);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    // nhận số lượng bếp online
    const onPresence = (n: number) => setKitchenOnline(n > 0);
    s.on("presence:kitchen", onPresence);

    // hỏi ngay trạng thái hiện diện
    s.emit("presence:who", "kitchen");

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("presence:kitchen", onPresence);
    };
  }, []);


 









  // ===== queries =====
  const areasQuery = useAreas();
   // 🔹 map id -> name để gửi cho BE (DTO đang nhận "area" là tên)
  const areaName = useMemo(() => {
    if (!areaId) return undefined;
    const found = (areasQuery.data ?? []).find((a: any) => a.id === areaId);
    return found?.name;
  }, [areaId, areasQuery.data]);

  // 🔹 gọi hook lấy bàn: gửi "area" = areaName
  const { query: tablesQuery, baseTables, meta: tableMeta } = usePosTables({
    page: tablePage,
    limit: tableLimit,
    area: areaName,                       // ✅ ĐIỂM QUAN TRỌNG
    search: tableSearch || undefined,
    // status: "ACTIVE",                  // tùy bạn có muốn cố định ACTIVE ở BE hay không
  });
  const menuQuery = useMenu({ page: menuPage, limit: menuLimit, search: menuSearch, categoryId });
  // ===== derive menu & categories =====
//   const baseTables: TableType[] = useMemo(
//     () => mapAreasToTables(areasQuery.data ?? []),
//     [areasQuery.data]
//   );

  const menuItems = useMemo(
    () => selectMenuItems(menuQuery.data?.data),
    [menuQuery.data]
  );

  const menuCategories = useMemo(() => {
    const items = menuQuery.data?.data ?? [];
    const map = new Map<string, { id: string; name: string }>();
    for (const r of items) {
      const id = r?.category?.id;
      const name = r?.category?.name;
      if (!id) continue;
      if (!map.has(id)) map.set(id, { id, name: name ?? "" });
    }
    return [{ id: "all", name: "Tất cả" }, ...map.values()];
  }, [menuQuery.data?.data]);

  const menuCatalog = useMemo(
    () => ({ categories: menuCategories, items: menuItems }) as unknown as CatalogType,
    [menuCategories, menuItems]
  );

  // ===== orders hook (BE logic) =====
  const {
    activeOrdersQuery,
    orders,
    orderIds,
    addOne,
    changeQty,
    clear,
    confirm: confirmOrder,
    pay,
    cancel,
  } = useOrders();

  // ===== table list & selected =====
  // const [tableList, setTableList] = useState<TableType[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  // current order info
const currentOrderId = selectedTable ? orderIds[selectedTable.id] : undefined;

// lấy progress từ server cho order hiện tại
const { data: progress = [] } = useKitchenProgress(currentOrderId);

// map: menuItemId -> tổng đã báo bếp (notified từ BE)
const notifiedMap = useMemo(() => {
  const m = new Map<string, number>();
  for (const r of progress) m.set(r.menuItemId, r.notified);
  return m;
}, [progress]);

const tableList = useMemo(() => {
  const price = new Map(menuItems.map(i => [i.id, i.price]));
  const totals: Record<string, number> = {};
  for (const [tid, b] of Object.entries(orders)) {
    const items = b.orders[0]?.items ?? [];
    totals[tid] = calcOrderTotal(items, price);
  }
  return baseTables.map((t: any) => ({
    ...t,
    status: orders[t.id] ? "using" : "empty",
    currentAmount: totals[t.id] ?? 0,
  }));
}, [baseTables, orders, menuItems]);
  // useEffect(() => {
  //   const priceDict = new Map(menuItems.map((i) => [i.id, i.price]));
  //   const totals: Record<string, number> = {};
  //   for (const [tid, b] of Object.entries(orders)) {
  //     const items = b.orders[0]?.items ?? [];
  //     totals[tid] = calcOrderTotal(items, priceDict);
  //   }
  //   setTableList(
  //     baseTables.map((t:any) => ({
  //       ...t,
  //       status: orders[t.id] ? "using" : "empty",
  //       currentAmount: totals[t.id] ?? 0,
  //     }))
  //   );
  //   setSelectedTable((prev) => prev ?? (baseTables[0] ?? null));
  // }, [baseTables, orders, menuItems]);

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

  // counts + filters
  const counts = useMemo(() => {
    const all = tableList.length;
    const using = tableList.filter((t:any) => t.status === "using").length;
    const empty = all - using;
    return { all, using, empty };
  }, [tableList]);

  const filteredTables = useMemo(() => {
    return tableList.filter((t:any) => {
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

  const filteredMenuItems = useMemo(() => {
    const q = menuSearch.toLowerCase();
    return menuItems.filter(
      (m) =>
        (categoryId === "all" || m.categoryId === categoryId) &&
        m.name.toLowerCase().includes(q)
    );
  }, [categoryId, menuSearch, menuItems]);

  // ===== handlers =====
  const onAdd = async (menuItemId: string) => {
    if (!selectedTable) return;
    const hadOrder = !!orderIds[selectedTable.id];
    await addOne(selectedTable.id, menuItemId);
    if (!hadOrder) activeOrdersQuery.refetch?.();
  };

  const onClear = async () => {
    if (!selectedTable) return;
    await clear(selectedTable.id, activeItems);
  };





  
  



const deltaItems = useMemo(() => {
  if (!currentOrderId) return [];
  return activeItems
    .map(i => {
      const sent = notifiedMap.get(i.id) ?? 0;      // i.id = menuItemId
      return { menuItemId: i.id, delta: Math.max(0, i.qty - sent) };
    })
    .filter(d => d.delta > 0);
}, [activeItems, notifiedMap, currentOrderId]);


//  const onNotify = async () => {
//   if (!selectedTable) return toast.error("Chưa chọn bàn!");
//   const orderId = orderIds[selectedTable.id];
//   if (!orderId) return toast.error("Chưa có orderId cho bàn này!");

//   // Tính delta ngay trên FE như bạn đang làm:
//   const deltas = activeItems
//     .map(i => ({ menuItemId: i.id, delta: i.qty - (notifiedSnapshot[i.rowId ?? ""] ?? 0) }))
//     .filter(d => d.delta > 0);

//   if (deltas.length === 0) return toast.info("Không có phần tăng thêm để báo bếp.");

//   try {
//     const res = await api.post(`/orders/${orderId}/notify-items`, {
//       items: deltas,
//       priority: true,
//     });

//     // server đã emit socket cho tất cả client khác.
//     // FE: cập nhật "đã gửi" local để tránh gửi trùng
//     setNotified(prev => {
//       const cur = { ...(prev[orderId] || {}) };
//       for (const ln of res.data.items as Array<{ orderItemId: string; qty: number }>) {
//         cur[ln.orderItemId] = (cur[ln.orderItemId] ?? 0) + ln.qty;
//       }
//       return { ...prev, [orderId]: cur };
//     });

//     toast.success("Đã gửi bếp!");
//   } catch (e: any) {
//     toast.error("Không thể gửi bếp", { description: e?.response?.data?.message || e.message });
//   }
// };


  const onCancelOrder = async () => {
    if (!selectedTable) return;
    const ok = confirm("Xác nhận huỷ đơn? Hệ thống sẽ hoàn kho (nếu đã trừ) và huỷ hóa đơn chưa thanh toán.");
    if (!ok) return;
    try {
      await cancel(selectedTable.id);
      toast.success("Đã huỷ đơn");
    } catch (e: any) {
      toast.error("Huỷ đơn thất bại", { description: e?.response?.data?.message || e.message });
    }
  };

  const handleCheckout = () => {
    if (!selectedTable || activeItems.length === 0) return;
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = async () => {
    if (!selectedTable) return;
    await activeOrdersQuery.refetch();
    setCheckoutOpen(false);
  };

  // tính giờ hiển thị bàn
  const tablesWithStart = useMemo(() => {
    return filteredTables.map((t:any) => {
      const activeId = orderIds[t.id];
      const srv: any = activeOrdersQuery.data?.find((o: any) => o.id === activeId);
      const local = activeId ? localOrderCreatedAt[activeId] : undefined;
      const startedAt: string | undefined = local ?? (srv?.createdAt as string | undefined);
      return { ...t, startedAt };
    });
  }, [filteredTables, orderIds, activeOrdersQuery.data, localOrderCreatedAt]);

  const currentOrderRow = useMemo(
    () => activeOrdersQuery.data?.find((o: any) => o.id === currentOrderId),
    [activeOrdersQuery.data, currentOrderId]
  );

  // const canNotify = !!currentOrderId && deltaItems.length > 0;
  const hasOrder = !!(selectedTable && orderIds[selectedTable.id]);

  // helper
 const wasSentToKitchen = (it: any) =>
  Boolean(it?.batchId) || it?.status !== "PENDING";

  const onChangeQty = async (menuItemId: string, delta: number) => {
    if (!selectedTable) return;
    const it = activeItems.find((x) => x.id === menuItemId);
    const cur = it?.qty ?? 0;
    const next = Math.max(0, cur + delta);

    if (!it) {
      if (delta > 0) await addOne(selectedTable.id, menuItemId);
      return;
    }

    const locked = wasSentToKitchen(it);

    if (locked) {
      if (delta > 0) {
        await addOne(selectedTable.id, menuItemId);
      } else if (delta < 0) {
        setCancelTargets([
          {
            orderItemId: it.rowId!,
            name: menuItems.find((m) => m.id === it.id)?.name ?? "",
            qty: it.qty,
          },
        ]);
        setCancelOpen(true);
      }
      return;
    }

    if (next === 0) {
      await changeQty(selectedTable.id, menuItemId, -cur, activeItems);
      return;
    }
    await changeQty(selectedTable.id, menuItemId, delta, activeItems);
  };

  // confirm huỷ item
 const confirmCancelItems = async (reason: string) => {
  if (!currentOrderId) return;
  try {
    await api.patch(`/orderitems/cancel`, {
      itemIds: cancelTargets.map(t => t.orderItemId),
      reason,
    });
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["active-orders"] }),
      qc.invalidateQueries({ queryKey: ["kitchen-progress", currentOrderId] }),
    ]);
    toast.success("Đã huỷ món");
  } catch (e: any) {
    toast.error("Huỷ món thất bại", { description: e?.response?.data?.message || e.message });
  } finally {
    setCancelOpen(false);
    setCancelTargets([]);
  }
};



  // init socket + local startedAt snapshot
  useEffect(() => {
    for (const [tid, oid] of Object.entries(orderIds)) {
      if (!oid) continue;
      const srv: any = activeOrdersQuery.data?.find((o: any) => o.id === oid);
      const beCreated = srv?.createdAt as string | undefined;
      setLocalOrderCreatedAt((prev) => {
        if (prev[oid]) return prev;
        const now = new Date();
        const tz = -now.getTimezoneOffset();
        const sign = tz >= 0 ? "+" : "-";
        const hh = String(Math.floor(Math.abs(tz) / 60)).padStart(2, "0");
        const mm = String(Math.abs(tz) % 60).padStart(2, "0");
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .replace("Z", `${sign}${hh}:${mm}`);
        return { ...prev, [oid]: beCreated ?? localIso };
      });
    }
  }, [orderIds, activeOrdersQuery.data]);





 // NEW: options cho FloorFilter (render theo id)
  const areaOptions = useMemo(
    () => [
      { id: "all", name: "Tất cả" },
      ...((areasQuery.data ?? []).map((a: any) => ({ id: a.id, name: a.name }))),
    ],
    [areasQuery.data]
  );


const canNotify = !!currentOrderId && deltaItems.length > 0 && socketReady;
const [notifying, setNotifying] = useState(false);

// nếu bạn có hook auth thì lấy tên NV, nếu không dùng fallback
// const { user } = useAuth();  // (nếu có)
const staffName = "Thu ngân";  // fallback

// Nếu bạn muốn cập nhật lịch sử lạc quan:

const { prepend } = useKitchenHistory(); // <-- bổ sung dòng này nếu muốn prepend

 

const onNotify = async () => {
  if (!selectedTable) return toast.error("Chưa chọn bàn!");
  if (!canNotify || notifying) return;

  setNotifying(true);
  try {
    const orderId = currentOrderId; // <-- dùng currentOrderId đã tính sẵn
    if (!orderId) throw new Error("Không có orderId");

    // gọi API CHỈ 1 LẦN
    const res = await api.post(`/kitchen/orders/${orderId}/notify-items`, {
      items: deltaItems,                 // [{ menuItemId, delta }]
      priority: true,
      tableName: selectedTable.name,
    });

    // (tuỳ chọn) cập nhật lịch sử lạc quan để Drawer thấy ngay
    // nếu useKitchenHistory() có expose prepend
    if (prepend) {
      prepend({
        id: res.data.batchId,
        createdAt: res.data.createdAt,     // ISO từ BE
        staff: staffName,
        tableName: selectedTable.name,
        note: null,
        priority: true,
        // nếu BE trả về {items:[{menuItemId, name, qty}]}
        items: (res.data.items || []).map((x: any) => ({
          menuItemId: x.menuItemId ?? x.ticketId, // ưu tiên menuItemId nếu BE trả
          name: x.name ?? "",
          qty: x.qty,
        })),
      });
    }

    // đồng bộ query để F5 vẫn đúng
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["kitchen-progress", orderId] }),
      qc.invalidateQueries({ queryKey: ["kitchen-history", orderId] }), // nếu bạn có query này
    ]);

    toast.success("Đã gửi bếp!");
  } catch (e: any) {
    toast.error("Không thể gửi bếp", {
      description: e?.response?.data?.message || e.message,
    });
  } finally {
    setNotifying(false);
  }
};




  return {
    // ui state
    activeTab, setActiveTab,
    menuPage, setMenuPage,
    menuLimit,
    selectedFloor, setSelectedFloor,
    tableSearch, setTableSearch,
    statusFilter, setStatusFilter,
    categoryId, setCategoryId,
    menuSearch, setMenuSearch,
    openMenuOnSelect, setOpenMenuOnSelect,
    isSearching, enterSearch, exitSearch,

    // data
    areasQuery, menuQuery,
    tableList, selectedTable, setSelectedTable,
    tablesWithStart,
    menuCategories, filteredMenuItems, menuCatalog,
    counts,

    // order-related
    activeItems, orderTotal,
    currentOrderId,
    hasOrder, canNotify,

    // modals
    checkoutOpen, setCheckoutOpen,
    cancelOpen, setCancelOpen,
    cancelTargets, setCancelTargets,

    // handlers
    onAdd, onClear, onChangeQty, onNotify,
    onCancelOrder, handleCheckout, handleCheckoutSuccess,
    confirmCancelItems,


    // export thêm
    orders,
    orderIds,
    activeOrdersQuery,
    areaOptions,


     // expose thêm để page dùng
    // NEW: paging & filter theo khu vực
    areaId, setAreaId,               // chọn khu vực theo id
    tablePage, setTablePage,
    tableLimit, setTableLimit,
    tablesQuery,                     // để kiểm tra isFetching
    tableMeta,       
    
    
    //socket 
    notifying// { page, pages, total, limit }
  };
}
