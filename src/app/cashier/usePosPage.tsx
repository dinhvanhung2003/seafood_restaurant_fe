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

import { selectMenuItems } from "@/lib/cashier/pos-helpers";
import type { Catalog as CatalogType, Table as TableType } from "@/types/types";
import { useKitchenProgress } from "@/hooks/cashier/useKitchenProgress";
import { useKitchenHistory } from "@/hooks/cashier/useKitchenHistory";
export type CancelTarget = { orderItemId: string; name: string; qty: number };

export function usePosPage() {
  const qc = useQueryClient();


  // cờ hiện thông báo bếp
  const [justChanged, setJustChanged] = useState(false);




  // ===== local UI state =====
  const [tablePage, setTablePage] = useState(1);
  const [tableLimit, setTableLimit] = useState(24);
  const [areaId, setAreaId] = useState<string | undefined>(undefined); // chọn theo ID để query BE
  // state filter cho bảng có phân trang 

  const [cancelOneOpen, setCancelOneOpen] = useState(false);
  const [cancelOne, setCancelOne] = useState<CancelTarget | null>(null);

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
  const [socketReady, setSocketReady] = useState(false);
  const [kitchenOnline, setKitchenOnline] = useState(false);
  useEffect(() => {
    getSocket(); // không fetch /api/socket nữa
  }, []);



  // socket
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
    area: areaName,
    search: tableSearch || undefined,
    // status: "ACTIVE",                  // tùy bạn có muốn cố định ACTIVE ở BE hay không
  });

  const menuQuery = useMenu({ page: menuPage, limit: menuLimit, search: menuSearch, categoryId });
  const allCatsQuery = useMenu({
    page: 1,
    limit: 1000,
    search: "",
    categoryId: "all",       // <== quan trọng
  });
  const menuItems = useMemo(
    () => selectMenuItems(menuQuery.data?.data),
    [menuQuery.data]
  );

  const menuCategories = useMemo(() => {
    const items = allCatsQuery.data?.data ?? [];
    const map = new Map<string, { id: string; name: string }>();
    for (const r of items) {
      const id = r?.category?.id;
      const name = r?.category?.name ?? "";
      if (id && !map.has(id)) map.set(id, { id, name });
    }
    return [{ id: "all", name: "Tất cả" }, ...map.values()];
  }, [allCatsQuery.data]);

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
    const priceMap = new Map(menuItems.map(i => [i.id, i.price]));
    const totals: Record<string, number> = {};
    for (const [tid, b] of Object.entries(orders)) {
      const items = b.orders[0]?.items ?? [];
      totals[tid] = items.reduce((s: number, it: any) => {
        const unit = it.price ?? priceMap.get(it.id) ?? 0;
        return s + unit * it.qty;
      }, 0);
    }
    return baseTables.map((t: any) => ({
      ...t,
      status: orders[t.id] ? "using" : "empty",
      currentAmount: totals[t.id] ?? 0,
    }));
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
    const priceMap = new Map(menuItems.map((i) => [i.id, i.price]));
    return activeItems.reduce((s, it) => {
      const unit = (it as any).price ?? priceMap.get(it.id) ?? 0;
      return s + unit * it.qty;
    }, 0);
  }, [activeItems, menuItems]);
  const floorFilteredTables = useMemo(() => {
    if (selectedFloor === "Tất cả") return tableList;
    return tableList.filter((t: any) => t.floor === selectedFloor);
  }, [tableList, selectedFloor]);

  // ---- counts theo khu vực đã chọn ----
  const counts = useMemo(() => {
    const all = floorFilteredTables.length;
    const using = floorFilteredTables.filter((t: any) => t.status === "using").length;
    const empty = all - using;
    return { all, using, empty };
  }, [floorFilteredTables]);

  // ---- danh sách hiển thị: khu vực -> search -> status ----
  const filteredTables = useMemo(() => {
    const byFloor = floorFilteredTables;
    const bySearch = byFloor.filter((t: any) =>
      t.name.toLowerCase().includes(tableSearch.toLowerCase())
    );
    const byStatus =
      statusFilter === "all"
        ? bySearch
        : bySearch.filter((t: any) =>
          statusFilter === "using" ? t.status === "using" : t.status === "empty"
        );
    return byStatus;
  }, [floorFilteredTables, tableSearch, statusFilter]);

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
    setJustChanged(true);
  };

  const onClear = async () => {
    if (!selectedTable) return;
    await clear(selectedTable.id, activeItems);
  };


  const deltaItems = useMemo(() => {
    if (!currentOrderId) return [];
    return activeItems
      .map(i => {
        const sent = notifiedMap.get(i.id) ?? 0;
        return { menuItemId: i.id, delta: Math.max(0, i.qty - sent) };
      })
      .filter(d => d.delta > 0);
  }, [activeItems, notifiedMap, currentOrderId]);


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
    return filteredTables.map((t: any) => {
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
  // tổng đã báo bếp theo menuItemId
  const sentQty = (menuItemId: string) => notifiedMap.get(menuItemId) ?? 0;

  // 1 dòng trên OrderList (gộp) được coi là "đã gửi" nếu có ít nhất 1 phần đã báo
  const wasSentToKitchen = (it: any) => sentQty(it.id) > 0;

  // USINGGGGGGGGGGGGGGGGGGGGGGGGG
  const confirmCancelOne = async ({ qty, reason }: { qty: number; reason: string }) => {
  if (!cancelOne) return;
  try {
    if (qty >= cancelOne.qty) {
      await api.patch(`/orderitems/cancel`, { itemIds: [cancelOne.orderItemId], reason });
    } else {
      await api.patch(`/orderitems/cancel-partial`, {
        itemId: cancelOne.orderItemId,
        qty,
        reason,
      });
    }

    // invalidate tất cả liên quan
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["active-orders"] }),
      qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] }),
    ]);

    toast.success("Đã huỷ món");

    // ✅ refetch lại kitchen-progress để cập nhật notifiedMap
    if (currentOrderId) {
      await qc.invalidateQueries({ queryKey: ["kitchen-progress", currentOrderId] });
    }

    // ✅ bật lại cờ "vừa thay đổi" → nút Báo bếp sáng lại
    setJustChanged(true);

  } catch (e: any) {
    toast.error("Huỷ món thất bại", { description: e?.response?.data?.message || e.message });
  } finally {
    setCancelOneOpen(false);
    setCancelOne(null);
  }
};

  const onChangeQty = async (menuItemId: string, delta: number) => {
    if (!selectedTable) return;

    const it = activeItems.find(x => x.id === menuItemId);
    const cur = it?.qty ?? 0;
    const next = Math.max(0, cur + delta);

    // chưa có dòng -> chỉ cho tăng
    if (!it) {
      if (delta > 0) await addOne(selectedTable.id, menuItemId);
       setJustChanged(true);   
      return;
    }

    const sent = sentQty(menuItemId); // tổng đã báo bếp của món này

    if (delta > 0) {
      // thêm mới luôn là row mới (để lần báo sau vẫn ra batch riêng)
      await addOne(selectedTable.id, menuItemId);
       setJustChanged(true);   
      return;
    }

    // delta < 0: muốn giảm
    if (next >= sent) {
      // còn đủ phần "chưa gửi" để giảm → update qty bình thường
      // (giảm tối đa đến ngưỡng 'sent')
      const reducible = cur - sent;          // phần chưa gửi
      const apply = Math.max(delta, -reducible);
      if (apply !== 0) await changeQty(selectedTable.id, menuItemId, apply, activeItems);
       setJustChanged(true);   
      return;
    }

    // next < sent ⇒ phải hủy phần đã gửi
    const needCancel = sent - next; // số lượng tối thiểu cần hủy
    setCancelOne({
      orderItemId: it.rowId!,
      name: menuItems.find(m => m.id === it.id)?.name ?? "",
      qty: sent, // ✅ cho phép chọn tới toàn bộ phần đã báo bếp
    });
    setCancelOneOpen(true);
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


  const onDelete = (it: any) => {
    const sent = sentQty(it.id);
    if (sent === 0) {
      changeQty(selectedTable!.id, it.id, -it.qty, activeItems);
    } else {
      setCancelOne({ orderItemId: it.rowId!, name: it.name, qty: it.qty });
      setCancelOne({ orderItemId: it.rowId!, name: it.name, qty: sent });
      setCancelOneOpen(true);
    }
  };




  // NEW: options cho FloorFilter (render theo id)
  const areaOptions = useMemo(
    () => [
      { id: "all", name: "Tất cả" },
      ...((areasQuery.data ?? []).map((a: any) => ({ id: a.id, name: a.name }))),
    ],
    [areasQuery.data]
  );


 const canNotify = !!currentOrderId && socketReady && (deltaItems.length > 0 || justChanged);

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
      setJustChanged(false);
    } catch (e: any) {
      toast.error("Không thể gửi bếp", {
        description: e?.response?.data?.message || e.message,
      });
    } finally {
      setNotifying(false);
    }
  };

useEffect(() => {
  if (!justChanged) return;
  if (deltaItems.length > 0) return; // còn delta thật, giữ nút sáng
  // không còn delta hoặc snapshot đã cập nhật -> tắt cờ
  setJustChanged(false);
}, [JSON.stringify(deltaItems), justChanged]);
  // trong usePosPage()
  useEffect(() => {
    const s = getSocket();

    const hit = (orderId?: string) => {
      qc.invalidateQueries({ queryKey: ["active-orders"] });
      if (orderId && orderId === currentOrderId) {
        qc.invalidateQueries({ queryKey: ["kitchen-progress", orderId] });
        qc.invalidateQueries({ queryKey: ["kitchen-history", orderId] });
      }
    };

    const onChanged = (p: { orderId: string; tableId: string; reason: string }) => hit(p.orderId);
    const onMerged = (_: { toOrderId: string; fromOrderId: string }) => hit(currentOrderId);
    const onSplit = (_: { toOrderId: string; fromOrderId: string }) => hit(currentOrderId);

    s.on("orders:changed", onChanged);
    s.on("orders:merged", onMerged);
    s.on("orders:split", onSplit);
    s.on("kitchen:new_batch", (payload) => {
      // ví dụ:
      qc.invalidateQueries({ queryKey: ["kitchen-history", payload.orderId] });
      qc.invalidateQueries({ queryKey: ["kitchen-progress", payload.orderId] });
      qc.invalidateQueries({ queryKey: ["active-orders"] });
    });
    return () => {
      s.off("orders:changed", onChanged);
      s.off("orders:merged", onMerged);
      s.off("orders:split", onSplit);
    };
  }, [qc, currentOrderId]);

  // dọn side effect
  // reset khi chuyển order khác hoặc vừa notify xong
  useEffect(() => { setJustChanged(false); }, [currentOrderId]);

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


    // handlers
    onAdd, onClear, onChangeQty, onNotify,
    onCancelOrder, handleCheckout, handleCheckoutSuccess,
    // confirmCancelItems,


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

    confirmCancelOne,
    cancelOne, setCancelOne,
    cancelOneOpen, setCancelOneOpen,
    //socket 
    notifying,

    onDelete,




    justChanged,
  };
}
