"use client";

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose,DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

type Props = {
  open: boolean;
  itemName: string;
  defaultNote?: string;
  onConfirm: (note: string) => void;
  onClose: () => void;
};

export function ItemNoteModal({ open, itemName, defaultNote = "", onConfirm, onClose }: Props) {
  const [note, setNote] = useState(defaultNote);

  useEffect(() => {
    if (open) setNote(defaultNote);
  }, [open, defaultNote]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl px-6 py-5 rounded-2xl">
        
        <DialogHeader>
           <DialogTitle>{itemName}</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú"
            className="rounded-xl border-none border-b border-blue-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="rounded-xl px-6 bg-gray-300 text-white hover:bg-gray-400">
              Bỏ qua
            </Button>
          </DialogClose>

          <Button
            className="rounded-xl px-6 bg-[#0067CE] hover:bg-[#0055b5] text-white"
            onClick={() => onConfirm(note)}
          >
            Xác nhận
          </Button>
        </DialogFooter>

        <DialogClose asChild>
          <button className="absolute right-3 top-3 text-slate-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
