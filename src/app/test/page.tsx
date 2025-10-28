"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TestScrollPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="w-[400px] h-[300px] border rounded-lg shadow bg-white">
        <ScrollArea className="h-full p-4">
          <div className="space-y-2">
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="p-2 bg-slate-50 border rounded">
                Item {i + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
