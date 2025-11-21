"use client";

import * as React from "react";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/lib/axios";

const LIMIT = 10;

export type InventoryItemOption = {
  id: string;
  name: string;
  unit: string;
  baseUomName: string;
  dimension: "mass" | "volume" | "count" | "length";
  onHand: number;
};

async function fetchInventoryOptions({
  pageParam = 1,
  queryKey,
}: {
  pageParam?: number;
  queryKey: (string | number)[];
}) {
  const [_, search] = queryKey;
  const res = await api.get("/inventoryitems/list-ingredients", {
    params: {
      limit: LIMIT,
      page: pageParam,
      sort: "name:ASC",
      isActive: true,
      q: search,
    },
  });

  const list: any[] = res.data?.data ?? [];
  const items = list.map((i) => ({
    id: i.id,
    name: i.name,
    unit: i.baseUom?.code,
    baseUomName: i.baseUom?.name,
    dimension: i.baseUom?.dimension,
    onHand: Number(String(i.quantity).replace(/,/g, "")),
  }));

  return {
    items,
    nextPage: list.length === LIMIT ? pageParam + 1 : undefined,
  };
}

interface IngredientComboboxProps {
  value: string;
  onChange: (value: string, item?: InventoryItemOption) => void;
  disabled?: boolean;
}

export function IngredientCombobox({
  value,
  onChange,
  disabled,
}: IngredientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [fetchedItem, setFetchedItem] =
    React.useState<InventoryItemOption | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["inventory-options-infinite", debouncedSearch],
      queryFn: fetchInventoryOptions,
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  const allItems = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // ✅ phải đưa fetchedItem vào deps để re-render khi fetch xong
  const selectedItem = React.useMemo(
    () =>
      allItems.find((item) => item.id === value) ??
      (value ? fetchedItem : null) ??
      null,
    [allItems, value, fetchedItem]
  );

  // Nếu value có mà không nằm trong page hiện tại thì fetch riêng 1 lần
  React.useEffect(() => {
    let mounted = true;

    async function fetchSelected() {
      if (!value) {
        if (mounted) setFetchedItem(null);
        return;
      }

      // đã có trong list hoặc fetchedItem hiện tại đúng id thì bỏ qua
      if (
        allItems.find((i) => i.id === value) ||
        (fetchedItem && fetchedItem.id === value)
      )
        return;

      try {
        const res = await api.get(`/inventoryitems/${value}`);
        const i = res.data;
        const item: InventoryItemOption = {
          id: i.id,
          name: i.name,
          unit: i.baseUom?.code,
          baseUomName: i.baseUom?.name,
          dimension: i.baseUom?.dimension,
          onHand: Number(String(i.quantity).replace(/,/g, "")),
        };
        if (mounted) setFetchedItem(item);
      } catch {
        // ignore
      }
    }

    fetchSelected();

    return () => {
      mounted = false;
    };
  }, [value, allItems, fetchedItem]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedItem
            ? `${selectedItem.name} (${
                selectedItem.baseUomName ?? selectedItem.unit
              })`
            : "Chọn nguyên liệu..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm nguyên liệu..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Không tìm thấy.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {allItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={(currentValue) => {
                    const selected = allItems.find(
                      (i) => i.id === currentValue
                    );
                    onChange(selected ? selected.id : "", selected);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.name} ({item.baseUomName ?? item.unit}) - còn{" "}
                  {item.onHand}
                </CommandItem>
              ))}
              {hasNextPage && (
                <CommandItem
                  onSelect={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
