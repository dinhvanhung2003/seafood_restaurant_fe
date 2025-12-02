import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

export type CreateSalesReturnPayload = {
  invoiceId: string;
  refundMethod: string; // "CASH" | "TRANSFER" ...
  note?: string | null;
  items: {
    orderItemId: string;
    qty: number;
    reason?: string;
  }[];
};

export function useCreateReturn() {
  return useMutation({
    mutationFn: async (payload: CreateSalesReturnPayload) => {
      const { data } = await api.post("/returns", payload);
      return data;
    },
    onError: (err: any) => {
      // log full đối tượng lỗi
      console.error("Create return error RAW:", err);

      if (axios.isAxiosError(err)) {
        console.error("Axios error response:", err.response);
      }

      const msg =
        (axios.isAxiosError(err) && err.response?.data?.message) ||
        err?.message ||
        "Không tạo được phiếu trả hàng";

      toast.error("Tạo phiếu trả hàng thất bại", { description: msg });
    },
  });
}
