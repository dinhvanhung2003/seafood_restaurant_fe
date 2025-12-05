"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import api from "@/lib/axios";
import ReactMarkdown from "react-markdown";

type UiMessage = { role: "user" | "assistant"; content: string };

type SmartSqlData = { rows?: any[]; sql?: string };
type SalesPoint = {
  bucket: string;
  invoices?: number | string;
  gross_amount?: number | string;
  net_amount?: number | string;
  discount_amount?: number | string;
};
type SalesPayload = { by: "hour" | "day"; series: SalesPoint[]; kpi?: Record<string, any> };
type RagPayload = { sources?: Array<{ index: number; score?: number; source?: string }> };
type ExtraData = SmartSqlData | SalesPayload | RagPayload | undefined;

function isSmartSql(d: ExtraData): d is SmartSqlData {
  return !!d && typeof d === "object" && Array.isArray((d as any).rows);
}
function isSales(d: ExtraData): d is SalesPayload {
  return !!d && typeof d === "object" && Array.isArray((d as any).series);
}
function isRag(d: ExtraData): d is RagPayload {
  return !!d && typeof d === "object" && Array.isArray((d as any).sources);
}

export default function AdminChatWidget() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: "assistant",
      content:
        "Chào bạn! Mình là Trợ lý nhà hàng. Hãy nhập câu hỏi (VD: `Nhà hàng có bao nhiêu món?`).",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extra, setExtra] = useState<ExtraData>(undefined);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    setLoading(true);
    setExtra(undefined);

    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");

    try {
      const res = await api.post("/api/ai/chat", {
        messages: next.map(({ role, content }) => ({ role, content })),
      });

      const role = (res.data?.role as UiMessage["role"]) ?? "assistant";
      const content =
        typeof res.data?.content === "string"
          ? res.data.content
          : JSON.stringify(res.data);
      setMessages((m) => [...m, { role, content }]);

      const data: ExtraData = res.data?.data;
      setExtra(data);
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ?? e?.message ?? "Lỗi không xác định";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Đã có lỗi khi gọi API: ${msg}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // Nút bong bóng (khi đóng)
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)]">
          <Card className="shadow-2xl border border-border">
            <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Trợ lý nhà hàng
                </CardTitle>
                <Badge variant="outline" className="ml-1 text-[10px]">
                  MANAGER
                </Badge>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-2 px-3 pb-3">
              {/* Chat area */}
              <div className="h-72 overflow-y-auto rounded-md border p-2 bg-background">
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm prose prose-sm dark:prose-invert max-w-none
                        ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent"
                        }`}
                      >
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
              </div>

              {/* Quick mode buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                //   size="xs"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setInput((prev) => `/rag ${prev}`)}
                >
                  Tài liệu quy định
                </Button>

                <Button
                  variant="outline"
                //   size="xs"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setInput((prev) => `/sql ${prev}`)}
                >
                  Dữ liệu thật
                </Button>

                <Button
                  variant="outline"
                //   size="xs"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setInput((prev) => `/gemini ${prev}`)}
                >
                  Chat AI
                </Button>
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  placeholder="Hỏi: doanh thu, món bán chạy, quy trình..."
                  className="h-9 text-xs"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || !e.shiftKey)) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => send(input)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Panel kết quả phụ (SQL / sales / RAG) */}
              <ResultPanel data={extra} />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/* ========= ResultPanel & helpers giữ nguyên logic ========= */

function ResultPanel({ data }: { data: ExtraData }) {
  if (!data) return null;

  if (isSmartSql(data)) {
    const { sql, rows } = data;
    return (
      <div className="rounded-xl border mt-2">
        <div className="p-2 border-b">
          <div className="text-xs font-medium">Kết quả truy vấn</div>
          {sql ? (
            <div className="mt-1 text-[10px] text-muted-foreground truncate">
              {sql}
            </div>
          ) : null}
        </div>
        <div className="max-h-40 overflow-auto p-2">
          <SimpleTable rows={rows || []} />
        </div>
      </div>
    );
  }

  if (isSales(data)) {
    const d = data;
    const series = d.series || [];
    return (
      <div className="rounded-xl border mt-2">
        <div className="p-2 border-b">
          <div className="text-xs font-medium">
            Tổng quan doanh thu ({d.by})
          </div>
          {d?.kpi ? (
            <div className="mt-1 text-[11px] text-muted-foreground">
              HĐ: {num(d.kpi?.invoices)} • Gộp: {vnd(d.kpi?.gross_amount)} •
              Giảm: {vnd(d.kpi?.discount_amount)} • Thuần:{" "}
              {vnd(d.kpi?.net_amount)}
            </div>
          ) : null}
        </div>
        <div className="max-h-40 overflow-auto p-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[10px] text-muted-foreground">
                <th className="py-1 pr-2">Thời điểm</th>
                <th className="py-1 pr-2 text-right">HĐ</th>
                <th className="py-1 pr-2 text-right">Gộp</th>
                <th className="py-1 pr-2 text-right">Giảm</th>
                <th className="py-1 pr-0 text-right">Thuần</th>
              </tr>
            </thead>
            <tbody>
              {series.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-2">
                    {fmtTime(r.bucket, d.by)}
                  </td>
                  <td className="py-1 pr-2 text-right">
                    {num(r.invoices)}
                  </td>
                  <td className="py-1 pr-2 text-right">
                    {vnd(r.gross_amount)}
                  </td>
                  <td className="py-1 pr-2 text-right">
                    {vnd(r.discount_amount)}
                  </td>
                  <td className="py-1 pr-0 text-right">
                    {vnd(r.net_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isRag(data)) {
    const sources = data.sources || [];
    if (!sources.length) return null;
    return (
      <div className="rounded-xl border p-2 mt-2">
        <div className="text-xs font-medium mb-1">Nguồn tham chiếu</div>
        <ul className="list-disc pl-4 text-[11px]">
          {sources.map((s, i) => (
            <li key={i}>
              {s.source || `#${s.index}`}{" "}
              {typeof s.score === "number" ? (
                <span className="text-muted-foreground">
                  ({s.score.toFixed(3)})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function SimpleTable({ rows }: { rows: any[] }) {
  if (!rows?.length)
    return (
      <div className="text-xs text-muted-foreground">
        Không có dữ liệu.
      </div>
    );
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] text-muted-foreground">
            {cols.map((c) => (
              <th key={c} className="py-1 pr-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {cols.map((c) => (
                <td key={c} className="py-1 pr-3">
                  {formatCell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: any) {
  if (v == null) return "";
  if (typeof v === "number")
    return Number.isFinite(v) ? v.toLocaleString("vi-VN") : String(v);
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    return isNaN(+d) ? v : d.toLocaleString("vi-VN");
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
function num(v: any) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n.toLocaleString("vi-VN") : String(v ?? "");
}
function vnd(v: any) {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  if (!Number.isFinite(n)) return String(v ?? "");
  return n.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}
function fmtTime(iso?: string, by: "hour" | "day" = "hour") {
  if (!iso) return "";
  const d = new Date(iso);
  return by === "hour"
    ? d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
}
