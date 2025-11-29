"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

export function useForgotPassword() {
    const qc = useQueryClient();
    return useMutation<any, any, { email: string }>({
        mutationFn: async (body: { email: string }) => {
            const res = await api.post("/user/forgot-password", body);
            return res.data;
        },
        onSuccess: (data: any) => {
            toast.success(data?.message ?? "Mã OTP đã được gửi đến email");
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Gửi OTP thất bại");
        },
    });
}

export function useResetPassword() {
    const qc = useQueryClient();
    return useMutation<any, any, { email: string; otp: string; newPassword: string; confirmNewPassword: string }>({
        mutationFn: async (body: { email: string; otp: string; newPassword: string; confirmNewPassword: string }) => {
            const res = await api.post("/user/reset-password", body);
            return res.data;
        },
        onSuccess: (data: any) => {
            toast.success(data?.message ?? "Đặt lại mật khẩu thành công");
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Đặt lại mật khẩu thất bại");
        },
    });
}
