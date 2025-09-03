// app/ToasterProvider.tsx
"use client";
import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      duration={3000}
    />
  );
}
