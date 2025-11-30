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
import { useKitchenVoids } from "@/hooks/cashier/socket/useKitchenVoids";
import { useMutation } from "@tanstack/react-query";
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
  // useCancelSocketLive(currentOrderId);

useEffect(() => {
  const s = getSocket();

  const onVoidSynced = async (p: {
    orderId: string;
    menuItemId: string;
    qty: number;
    reason?: string;
    ticketId?: string;
    by?: string;
  }) => {
    // luôn sync lại danh sách đơn đang mở ở thu ngân
    await activeOrdersQuery.refetch();

    // nếu không phải order đang xem thì thôi, khỏi toast / refetch thêm
    if (!currentOrderId || p.orderId !== currentOrderId) return;

    const who =
      p.by === "kitchen"
        ? "Bếp"
        : p.by === "cashier"
        ? "Thu ngân"
        : "Hệ thống";

    // (nếu muốn đẹp hơn thì map menuItemId -> name, tạm để vậy cũng được)
    toast.error(`🍳 ${who} đã hủy ${p.qty} phần món ${p.menuItemId}`, {
      description: p.reason,
    });

    // refetch lại progress + history của đúng order đang mở
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["kitchen-progress", p.orderId] }),
      qc.invalidateQueries({ queryKey: ["kitchen-history", p.orderId] }),
    ]);

    // huỷ từ bếp thì không coi là "justChanged" nữa → không bật nút Thông báo
    setJustChanged(false);
  };

  s.on("kitchen:void_synced", onVoidSynced);
  return () => {
    s.off("kitchen:void_synced", onVoidSynced);
  };
}, [currentOrderId, qc, activeOrdersQuery]);



    // Nghe bếp hủy món cho đúng order đang mở
  const { kitchenVoids, clearKitchenVoid, clearAllKitchenVoids } = useKitchenVoids(currentOrderId);
  // lấy progress từ server cho order hiện tại
const { data: progress = [] } = useKitchenProgress(currentOrderId);

// tổng đã báo bếp (mọi trạng thái: PENDING + CONFIRMED + PREPARING + READY + SERVED)

const notifiedMap = useMemo(() => {
  const m = new Map<string, number>();
  for (const r of progress as any[]) {
    const prev = m.get(r.menuItemId) ?? 0;
    m.set(r.menuItemId, prev + (Number(r.notified) || 0));
  }
  return m;
}, [progress]);

const cancellableMap = useMemo(() => {
  const m = new Map<string, number>();
  for (const r of progress as any[]) {
    const notified  = Number(r.notified)  || 0;
    const preparing = Number(r.preparing) || 0;
    const ready     = Number(r.ready)     || 0;
    const served    = Number(r.served)    || 0;

    const cancelable = Math.max(0, notified - preparing - ready - served);
    const prev = m.get(r.menuItemId) ?? 0;
    m.set(r.menuItemId, prev + cancelable);
  }
  return m;
}, [progress]);

const sentQty = (menuItemId: string) => notifiedMap.get(menuItemId) ?? 0;
const cancellableQty = (menuItemId: string) => cancellableMap.get(menuItemId) ?? 0;

// 2) log tách riêng
useEffect(() => {
  console.log("progress raw =", progress);
  console.log("notifiedMap =", Object.fromEntries(notifiedMap));
  console.log("cancellableMap =", Object.fromEntries(cancellableMap));
}, [progress, notifiedMap, cancellableMap]);

// 1 dòng coi là "đã gửi" nếu còn phần có thể huỷ
const wasSentToKitchen = (it: any) => cancellableQty(it.id) > 0;


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

const [priorityNext, setPriorityNext] = useState(false);
  const deltaItems = useMemo(() => {
  if (!currentOrderId) return [];
  return activeItems
    .map((i) => {
      const sent = sentQty(i.id); // dùng helper
      return { menuItemId: i.id, delta: Math.max(0, i.qty - sent) };
    })
    .filter((d) => d.delta > 0);
}, [activeItems, currentOrderId, progress]);

const hasUnsentItems = useMemo(
  () => deltaItems.length > 0,
  [deltaItems]
);

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


  const guestCount = currentOrderRow?.guestCount ?? 0;
const customer =
  currentOrderRow?.customer
    ? {
        id: currentOrderRow.customer.id,
        name: currentOrderRow.customer.name,
        phone: currentOrderRow.customer.phone ?? null,
      }
    : null;

// hàm update meta order (giống mobile)
const updateOrderMeta = async (body: { guestCount?: number; customerId?: string | null }) => {
  if (!currentOrderId) return;
  await api.patch(`/orders/${currentOrderId}/meta`, body);
  await activeOrdersQuery.refetch(); // sync lại danh sách orders
};

const onChangeGuestCount = async (value: number) => {
  await updateOrderMeta({ guestCount: value });
};

const onChangeCustomer = async (c: { id: string; name: string; phone?: string | null } |null) => {
  await updateOrderMeta({ customerId: c?.id ?? null });
};


  // USINGGGGGGGGGGGGGGGGGGGGGGGGG
  const confirmCancelOne = async ({ qty, reason }: { qty: number; reason: string }) => {
  if (!cancelOne) return;
  try {
    // LUÔN dùng cancel-partial để không lỡ tay huỷ cả dòng lẫn phần đang chế
    await api.patch(`/orderitems/cancel-partial`, {
      itemId: cancelOne.orderItemId,
      qty,
      reason,
    });

    // invalidate tất cả liên quan
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["active-orders"] }),
      qc.invalidateQueries({ queryKey: ["items", "NEW_ROWS"] }),
    ]);

    toast.success("Đã huỷ món");

    // refetch lại kitchen-progress để cập nhật progress / cancellable
    if (currentOrderId) {
      await qc.invalidateQueries({ queryKey: ["kitchen-progress", currentOrderId] });
    }

    // bật lại cờ "vừa thay đổi" → nút Báo bếp sáng lại
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

  const it = activeItems.find((x) => x.id === menuItemId);
  const cur = it?.qty ?? 0;                // tổng đang hiển thị trên hóa đơn
  const next = Math.max(0, cur + delta);   // số lượng user mong muốn

  if (!it) {
    if (delta > 0) await addOne(selectedTable.id, menuItemId);
    setJustChanged(true);
    return;
  }

  const totalSent = sentQty(menuItemId);         // tổng đã gửi bếp (4)
  const cancelable = cancellableQty(menuItemId); // phần còn huỷ được (2)
  const nonSent = Math.max(0, cur - totalSent);  // phần chưa gửi bếp

  if (delta > 0) {
    await addOne(selectedTable.id, menuItemId);
    setJustChanged(true);
    return;
  }

  // delta < 0
  if (next >= totalSent) {
    // chỉ đụng phần chưa gửi bếp
    const reducible = nonSent;
    const apply = Math.max(delta, -reducible);
    if (apply !== 0) {
      await changeQty(selectedTable.id, menuItemId, apply, activeItems);
      setJustChanged(true);
    }
    return;
  }

  // next < totalSent → đã đụng vào phần đã gửi bếp
const allow = cancelable;  // luôn cho chọn TỐI ĐA phần còn huỷ được

if (allow <= 0) {
  toast.error("Không thể huỷ thêm vì món đang được chế biến.");
  return;
}

setCancelOne({
  orderItemId: it.rowId!,
  name: menuItems.find((m) => m.id === it.id)?.name ?? "",
  qty: allow,   // ví dụ cancelable = 2 → modal hiển thị 2 / 2
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
  const allow = cancellableQty(it.id);
  console.log("onDelete item", {
    name: it.name,
    menuItemId: it.id,
    curQty: it.qty,
    sent: sentQty(it.id),
    allow,
  });

  if (allow === 0) {
    changeQty(selectedTable!.id, it.id, -it.qty, activeItems);
  } else {
    setCancelOne({
      orderItemId: it.rowId!,
      name: it.name,
      qty: allow,
    });
    setCancelOneOpen(true);
  }
};


useEffect(() => {
  const s = getSocket();

  const onItemNoteUpdated = (p: {
    orderId: string;
    orderItemId: string;
    menuItemId: string;
    note: string | null;
    by: string;
  }) => {
    // nếu muốn chỉ ảnh hưởng order đang mở thì check:
    if (currentOrderId && p.orderId !== currentOrderId) return;

    // cách lười: refetch lại active-orders
    qc.invalidateQueries({ queryKey: ["active-orders"] });

    // nếu thích thì toast:
    // toast.success(`Cập nhật ghi chú món ${p.menuItemId}`);
  };

  s.on("orderitem:note_updated", onItemNoteUpdated);
  return () => {
    s.off("orderitem:note_updated", onItemNoteUpdated);
  };
}, [qc, currentOrderId]);





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

const muUpdateNote = useMutation({
  mutationFn: ({ id, note }: { id: string; note: string }) =>
    api.patch(`/orderitems/${id}/note`, { note }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["active-orders"] });
  },
  onError: (err: any) => {
    console.error("update note error", err?.response?.data || err);
    toast.error("Cập nhật ghi chú thất bại", {
      description: err?.response?.data?.message || err.message,
    });
  },
});

const onUpdateNote = (orderItemId: string, note: string) => {
  console.log("usePosPage onUpdateNote", { orderItemId, note }); // 👈 thêm log
  if (!orderItemId) return;
  muUpdateNote.mutate({ id: orderItemId, note });
};




  const onNotify = async () => {
  if (!selectedTable) {
    toast.error("Chưa chọn bàn!");
    return;
  }
  if (!canNotify || notifying) return;

  setNotifying(true);
  try {
    const orderId = currentOrderId;
    if (!orderId) throw new Error("Không có orderId");

    await api.post(`/kitchen/orders/${orderId}/notify-items`, {
      items: deltaItems,
      tableName: selectedTable.name,
      priority: priorityNext,      // ✅ dùng cờ lần này
      source: "cashier",
    });

    await Promise.all([
      qc.invalidateQueries({ queryKey: ["kitchen-progress", orderId] }),
      qc.invalidateQueries({ queryKey: ["kitchen-history", orderId] }),
    ]);

    toast.success("Đã gửi bếp!");
    setJustChanged(false);
    setPriorityNext(false);        // ✅ gửi xong thì bỏ tick ưu tiên
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
  const onMetaUpdated = (p: {
    orderId: string;
    tableId: string;
    guestCount: number | null;
    customer: { id: string; name: string; phone?: string | null } | null;
  }) => {
    hit(p.orderId); // đơn giản là refetch lại active-orders
  };

  s.on("orders:meta_updated", onMetaUpdated);
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
      s.off("orders:meta_updated", onMetaUpdated);
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
    kitchenVoids,
       // kitchen voids cho UI
    clearKitchenVoid,
    clearAllKitchenVoids,


    // guest count & customer
    guestCount,
    customer,
    onChangeGuestCount,
    onChangeCustomer,
    onUpdateNote,


       // ưu tiên
    priorityNext,
    setPriorityNext,
    hasUnsentItems,
  };
}
