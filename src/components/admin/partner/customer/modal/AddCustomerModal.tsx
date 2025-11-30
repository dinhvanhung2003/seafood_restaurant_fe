"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateCustomer } from "@/hooks/admin/useCustomer";
import {
  createCustomerSchema,
  CreateCustomerInput,
} from "@/shared/schemas/customer";

type CustomerType = "PERSONAL" | "COMPANY";
type Gender = "MALE" | "FEMALE" | "OTHER";

export default function AddCustomerModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (customer: any) => void;
}) {
  const create = useCreateCustomer();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      type: "PERSONAL",
      name: "",
      code: "",
      companyName: "",
      phone: "",
      email: "",
      gender: undefined,
      birthday: "",
      address: "",
      province: "",
      district: "",
      ward: "",
      taxNo: "",
      identityNo: "",
      note: "",
    },
  });

  const type = watch("type");

  const onSubmit = async (values: CreateCustomerInput) => {
    const payload: any = {
      ...values,
      code: values.code?.trim() || undefined,
      companyName:
        values.type === "COMPANY"
          ? values.companyName?.trim() || undefined
          : undefined,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      taxNo: values.taxNo?.trim() || undefined,
      identityNo: values.identityNo?.trim() || undefined,
      birthday: values.birthday || undefined,
      address: values.address?.trim() || undefined,
      province: values.province?.trim() || undefined,
      district: values.district?.trim() || undefined,
      ward: values.ward?.trim() || undefined,
      note: values.note?.trim() || undefined,
    };

    try {
      const customer = await create.mutateAsync(payload);
      toast.success("Tạo khách hàng thành công");
      onCreated?.(customer);
      onOpenChange(false);
      reset();
    } catch {
      // onError đã toast
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw] max-w-4xl 
          max-h-[90vh] overflow-y-auto 
          p-4 sm:p-6
        "
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold">
            Thêm khách hàng
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar + Form 2 cột trên màn hình rộng */}
          <div className="grid gap-6 md:grid-cols-[160px,minmax(0,1fr)] items-start">
            {/* Avatar vùng trái (placeholder)
            <div className="flex flex-col items-center gap-3">
              <div className="h-28 w-28 rounded-full border bg-muted" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled
              >
                Chọn ảnh
              </Button>
            </div> */}

            {/* Form vùng phải */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Loại khách */}
              <div className="sm:col-span-2">
                <Label>Loại khách</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as CustomerType)}
                      className="mt-2 flex flex-wrap gap-4"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="PERSONAL" /> Cá nhân
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="COMPANY" /> Công ty
                      </label>
                    </RadioGroup>
                  )}
                />
                {errors.type && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <Field label="Mã khách hàng" error={errors.code?.message}>
                <Input placeholder="Mặc định" {...register("code")} />
              </Field>

              <Field
                label={type === "COMPANY" ? "Công ty" : "Chi nhánh"}
                error={errors.companyName?.message}
              >
                <Input
                  {...register("companyName")}
                  disabled={type !== "COMPANY"}
                />
              </Field>

              <Field
                label="Tên khách hàng/Công ty"
                error={errors.name?.message}
                className="sm:col-span-2"
              >
                <Input {...register("name")} />
              </Field>

              <Field label="Điện thoại" error={errors.phone?.message}>
                <Input {...register("phone")} />
              </Field>

              <Field
                label="Căn cước công dân"
                error={errors.identityNo?.message}
              >
                <Input {...register("identityNo")} />
              </Field>

              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </Field>

              <Field label="Ngày sinh" error={errors.birthday?.message}>
                <Input type="date" {...register("birthday")} />
              </Field>

              {/* Giới tính */}
              <div className="space-y-1">
                <Label>Giới tính</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value || ""}
                      onValueChange={(v) =>
                        field.onChange((v || undefined) as Gender | undefined)
                      }
                      className="mt-2 grid grid-cols-2 gap-3"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="MALE" /> Nam
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="FEMALE" /> Nữ
                      </label>
                    </RadioGroup>
                  )}
                />
                {errors.gender && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.gender.message as string}
                  </p>
                )}
              </div>

              <Field label="Mã số thuế" error={errors.taxNo?.message}>
                <Input {...register("taxNo")} />
              </Field>

              <Field
                label="Địa chỉ"
                error={errors.address?.message}
                className="sm:col-span-2"
              >
                <Input {...register("address")} />
              </Field>

              <Field
                label="Tỉnh / Thành phố"
                error={errors.province?.message}
              >
                <Input {...register("province")} />
              </Field>

              <Field label="Quận / Huyện" error={errors.district?.message}>
                <Input {...register("district")} />
              </Field>

              <Field label="Phường / Xã" error={errors.ward?.message}>
                <Input {...register("ward")} />
              </Field>

              <Field
                label="Ghi chú"
                error={errors.note?.message}
                className="sm:col-span-2"
              >
                <Input {...register("note")} />
              </Field>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" type="button" onClick={handleClose}>
              Bỏ qua
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
  error,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div
      className={[
        "space-y-1 min-w-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Label className="text-[13px]">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
