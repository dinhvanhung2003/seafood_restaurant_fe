// components/suppliers/groups/SupplierGroupPicker.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupplierGroups, SupplierGroup } from "@/hooks/admin/useSupplierGroup";
import CreateSupplierGroupModal from "./modal/CreaGroupSupplier";
import EditSupplierGroupModal from "./modal/EditGroupSupplier";

const ALL = "__ALL__";

export default function SupplierGroupPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
}) {
  const { groups, isLoading } = useSupplierGroups({ limit: 100 });
  const selected = useMemo(
    () => groups.find((g) => g.id === value) ?? null,
    [groups, value]
  );

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierGroup | null>(null);

  return (
    <TooltipProvider>
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Nhóm NCC</Label>
          <CreateSupplierGroupModal
            triggerAs="button"
            onSuccess={(newId) => onChange?.(newId ?? null)}
          />
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
              disabled={isLoading}
            >
              {selected ? selected.name : "Tất cả các nhóm"}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[280px] p-0 z-[999]" align="start">
            <Command>
              <CommandInput placeholder="Tìm nhóm…" />
              <CommandList>
                <CommandEmpty>Không có nhóm phù hợp</CommandEmpty>
                <CommandGroup heading="Nhóm">
                  <CommandItem
                    value="__all__"
                    onSelect={() => {
                      onChange?.(null);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                      Tất cả các nhóm
                    </div>
                  </CommandItem>

                  {groups.map((g) => (
                    <CommandItem
                      key={g.id}
                      value={g.name}
                      onSelect={() => {
                        onChange?.(g.id);
                        setOpen(false);
                      }}
                      className="group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check className={cn("h-4 w-4", value === g.id ? "opacity-100" : "opacity-0")} />
                        {g.name}
                      </div>

                      {/* Nút bút chì: CHẶN BUBBLE */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();           // ⬅️ quan trọng
                              setEditing(g);                 // set đúng group
                              setEditOpen(true);             // mở modal edit
                            }}
                            onPointerDownCapture={(e) => e.stopPropagation()} // chặn từ sớm
                            onMouseDown={(e) => e.preventDefault()} // tránh mất focus làm đóng popover
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Sửa nhóm</TooltipContent>
                      </Tooltip>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Modal sửa: controlled + nhận đúng group */}
        <EditSupplierGroupModal
          open={editOpen}
          onOpenChange={setEditOpen}
          group={editing}
          onUpdated={(g) => {
            onChange?.(g.id);
          }}
          onDeactivated={() => {
            onChange?.(null);
            setEditOpen(false);
          }}
        />
      </Card>
    </TooltipProvider>
  );
}
