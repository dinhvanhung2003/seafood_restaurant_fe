"use client";

import { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  onSubmit: () => void;
};

export default function CategoryFormModal({ open, setOpen, name, setName, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Thêm danh mục</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label className="mb-1 block">Tên danh mục *</Label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bia, Đồ nướng…" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>Bỏ qua</Button>
          <Button onClick={onSubmit}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
