"use client";
import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenuItemsQuery } from "@/hooks/admin/useMenu";

export type MenuBasic = {
  id: string;
  name: string;
  price: string | number;
  image: string | null;
  isCombo?: boolean;
  isAvailable?: boolean;
};

export default function MenuItemCombobox({
  value,
  onChange,
  placeholder = "Chọn món…",
}: {
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  // tải danh sách món lẻ (page=1, limit=50, sort theo tên). Có ô search client-side trong combobox.
  const { data } = useMenuItemsQuery({
    page: 1,
    limit: 50,
    sortBy: "name",
    order: "ASC",
    isAvailable: "true",
  });

  const [open, setOpen] = useState(false);
  const items: MenuBasic[] =
    (data?.body?.data ?? [])
      // nếu API có cả combo, lọc bỏ combo ở FE
      .filter((m: any) => m.isCombo !== true) // an toàn
      .map((m) => ({ id: m.id, name: m.name, price: m.price, image: m.image, isAvailable: m.isAvailable }));

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]">
        <Command>
          <CommandInput placeholder="Tìm món theo tên…" />
          <CommandEmpty>Không thấy món phù hợp.</CommandEmpty>
          <CommandGroup>
            {items.map((i) => (
              <CommandItem
                key={i.id}
                value={i.name}
                onSelect={() => {
                  onChange(i.id);
                  setOpen(false);
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", i.id === value ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{i.name}</span>
                <span className="ml-auto text-xs opacity-60">
                  {typeof i.price === "string" ? Number(i.price) : i.price}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
