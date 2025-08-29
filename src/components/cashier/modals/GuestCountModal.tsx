"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, Ban } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
};

export function GuestCountModal({ open, onClose, onSubmit }: Props) {
  const [count, setCount] = useState(0);

  const handleSubmit = () => {
    onSubmit(count);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Số lượng khách</DialogTitle>
        </DialogHeader>

        <Input
          type="number"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="w-4 h-4 mr-1" /> Xong
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">
              <Ban className="w-4 h-4 mr-1" /> Bỏ qua
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
