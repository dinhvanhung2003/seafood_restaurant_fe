// app/auth/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; redirect?: string };
}) {
  const back = searchParams?.callbackUrl ?? searchParams?.redirect;
  return (
    <Suspense fallback={null}>
      <LoginClient back={back} />
    </Suspense>
  );
}

// (tuỳ chọn) đảm bảo không cố pre-render tĩnh
export const dynamic = "force-dynamic";
