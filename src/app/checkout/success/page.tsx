"use client";
import { useEffect, useMemo, useState } from "react";
import ReactConfetti from "react-confetti";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  ArrowRight,
  ReceiptText,
  CreditCard,
  Copy,
  ExternalLink,
  Printer,
  ArrowLeft,
} from "lucide-react";

export default function SuccessPage() {
  const [info, setInfo] = useState<any>(null);
  const [openMeta, setOpenMeta] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Lấy thông tin từ query
    const p = new URLSearchParams(window.location.search);
    const amountNumber = Number(p.get("amount") || 0);
    setInfo({
      status: p.get("status") || "success",
      invoiceId: p.get("invoiceId") || "—",
      txnRef: p.get("txnRef") || "—",
      amount: isNaN(amountNumber) ? 0 : amountNumber,
      bankCode: p.get("bankCode") || "—",
      code: p.get("code") || "—",
    });

    const setSize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    setSize();
    window.addEventListener("resize", setSize);
    return () => window.removeEventListener("resize", setSize);
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

  const isSuccess = (info.status || "").toLowerCase() === "success";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const goPOS = () => (window.location.href = "/cashier");
  const viewInvoice = () => (window.location.href = `/invoices/${info.invoiceId}`);

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-gradient-to-b from-emerald-50/60 to-background dark:from-emerald-950/20 flex items-center justify-center p-6">
        {/* Confetti chỉ hiện khi success */}
        {isSuccess && viewport.width > 0 && (
          <ReactConfetti
            width={viewport.width}
            height={viewport.height}
            numberOfPieces={120}
            recycle={false}
          />
        )}

        <Card className="w-full max-w-2xl shadow-lg border-0 ring-1 ring-border/60">
          <CardHeader className="p-0">
            <div className="relative overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-emerald-500/10" />
              <div className="flex items-center gap-3 p-6">
                <div className="rounded-full bg-emerald-600/10 p-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                    {isSuccess ? "Thanh toán thành công" : "Kết quả giao dịch"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Cảm ơn bạn! Giao dịch đã được ghi nhận.
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(info.invoiceId)}>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(info.txnRef)}>
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
                    <Badge variant={isSuccess ? "default" : "secondary"}>
                      {String(info.status || "success").toUpperCase()}
                    </Badge>
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
              <Button variant="secondary" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> In hoá đơn
              </Button>
              <Button variant="outline" onClick={viewInvoice} className="gap-2">
                <ExternalLink className="h-4 w-4" /> Xem hoá đơn
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="ghost" onClick={() => history.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Quay lại
              </Button>
              <Button onClick={goPOS} className="gap-2">
                Tiếp tục bán hàng <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
