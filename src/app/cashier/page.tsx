"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, Search, UtensilsCrossed } from "lucide-react";

import { FloorFilter } from "@/components/cashier/filters/FloorFilter";
import { StatusFilter } from "@/components/cashier/filters/StatusFilter";
import { SearchField } from "@/components/cashier/inputs/SearchFiled";
import { TableGrid } from "@/components/cashier/tables/TableGrid";
import { CategoryFilter } from "@/components/cashier/menu/CategoryFilter";
import { MenuGrid } from "@/components/cashier/menu/MenuGrid";
import { OrderList } from "@/components/cashier/order/OrderList";
import CheckoutModal from "@/components/cashier/modals/CheckoutModal";
import CancelItemsModal from "@/components/cashier/modals/CancelModal";

import { usePosPage } from "./usePosPage";

export default function POSPage() {
  const M = usePosPage();

  return (
    <div className="h-[100dvh] w-full text-slate-900 bg-[#0A2B61]">
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
                        …
                      </button>
                      <div className="flex-1">
                        <SearchField
                          placeholder="Tìm theo tên bàn, tên khách hàng, món trong đơn…"
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
          onNotify={M.onNotify}
          onCheckout={M.handleCheckout}
          onCancelOrder={M.onCancelOrder}
          canCancel={M.hasOrder}

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

        <CancelItemsModal
          open={M.cancelOpen}
          onClose={() => M.setCancelOpen(false)}
          items={M.cancelTargets}
          onConfirm={M.confirmCancelItems}
        />
      </div>
    </div>
  );
}
