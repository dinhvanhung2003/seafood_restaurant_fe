"use client";

import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Status = "active" | "inactive";

export type Area = {
  id: string;
  name: string;
};

export type TableFormState = {
  id?: string;
  name: string;
  areaId: string;
  seats?: number;
  note?: string;
  status: Status;
  order?: number;
};

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  form: TableFormState;
  setForm: Dispatch<SetStateAction<TableFormState>>;
  handleSubmit: () => void;
  areas: Area[];
  editing: boolean;
};

export default function TableFormModal({
  open,
  setOpen,
  form,
  setForm,
  handleSubmit,
  areas,
  editing,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="!w-[90vw] !max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Cập nhật" : "Thêm phòng/bàn"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1 block">Tên phòng/bàn</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="VD: Bàn 20"
            />
          </div>
          <div>
            <Label className="mb-1 block">Khu vực</Label>
            <Select
              value={form.areaId}
              onValueChange={(v) => setForm((s) => ({ ...s, areaId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn khu vực" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Số ghế</Label>
            <Input
              type="number"
              value={form.seats ?? 0}
              onChange={(e) =>
                setForm((s) => ({ ...s, seats: Number(e.target.value) || 0 }))
              }
            />
          </div>
          <div>
            <Label className="mb-1 block">Số thứ tự</Label>
            <Input
              type="number"
              value={form.order ?? 0}
              onChange={(e) =>
                setForm((s) => ({ ...s, order: Number(e.target.value) || 0 }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1 block">Ghi chú</Label>
            <Input
              value={form.note ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              placeholder="Ghi chú..."
            />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-2 block">Trạng thái</Label>
            <RadioGroup
              className="flex gap-6"
              value={form.status}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, status: v as Status }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="stf1" value="active" />
                <Label htmlFor="stf1">Đang hoạt động</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="stf2" value="inactive" />
                <Label htmlFor="stf2">Ngừng hoạt động</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {editing ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
