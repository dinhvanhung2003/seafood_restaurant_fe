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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Camera } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CustomerModal({ open, onClose }: Props) {
  const [gender, setGender] = useState("Nam");
  const [type, setType] = useState("Cá nhân");

  return (
    <Dialog open={open} onOpenChange={onClose}>
     <DialogContent className="w-full max-w-[900px] sm:max-w-[700px] md:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] 2xl:max-w-[1200px] rounded-2xl p-6">

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Thêm khách hàng</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Cột ảnh + loại khách */}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
                 <div className="space-y-1">
              <Label className="text-sm">Loại khách</Label>
              <RadioGroup
                value={type}
                onValueChange={setType}
                className="flex gap-6 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Cá nhân" id="ca-nhan" />
                  <Label htmlFor="ca-nhan">Cá nhân</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Công ty" id="cong-ty" />
                  <Label htmlFor="cong-ty">Công ty</Label>
                </div>
              </RadioGroup>
            </div>
              <div className="w-28 h-28 rounded-md border border-dashed grid place-items-center text-muted-foreground">
                <Camera className="w-6 h-6" />
              </div>
              <Button variant="link" className="text-sm font-medium text-blue-600">
                Chọn ảnh
              </Button>
            </div>

           
          </div>

          {/* Cột trái */}
          <div className="space-y-3">
            <Input placeholder="Mã mặc định" />
            <Input placeholder="Tên khách hàng/Công ty" />
            <Input placeholder="VD: 0912345678" />
            <div className="relative">
              <Input placeholder="Ngày/Tháng/Năm" />
              <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <Input placeholder="Địa chỉ" />
            <Input placeholder="Tỉnh / Thành phố" />
            <Input placeholder="Quận / Huyện" />
            <Input placeholder="Phường / Xã" />
          </div>

          {/* Cột phải */}
          <div className="space-y-3">
            <Input placeholder="Chi nhánh trung tâm" />
            <Input placeholder="Mã số thuế" />
            <Input placeholder="Căn cước công dân" />
            <div className="space-y-1">
              <Label className="text-sm">Giới tính</Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex gap-6 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nam" id="nam" />
                  <Label htmlFor="nam">Nam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Nữ" id="nu" />
                  <Label htmlFor="nu">Nữ</Label>
                </div>
              </RadioGroup>
            </div>
            <Input placeholder="Email" />
            <Input placeholder="Nhóm" />
            <Textarea placeholder="Ghi chú" />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="rounded-lg">Bỏ qua</Button>
          </DialogClose>
          <Button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
