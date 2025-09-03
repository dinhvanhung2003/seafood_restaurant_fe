"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Table } from "@/types/types";
import { TableCard } from "./TableCard";

type TableGridProps = {
  tables: Table[];
  selectedId?: string;
  onSelect: (t: Table) => void;
  totals?: Record<string, number>;
  counts?: Record<string, number>; // ➕ thêm dòng này
};


export function TableGrid({ tables, selectedId, onSelect, totals }: TableGridProps) {
  return (
    <ScrollArea className="h-[58vh] md:h-[60vh]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {tables.map((t) => (
          <TableCard
            key={t.id}
            table={t}
            selected={t.id === selectedId}
            onSelect={() => onSelect(t)}
            amount={totals?.[t.id]}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
