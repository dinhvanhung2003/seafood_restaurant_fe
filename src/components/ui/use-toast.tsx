"use client";

import { toast as sonner } from "sonner";

type ToastInput = {
  title?: string;
  description?: string;
};

export function useToast() {
  return {
    toast: ({ title, description }: ToastInput) =>
      sonner(title ?? "", { description }),
  };
}
