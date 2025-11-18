// src/components/common/AppDialogContent.tsx
"use client";

import * as React from "react";
import { DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Lấy props của DialogContent từ chính component
type AppDialogContentProps = React.ComponentProps<typeof DialogContent>;

export function AppDialogContent({
  className,
  children,
  ...rest
}: AppDialogContentProps) {
  return (
    <DialogContent
      {...rest}
      className={cn(
        "w-[95vw] sm:max-w-xl lg:max-w-3xl xl:max-w-5xl",
        "max-h-[90vh] p-0 flex flex-col",
        className
      )}
    >
      {children}
    </DialogContent>
  );
}
