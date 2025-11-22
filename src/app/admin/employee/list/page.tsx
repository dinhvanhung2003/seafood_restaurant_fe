"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmployee } from "@/hooks/admin/useEmployee";
import StaffTable from "@/components/admin/employee/table/StaffTable";
import UserProfileDialog from "@/components/admin/employee/modal/UserProfileDialog";
import CreateEmployeeDialog from "@/components/admin/employee/modal/CreateEmployeeDialog";
import SalarySettingDialog from "@/components/admin/employee/salary/modal/SalarySettingDialog";
import FaceEnrollDialog from "@/components/admin/employee/modal/FaceEnrollDialog";

export default function StaffPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  const { rows, meta, isLoading } = useEmployee(page, limit, q);

  // profile dialog
  const [openProfile, setOpenProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  // salary dialog
  const [openSalary, setOpenSalary] = useState(false);
  const [salaryUserId, setSalaryUserId] = useState<string | undefined>();

  // face dialog
  const [openFace, setOpenFace] = useState(false);
  const [faceUserId, setFaceUserId] = useState<string | undefined>();
  const [faceUserName, setFaceUserName] = useState<string | undefined>();

  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.pages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Danh sách nhân viên</h1>
        <CreateEmployeeDialog />
      </div>

      <div className="flex items-center gap-3">
        <div className="max-w-lg flex-1">
          <Input
            placeholder="Tìm theo tên, email, username, SĐT"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="border rounded px-2 py-1 text-sm"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <StaffTable
          rows={rows}
          isLoading={isLoading}
          onOpenProfile={(id) => {
            setSelectedUserId(id);
            setOpenProfile(true);
          }}
          onOpenSalary={(id) => {
            setSalaryUserId(id);
            setOpenSalary(true);
          }}
           onOpenFace={(id, name) => {
            setFaceUserId(id);
            setFaceUserName(name);
            setOpenFace(true);
          }}
        />
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div>
          Tổng: <b>{meta.total}</b> • Trang <b>{meta.page}</b>/<b>{meta.pages}</b>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
          >
            Sau
          </Button>
        </div>
      </div>

      <UserProfileDialog
        userId={selectedUserId}
        open={openProfile}
        onOpenChange={(v) => {
          setOpenProfile(v);
          if (!v) setSelectedUserId(undefined);
        }}
      />

      <SalarySettingDialog
        staffId={salaryUserId}
        open={openSalary}
        onOpenChange={(v) => {
          setOpenSalary(v);
          if (!v) setSalaryUserId(undefined);
        }}
      />
        {/* 👇 Dialog camera khuôn mặt */}
      <FaceEnrollDialog
        userId={faceUserId}
        userName={faceUserName}
        open={openFace}
        onOpenChange={(v) => {
          setOpenFace(v);
          if (!v) {
            setFaceUserId(undefined);
            setFaceUserName(undefined);
          }
        }}
      />
    </div>
  );
}
