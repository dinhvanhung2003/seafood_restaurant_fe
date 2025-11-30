"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, Search, UtensilsCrossed } from "lucide-react";
import { LogOut, Menu as MenuIcon, UserCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "next-auth/react";
import { Monitor } from "lucide-react";
import { Settings } from "lucide-react";
import { FloorFilter } from "@/components/cashier/filters/FloorFilter";
import { StatusFilter } from "@/components/cashier/filters/StatusFilter";
import { SearchField } from "@/components/cashier/inputs/SearchFiled";
import { TableGrid } from "@/components/cashier/tables/TableGrid";
import { CategoryFilter } from "@/components/cashier/menu/CategoryFilter";
import { MenuGrid } from "@/components/cashier/menu/MenuGrid";
import { OrderList } from "@/components/cashier/order/OrderList";
import CheckoutModal from "@/components/cashier/modals/CheckoutModal";
import CancelOneItemModal from "@/components/cashier/modals/CancelModal";

import { usePosPage } from "./usePosPage";

export default function POSPage() {
  const M = usePosPage();

  return (
    <div className="h-[100dvh] w-full text-slate-900 bg-[#0A2B61]">
      <header className="flex h-14 items-center justify-between px-4 text-white border-b border-[#0A3978]">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide">
          Màn thu ngân
        </span>
      </div>

      {/* Drawer / Menu user */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-sm hover:bg-white/20">
            <UserCircle2 className="h-4 w-4" />
            <span className="hidden text-xs md:inline">
              Thu ngân
            </span>
            <MenuIcon className="h-4 w-4" />
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="flex h-full w-80 flex-col p-0">
          {/* Header trong drawer */}
          <SheetHeader className="border-b border-slate-200 px-4 py-3 text-left">
            <SheetTitle className="flex items-center gap-2">
              <UserCircle2 className="h-6 w-6 text-slate-700" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Thu ngân</span>
                <span className="text-xs text-slate-500">POS nhà hàng</span>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Menu trong drawer */}
          <div className="flex-1 overflow-y-auto px-2 py-3 text-sm">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase text-slate-500">
              Chức năng
            </div>

            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
              <Monitor className="h-4 w-4" />
              <span>Màn hình bếp</span>
            </button>

            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
              <Settings className="h-4 w-4" />
              <span>Cài đặt chung</span>
            </button>

            {/* Bạn có thể thêm các mục khác: Lập phiếu thu, Trả hàng, Phím tắt,... */}
          </div>

          {/* Logout */}
          <div className="border-t border-slate-200 p-2">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
      <div className="grid h-[calc(100dvh-56px)] grid-cols-1 gap-3 p-3 min-h-0 md:grid-cols-[3fr_2fr]">
        {/* Left */}
        <Card className="bg-white shadow rounded-xl h-full flex flex-col">
          <CardHeader className="pb-2">
            <Tabs value={M.activeTab} onValueChange={(v) => M.setActiveTab(v as "tables" | "menu")}>
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
            <Tabs value={M.activeTab} className="flex-1 min-h-0 flex flex-col">
              <TabsContent value="tables" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="space-y-2 pb-3">
                  {!M.isSearching ? (
                    <>
                      <div className="flex items-center gap-3">
                        <FloorFilter
                          floors={[
                            "Tất cả",
                            ...Array.from(new Set((M.areasQuery.data ?? []).map((a: any) => a.name))),
                          ]}
                          selected={M.selectedFloor}
                          onSelect={M.setSelectedFloor}
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
                            onClick={() => M.enterSearch()}
                            className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 hover:bg-slate-200 transition"
                            aria-label="Tìm kiếm (F3)"
                          >
                            <Search className="h-4 w-4 text-slate-700" />
                          </button>
                        </div>
                      </div>

                      <StatusFilter value={M.statusFilter} onChange={M.setStatusFilter} counts={M.counts} />
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => M.exitSearch()}
                        className="grid h-9 w-9 place-items-center rounded-full bg-slate-100"
                      >
                        <ChevronLeft className="h-4 w-4 text-slate-700" />
                      </button>
                      <div className="flex-1">
                        <SearchField
                          placeholder="Tìm theo tên bàn"
                          value={M.tableSearch}
                          onChange={M.setTableSearch}
                          autoFocus
                          onKeyDown={(e) => e.key === "Escape" && M.exitSearch()}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <TableGrid
  tables={M.tablesWithStart}
  selectedId={M.selectedTable?.id}
  totals={Object.fromEntries(M.tableList.map((t:any) => [t.id, t.currentAmount ?? 0]))}
  counts={{
    ...Object.fromEntries(
      M.tableList.map((t:any) => [
        t.id,
        (M.orders?.[t.id]?.orders?.[0]?.items ?? []).reduce(
          (s: number, i: any) => s + i.qty,
          0
        ),
      ])
    ),
  }}
  // page={M.tablePage}       // ➕ thêm dòng này
  // limit={M.tableLimit}     // ➕ thêm dòng này
  onSelect={(t) => {
    M.setSelectedTable(t);
    if (M.openMenuOnSelect) M.setActiveTab("menu");
  }}
/>


              <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
  <div className="flex items-center gap-2">
    <Checkbox
      id="openMenuOnSelect"
      checked={M.openMenuOnSelect}
      onCheckedChange={(v) => M.setOpenMenuOnSelect(Boolean(v))}
    />
    <label htmlFor="openMenuOnSelect" className="cursor-pointer select-none">
      Mở thực đơn khi chọn bàn
    </label>
  </div>

  {/* PHÂN TRANG */}
  {(() => {
    const page = M.tableMeta?.page ?? M.tablePage;
    const pages = M.tableMeta?.pages ?? 1;
    const canPrev = page > 1;
    const canNext = page < pages;

    return (
      <div className="flex items-center gap-2">
        <span className="mr-2">Trang {page} / {pages}</span>
        <Button
          size="icon"
          variant="outline"
          onClick={() => M.setTablePage((p) => Math.max(1, p - 1))}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() =>
            M.setTablePage((p) =>
              M.tableMeta?.pages && p < M.tableMeta.pages ? p + 1 : p
            )
          }
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  })()}
</div>
              </TabsContent>

              <TabsContent value="menu" className="mt-0 flex-1 min-h-0 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 pb-3">
                  <CategoryFilter
                    categories={M.menuCategories}
                    selected={M.categoryId}
                    onSelect={M.setCategoryId}
                  />
                  <SearchField placeholder="Tìm món (F3)" value={M.menuSearch} onChange={M.setMenuSearch} />
                </div>

                <MenuGrid items={M.filteredMenuItems} onAdd={M.onAdd} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right: Order Panel */}
        <OrderList
          orderId={M.currentOrderId}
          table={M.selectedTable}
          items={M.activeItems}
          catalog={M.menuCatalog}
          total={M.orderTotal}
          onChangeQty={M.onChangeQty}
          justChanged={M.justChanged}
            hasUnsentItems={M.hasUnsentItems}
  priorityNext={M.priorityNext}
  onChangePriorityNext={M.setPriorityNext}
          onClear={M.onClear}
          orderTabs={
            M.selectedTable && (M as any).orders?.[M.selectedTable.id]
              ? {
                  activeId: (M as any).orders[M.selectedTable.id].activeId,
                  orders: (M as any).orders[M.selectedTable.id].orders.map((o: any) => ({
                    id: o.id,
                    label: o.label,
                  })),
                }
              : { activeId: "", orders: [] }
          }
          onAddOrder={() => {}}
          onSwitchOrder={() => {}}
          onCloseOrder={() => {}}
            onUpdateNote={M.onUpdateNote} 
           onNotify={M.onNotify}    
          onCheckout={M.handleCheckout}
          onCancelOrder={M.onCancelOrder}
          canCancel={M.hasOrder}
           kitchenVoids={M.kitchenVoids}

        
             guestCount={M.guestCount}
  customer={M.customer}
  onChangeGuestCount={M.onChangeGuestCount}
  onChangeCustomer={M.onChangeCustomer}
      
          onClearKitchenVoid={M.clearKitchenVoid}
  canNotify={M.canNotify && !M.notifying}
        />

        {M.selectedTable && (
          <CheckoutModal
            open={M.checkoutOpen}
            onClose={() => M.setCheckoutOpen(false)}
            table={M.selectedTable}
            items={M.activeItems}
            catalog={M.menuCatalog}
            onSuccess={M.handleCheckoutSuccess}
            orderId={M.currentOrderId ?? null}

          />
        )}
<CancelOneItemModal
  open={M.cancelOneOpen}
  onClose={() => { M.setCancelOneOpen(false); M.setCancelOne(null); }}
  item={M.cancelOne}
  onConfirm={M.confirmCancelOne}
/>

      </div>
    </div>
  );
}
