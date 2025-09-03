// @/components/admin/area/AreaFormModal.tsx
"use client";

import { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AreaForm = {
  name: string;
  note?: string;
};

type Props = {
  open: boolean;
  setOpen: (val: boolean) => void;
  areaName: string;
  setAreaName: (val: string) => void;
  areaNote: string;
  setAreaNote: (val: string) => void;
  onSubmit: () => void;
};


export default function AreaFormModal({
  open,
  setOpen,
  areaName,
  setAreaName,
  areaNote,
  setAreaNote,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khu vực</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Tên khu vực <span className="text-red-500">*</span></Label>
            <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} />
          </div>

          <div>
            <Label className="mb-1 block">Ghi chú</Label>
            <Input value={areaNote} onChange={(e) => setAreaNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onSubmit} className="bg-emerald-600 hover:bg-emerald-700">
            Lưu
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Bỏ qua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

