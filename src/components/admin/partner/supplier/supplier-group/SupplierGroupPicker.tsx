// Clean re-implementation with delete (remove) + deactivate logic
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSupplierGroups,
  SupplierGroup,
} from "@/hooks/admin/useSupplierGroup";
import CreateSupplierGroupModal from "./modal/CreaGroupSupplier";
import EditSupplierGroupModal from "./modal/EditGroupSupplier";

export default function SupplierGroupPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange?: (id: string | null) => void;
}) {
  const {
    groups,
    isLoading,
    deactivateGroup,
    deactivateStatus,
    removeGroup,
    removeStatus,
  } = useSupplierGroups({ limit: 100 });

  const selected = useMemo(
    () => groups.find((g) => g.id === value) ?? null,
    [groups, value]
  );

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierGroup | null>(null);

  const tryRemove = async () => {
    if (!selected) return;
    if (
      !confirm(
        `Xoá nhóm “${selected.name}”? Nếu nhóm có NCC đã phát sinh giao dịch sẽ không xoá được và bạn sẽ được đề nghị ngừng hoạt động.`
      )
    )
      return;
    try {
      await removeGroup(selected.id);
      onChange?.(null);
    } catch (e: any) {
      const code = e?.response?.data?.message;
      if (
        code ===
        "GROUP_HAS_SUPPLIERS_WITH_TRANSACTIONS_DEACTIVATION_RECOMMENDED"
      ) {
        if (confirm("Không xoá được. Ngừng hoạt động nhóm này?")) {
          await deactivateGroup(selected.id);
          onChange?.(null);
        }
      }
    }
  };

  return (
    <TooltipProvider>
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="font-semibold">Nhóm NCC</Label>
          <div className="flex items-center gap-2">
            <CreateSupplierGroupModal
              triggerAs="button"
              onSuccess={(newId) => onChange?.(newId ?? null)}
            />
            {selected && !selected.id.startsWith("optimistic-") && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                disabled={removeStatus.isPending || deactivateStatus.isPending}
                onClick={tryRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        !value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Tất cả các nhóm
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
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === g.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {g.name}
                      </div>
                      {!g.id.startsWith("optimistic-") && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditing(g);
                                setEditOpen(true);
                              }}
                              onPointerDownCapture={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">Sửa nhóm</TooltipContent>
                        </Tooltip>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <EditSupplierGroupModal
          open={editOpen}
          onOpenChange={setEditOpen}
          group={editing}
          onUpdated={(g) => onChange?.(g.id)}
          onDeactivated={() => {
            onChange?.(null);
            setEditOpen(false);
          }}
        />
      </Card>
    </TooltipProvider>
  );
}
