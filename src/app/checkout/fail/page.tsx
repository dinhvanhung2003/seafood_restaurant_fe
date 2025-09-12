"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card, CardHeader, CardContent, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  XCircle, ArrowRight, ReceiptText, CreditCard, Copy, ExternalLink, Printer, ArrowLeft, AlertCircle,
} from "lucide-react";

export default function FailPage() {
  const [info, setInfo] = useState<any>(null);
  const [openMeta, setOpenMeta] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const amountNumber = Number(p.get("amount") || 0);
    setInfo({
      status: (p.get("status") || "fail").toLowerCase(),
      invoiceId: p.get("invoiceId") || "—",
      txnRef: p.get("txnRef") || "—",
      amount: isNaN(amountNumber) ? 0 : amountNumber,
      bankCode: p.get("bankCode") || "—",
      code: p.get("code") || "—", // vnp_ResponseCode (nếu có)
    });
  }, []);

  const amountVND = useMemo(() => {
    if (!info) return "";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(info.amount);
    } catch {
      return `${(info.amount || 0).toLocaleString("vi-VN")} đ`;
    }
  }, [info]);

  if (!info) return null;

  // map một vài mã phổ biến của VNPay (tham khảo)
  const codeMeaning: Record<string, string> = {
    "24": "Người dùng đã hủy giao dịch",
    "07": "Nghi ngờ gian lận – từ chối",
    "12": "Giao dịch không hợp lệ",
    "51": "Tài khoản không đủ số dư",
    "65": "Vượt hạn mức giao dịch",
    "09": "Thẻ/TK bị khóa",
    "10": "Sai OTP",
    "11": "Sai mật khẩu",
    "75": "Nhập sai OTP quá số lần",
    "99": "Lỗi chưa xác định",
  };
  const humanReason =
    codeMeaning[String(info.code)] ||
    (info.status === "cancel" ? "Bạn đã hủy giao dịch" : "Giao dịch không thành công");

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const goPOS = () => (window.location.href = "/cashier");
  const retry = () => (window.location.href = "/checkout"); // đổi sang route checkout của bạn
  const viewInvoice = () =>
    info.invoiceId !== "—" ? (window.location.href = `/invoices/${info.invoiceId}`) : undefined;

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-gradient-to-b from-rose-50/60 to-background dark:from-rose-950/20 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-lg border-0 ring-1 ring-border/60">
          <CardHeader className="p-0">
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-rose-500/10" />
              <div className="flex items-center gap-3 p-6">
                <div className="rounded-full bg-rose-600/10 p-2">
                  <XCircle className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                    Thanh toán thất bại
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {humanReason}. Vui lòng thử lại hoặc chọn phương thức khác.
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary" className="text-xs">
                    {info.bankCode}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {/* Banner cảnh báo ngắn */}
            <div className="flex items-start gap-3 rounded-lg border border-rose-200/60 bg-rose-50 px-3 py-2 text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-sm">
                Giao dịch không được hoàn tất. Nếu tiền đã trừ, khoản tiền sẽ tự động hoàn về theo quy định của ngân hàng.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Mã hoá đơn</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-medium text-base">{info.invoiceId}</p>
                  {info.invoiceId !== "—" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copy(info.invoiceId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy mã hoá đơn</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Số tiền</span>
                </div>
                <p className="mt-1 text-lg md:text-xl font-semibold">{amountVND}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Mã giao dịch</span>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-medium">{info.txnRef}</p>
                  {info.txnRef !== "—" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copy(info.txnRef)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy mã giao dịch</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Kênh thanh toán</span>
                <p className="mt-1 font-medium">{info.bankCode}</p>
              </div>
            </div>

            <Collapsible open={openMeta} onOpenChange={setOpenMeta}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chi tiết khác</span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Xem thêm
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <Badge variant="secondary">{String(info.status || "fail").toUpperCase()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mã phản hồi</span>
                    <span className="font-medium">{info.code}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-6">
            <div className="flex items-center gap-2">
              {info.invoiceId !== "—" && (
                <Button variant="outline" onClick={viewInvoice} className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Xem hoá đơn
                </Button>
              )}
              <Button variant="secondary" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> In biên nhận
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="ghost" onClick={() => history.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
              <Button onClick={retry} className="gap-2">
                Thử thanh toán lại <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goPOS} className="gap-2">
                Về POS <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
