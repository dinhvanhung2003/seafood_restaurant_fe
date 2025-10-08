// src/features/attendance/api.ts
import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Helper: luôn trả về array từ các kiểu response khác nhau */
function unwrapArray<T>(res: any): T[] {
  // axios -> res.data là payload
  const p = res?.data ?? res;
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.items)) return p.items;
  return [];
}

export type Shift = {
  id: string;
  name: string;
  color?: string | null;
  startTime: string;
  endTime: string;
};

export type Employee = {
  id: string;
  fullName: string;
  code?: string | null;
};
function normalizeUser(u: any): Employee {
  return {
    id: u?.id,
    fullName:
      u?.profile?.fullName ??
      u?.fullName ??
      u?.username ??
      u?.email ??
      "Không tên",
    code: u?.code ?? null,
  };
}
export type AttendanceStatus = "ON_TIME" | "LATE" | "MISSING" | "ABSENT" | "LEAVE";

export type Attendance = {
  id: string;
  userId: string;
  dateISO: string;
  shiftId: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  note?: string | null;
  user?: Employee;
  shift?: Shift;
};

export const STATUS_UI: Record<AttendanceStatus, { text: string; className: string }> = {
  ON_TIME: { text: "Đúng giờ", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  LATE:    { text: "Đi muộn / về sớm", className: "bg-violet-100 text-violet-700 border-violet-200" },
  MISSING: { text: "Chấm thiếu", className: "bg-rose-100 text-rose-700 border-rose-200" },
  ABSENT:  { text: "Nghỉ không phép", className: "bg-neutral-200 text-neutral-700 border-neutral-300" },
  LEAVE:   { text: "Nghỉ làm", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export const attendanceApi = {
  async getShifts(): Promise<Shift[]> {
    const r = await api.get("/shifts");
    return unwrapArray<Shift>(r);
  },

  getEmployees: async (): Promise<Employee[]> => {
  const r = await api.get("/user/get-list-user");
  const arr = Array.isArray(r.data) ? r.data : r.data?.items ?? [];
  return arr.map((u: any) => normalizeUser(u));
},

  getAttendanceRange: async (fromISO: string, toISO: string): Promise<Attendance[]> => {
  const r = await api.get("/admin/attendance/range", { params: { from: fromISO, to: toISO } });
  const arr = Array.isArray(r.data) ? r.data : r.data?.items ?? [];
  return arr.map((a: any) => ({
    ...a,
    user: a.user ? normalizeUser(a.user) : undefined,
  }));
},


  async getWeekSchedules(startISO: string, endISO: string) {
    // /schedules/week?start=YYYY-MM-DD&end=YYYY-MM-DD
    const r = await api.get("/schedules/week", { params: { start: startISO, end: endISO } });
    return unwrapArray<any>(r); // mỗi item có { user, shift, date }
  },

  async upsertAttendance(payload: {
    userId: string;
    dateISO: string;
    shiftId: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status?: "LEAVE" | "ABSENT";
    note?: string | null;
  }) {
    const r = await api.post("/admin/attendance/upsert", payload);
    return r.data;
  },
};

export const qk = {
  shifts: ["attendance", "shifts"] as const,
  employees: ["attendance", "employees"] as const,
  range: (fromISO: string, toISO: string) => ["attendance", "range", fromISO, toISO] as const,
  week:  (startISO: string, endISO: string) => ["attendance", "week", startISO, endISO] as const,
};

export function useShiftsQuery() {
  return useQuery({ queryKey: qk.shifts, queryFn: attendanceApi.getShifts, staleTime: 5 * 60_000 });
}

export function useEmployeesQuery() {
  return useQuery({ queryKey: qk.employees, queryFn: attendanceApi.getEmployees, staleTime: 5 * 60_000 });
}

export function useAttendanceRangeQuery(fromISO: string, toISO: string) {
  return useQuery<Attendance[]>({
    queryKey: qk.range(fromISO, toISO),
    queryFn: () => attendanceApi.getAttendanceRange(fromISO, toISO),
    enabled: !!fromISO && !!toISO,
  });
}

export function useWeekSchedulesQuery(fromISO: string, toISO: string) {
  return useQuery({
    queryKey: ["schedules", fromISO, toISO],
    queryFn: async () => {
      const r = await api.get("/schedules/week", { params: { start: fromISO, end: toISO } });
      const rows = Array.isArray(r.data) ? r.data : r.data?.items ?? [];
      // Chuẩn hoá user ngay tại đây
      return rows.map((it: any) => ({
        ...it,
        user: normalizeUser(it.user),
        // shift giữ nguyên, nhưng bạn có thể đảm bảo có startTime/endTime dạng "HH:mm"
      }));
    },
    enabled: !!fromISO && !!toISO,
  });
}


export function useUpsertAttendanceMutation(fromISO: string, toISO: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.upsertAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.range(fromISO, toISO) });
      qc.invalidateQueries({ queryKey: qk.week(fromISO, toISO) });
    },
  });
}
