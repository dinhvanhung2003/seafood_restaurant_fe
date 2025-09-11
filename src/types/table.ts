// types.ts
export type Table = {
  id: string;
  name: string;
  floor: string;                 // <-- để string cho khớp tên khu vực từ API
  status: "empty" | "using";
  seats?: number;
  startedAt?: string | null;     // <-- cho phép null
  currentAmount?: number;
};
