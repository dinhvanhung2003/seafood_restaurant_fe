"use client";
import { Button } from "@/components/ui/button";


type FloorFilterProps = {
    floors: readonly string[];
    selected: string;
    onSelect: (f: string) => void;
};
export function FloorFilter({ floors, selected, onSelect }: FloorFilterProps) {
    return (
        <div className="flex gap-1 overflow-x-auto">
            {floors.map((f) => (
                <Button
                    key={f}
                    size="sm"
                    variant={selected === f ? "default" : "outline"}
                    onClick={() => onSelect(f)}
                >
                    {f}
                </Button>
            ))}
        </div>
    );
}