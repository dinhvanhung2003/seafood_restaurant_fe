import LoginClient from "./LoginClient";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; redirect?: string }>;
}) {
  const sp = await searchParams;
  const back = sp?.callbackUrl ?? sp?.redirect;

  return <LoginClient back={back} />;
}
