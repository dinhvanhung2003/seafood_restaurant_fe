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

// Hàm format tiền tệ VNĐ
const formatCurrency = (value: string | number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
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
      .filter((m: any) => m.isCombo !== true)
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
                
                {/* Tên món */}
                <span className="truncate font-medium">{i.name}</span>
                
                {/* --- CHỈNH SỬA Ở ĐÂY: Format giá tiền --- */}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(i.price)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}