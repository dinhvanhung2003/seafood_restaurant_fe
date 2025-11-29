// app/admin/product/promotion/new/page.tsx  (SERVER)
import { Suspense } from "react";
import PromotionUpsertClient from "./PromotionUpsertClient";

export default async function Page({
  searchParams,
}: {
  // Next may supply searchParams as a Promise; await it before use
  searchParams:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) as Record<
    string,
    string | string[] | undefined
  >;
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <PromotionUpsertClient id={id} />
    </Suspense>
  );
}
