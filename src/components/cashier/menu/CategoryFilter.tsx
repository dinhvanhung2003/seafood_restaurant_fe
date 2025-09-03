"use client";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/types";


export function CategoryFilter({
    categories,
    selected,
    onSelect,
}: {
    categories: Category[];
    selected: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="flex gap-1 overflow-x-auto pr-1">
            {categories.map((c) => (
                <Button
                    key={c.id}
                    size="sm"
                    variant={selected === c.id ? "default" : "outline"}
                    onClick={() => onSelect(c.id)}
                >
                    {c.name}
                </Button>
            ))}
        </div>
    );
}