"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useSupplierGroups } from "@/hooks/admin/useSupplierGroup";

export default function CreateSupplierGroupModal({
  onSuccess,
  triggerAs = "icon", // "icon" | "button"
}: {
  onSuccess?: (newId: string) => void;
  triggerAs?: "icon" | "button";
}) {
  const { createGroup, createStatus } = useSupplierGroups({ limit: 10 });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    const g = await createGroup({ name: name.trim(), description: desc || undefined });
    setOpen(false);
    setName(""); setDesc("");
    onSuccess?.((g as any)?.id);
  };

  const trigger =
    triggerAs === "icon" ? (
      <Button size="icon" variant="ghost"><Plus className="h-4 w-4" /></Button>
    ) : (
      <Button variant="secondary"><Plus className="h-4 w-4 mr-2" /> Thêm nhóm</Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm nhóm nhà cung cấp</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Tên nhóm</Label>
            <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="desc">Ghi chú</Label>
            <Textarea id="desc" value={desc} onChange={(e)=>setDesc(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim() || createStatus.isPending}>
            {createStatus.isPending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
