// app/admin/product/promotion/new/PromotionUpsertClient.tsx  (CLIENT)
"use client";

import { useRouter } from "next/navigation";
import PromotionCreateForm, { PromotionFormValues } from "@/components/admin/product/promotion/PromotionCreateForm";
import { useCreatePromotionMutation, usePromotionDetailQuery, useUpdatePromotionMutation } from "@/hooks/admin/usePromotion";
import { mapPromotionDetailToForm } from "@/utils/mapPromotion";

export default function PromotionUpsertClient({ id }: { id?: string }) {
  const router = useRouter();
  const isEdit = Boolean(id);

  const detailQ = usePromotionDetailQuery(isEdit ? id : undefined);
  const create = useCreatePromotionMutation();
  const update = useUpdatePromotionMutation();

  const initialValues =
    isEdit && detailQ.data ? mapPromotionDetailToForm(detailQ.data) : undefined;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">
        {isEdit ? "Sửa khuyến mãi" : "Tạo khuyến mãi"}
      </h2>

      {isEdit && detailQ.isLoading ? (
        <div>Đang tải chi tiết…</div>
      ) : isEdit && detailQ.error ? (
        <div className="text-red-600">
          Không tải được chi tiết: {String(detailQ.error.message)}
        </div>
      ) : (
        <PromotionCreateForm
          key={id || "create"}
          mode={isEdit ? "edit" : "create"}
          initialValues={initialValues}
          onSubmit={async (dto) => {
            try {
              if (isEdit && id) {
                await update.mutateAsync({ id, data: dto });
              } else {
                await create.mutateAsync(dto);
              }
              router.push("/admin/product/promotion");
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}
    </div>
  );
}
