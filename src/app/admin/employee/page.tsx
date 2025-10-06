"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmployee } from "@/hooks/admin/useEmployee";

import StaffTable from "@/components/admin/employee/table/StaffTable";
import UserProfileDialog from "@/components/admin/employee/modal/UserProfileDialog";
import CreateEmployeeDialog from "@/components/admin/employee/modal/CreateEmployeeDialog";

export default function StaffPage() {
  const { rows, isLoading } = useEmployee();

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(k) ||
        r.email.toLowerCase().includes(k) ||
        r.username.toLowerCase().includes(k) ||
        r.phoneNumber.toLowerCase().includes(k)
    );
  }, [rows, q]);

  // profile dialog state
  const [openProfile, setOpenProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>
        <CreateEmployeeDialog />
      </div>

      <div className="max-w-lg">
        <Input placeholder="Tìm theo tên, email, username, SĐT" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <StaffTable
          rows={filtered}
          isLoading={isLoading}
          onOpenProfile={(id) => { setSelectedUserId(id); setOpenProfile(true); }}
        />
      </Card>

      <UserProfileDialog
        userId={selectedUserId}
        open={openProfile}
        onOpenChange={(v) => { setOpenProfile(v); if (!v) setSelectedUserId(undefined); }}
      />
    </div>
  );
}
