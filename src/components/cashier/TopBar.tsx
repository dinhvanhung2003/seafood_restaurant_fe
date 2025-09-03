"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu as MenuIcon, Users, Square, Printer } from "lucide-react";


type TopbarProps = { title?: string };
export function Topbar({ title = "POS — Chi nhánh trung tâm" }: TopbarProps) {
    return (
        <div className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-white px-3">
            <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <MenuIcon className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                        <SheetHeader>
                            <SheetTitle>Chức năng</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 grid gap-2">
                            <Button variant="secondary" className="justify-start">
                                <Users className="mr-2 h-4 w-4" />Lễ tân
                            </Button>
                            <Button variant="secondary" className="justify-start">
                                <Square className="mr-2 h-4 w-4" />Màn hình phụ
                            </Button>
                            <Separator />
                            <Button variant="outline" className="justify-start">
                                <Printer className="mr-2 h-4 w-4" />In hoá đơn
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="font-semibold">{title}</div>
            </div>
        </div>
    );
}