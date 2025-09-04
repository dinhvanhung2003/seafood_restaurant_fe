"use client";

import { toast } from "sonner";

export function useAppToast() {
  return {
    success: (title: string, description?: string) =>
      toast.success(title, { description }),

    error: (title: string, description?: string) =>
      toast.error(title, { description }),

    info: (title: string, description?: string) =>
      toast(title, { description }),
  };
}
