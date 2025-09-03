"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { MenuItem } from "@/types/types";
import { currency } from "@/utils/money";


export function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
    return (
        <Card className="overflow-hidden">
            <button onClick={onAdd} className="group text-left w-full">
                <div className="h-28 w-full bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                </div>
                <CardContent className="p-3">
                    <div className="mb-1 text-sm font-medium leading-tight group-hover:underline">{item.name}</div>
                    <div className="text-xs text-slate-500">{currency(item.price)}</div>
                </CardContent>
            </button>
        </Card>
    );
}