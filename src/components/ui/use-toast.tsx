"use client";

import React from "react";
import { toast as sonner } from "sonner";

type ToastInput = {
  title?: string;
  // allow richer content (JSX) for highlighted messages
  description?: React.ReactNode;
};

export function useToast() {
  return {
    toast: ({ title, description }: ToastInput) =>
      sonner(title ?? "", { description: description as any }),
  };
}
