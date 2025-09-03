"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MenuItem } from "@/types/types";
import { MenuCard } from "./MenuCard";


export function MenuGrid({ items, onAdd }: { items: MenuItem[]; onAdd: (id: string) => void }) {
    return (
        <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {items.map((m) => (
                    <MenuCard key={m.id} item={m} onAdd={() => onAdd(m.id)} />
                ))}
            </div>
        </ScrollArea>
    );
}