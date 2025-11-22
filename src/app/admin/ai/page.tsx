"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Sparkles } from "lucide-react";
import api from "@/lib/axios";
import ReactMarkdown from "react-markdown";
type UiMessage = { role: "user" | "assistant"; content: string };

type SmartSqlData = { rows?: any[]; sql?: string };
type SalesPoint = { bucket: string; invoices?: number | string; gross_amount?: number | string; net_amount?: number | string; discount_amount?: number | string };
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

export default function AdminChatPanelSimple() {
  const [messages, setMessages] = useState<UiMessage[]>([
    { role: "assistant", content: "Chào bạn! Mình là Trợ lý nhà hàng. Hãy nhập câu hỏi (VD: 'Nhà hàng có bao nhiêu món?')." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extra, setExtra] = useState<ExtraData>(undefined);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Tôi là nhân viên phục vụ",
    "Tôi là thu ngân",
    "Tôi là bếp",
    "Tôi là quản lý",
    "Cho tôi xem quy định chung của nhà hàng",
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

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

    // 📌 SmartSQL / RAG / sales panel
    const data: ExtraData = res.data?.data;
    setExtra(data);

    // 📌 🔥 SUGGESTIONS FROM BACKEND
    if (Array.isArray(res.data?.suggestions)) {
      setSuggestions(res.data.suggestions);
    }

  } catch (e: any) {
    const msg = e?.response?.data?.message ?? e?.message ?? "Lỗi không xác định";
    setMessages((m) => [
      ...m,
      { role: "assistant", content: `Đã có lỗi khi gọi API: ${msg}` },
    ]);
  } finally {
    setLoading(false);
    inputRef.current?.focus();
  }
}


  return (
    <div className="p-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Trợ lý nhà hàng
            <Badge variant="outline" className="ml-2">MANAGER</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Chat area */}
          <div className="h-[55vh] overflow-y-auto rounded-md border p-3 bg-background">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm prose prose-sm dark:prose-invert
  ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent"}`}
>
  <ReactMarkdown>{m.content}</ReactMarkdown>
</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          </div>
    {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
               onClick={() => {
  // nếu muốn vừa hiển thị trong input vừa gửi luôn:
  setInput(s);
  if (!loading) {
    send(s);
  }
}}
              >
                {s}
              </Button>
            ))}
          </div>
        )}
          {/* Input row */}
          <div className="flex items-center gap-2">
          <div className="flex gap-2 mb-2">
  <Button
    variant="outline"
    onClick={() => setInput((prev) => `/rag ${prev}`)}
  >
    Tài liệu quy định
  </Button>

  <Button
    variant="outline"
    onClick={() => setInput((prev) => `/sql ${prev}`)}
  >
    Dữ liệu thật
  </Button>

  <Button
    variant="outline"
    onClick={() => setInput((prev) => `/gemini ${prev}`)}
  >
    Chat AI
  </Button>
</div>

            <Input
              ref={inputRef}
              value={input}
              placeholder="Nhập câu hỏi… (VD: 'Top 5 món bán chạy tuần này', 'Quy trình xuất hoá đơn VAT?')"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || !e.shiftKey)) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button onClick={() => send(input)} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Gửi
            </Button>
          </div>

          {/* Result panel */}
          <ResultPanel data={extra} />
        </CardContent>
      </Card>
    </div>
  );
}

function ResultPanel({ data }: { data: ExtraData }) {
  if (!data) return null;

  if (isSmartSql(data)) {
    const { sql, rows } = data;
    return (
      <div className="rounded-xl border">
        <div className="p-3 border-b">
          <div className="text-sm font-medium">Kết quả truy vấn</div>
          {sql ? <div className="mt-1 text-xs text-muted-foreground truncate">{sql}</div> : null}
        </div>
        <div className="max-h-64 overflow-auto p-3">
          <SimpleTable rows={rows || []} />
        </div>
      </div>
    );
  }

  if (isSales(data)) {
    const d = data;
    const series = d.series || [];
    return (
      <div className="rounded-xl border">
        <div className="p-3 border-b">
          <div className="text-sm font-medium">Tổng quan doanh thu ({d.by})</div>
          {d?.kpi ? (
            <div className="mt-1 text-xs text-muted-foreground">
              HĐ: {num(d.kpi?.invoices)} • Gộp: {vnd(d.kpi?.gross_amount)} • Giảm: {vnd(d.kpi?.discount_amount)} • Thuần: {vnd(d.kpi?.net_amount)}
            </div>
          ) : null}
        </div>
        <div className="max-h-64 overflow-auto p-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-4">Thời điểm</th>
                <th className="py-1 pr-4 text-right">HĐ</th>
                <th className="py-1 pr-4 text-right">Gộp</th>
                <th className="py-1 pr-4 text-right">Giảm</th>
                <th className="py-1 pr-0 text-right">Thuần</th>
              </tr>
            </thead>
            <tbody>
              {series.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1 pr-4">{fmtTime(r.bucket, d.by)}</td>
                  <td className="py-1 pr-4 text-right">{num(r.invoices)}</td>
                  <td className="py-1 pr-4 text-right">{vnd(r.gross_amount)}</td>
                  <td className="py-1 pr-4 text-right">{vnd(r.discount_amount)}</td>
                  <td className="py-1 pr-0 text-right">{vnd(r.net_amount)}</td>
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
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-2">Nguồn tham chiếu</div>
        <ul className="list-disc pl-5 text-sm">
          {sources.map((s, i) => (
            <li key={i}>
              {s.source || `#${s.index}`} {typeof s.score === "number" ? <span className="text-muted-foreground">({s.score.toFixed(3)})</span> : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

/* Helpers */
function SimpleTable({ rows }: { rows: any[] }) {
  if (!rows?.length) return <div className="text-sm text-muted-foreground">Không có dữ liệu.</div>;
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            {cols.map((c) => (
              <th key={c} className="py-1 pr-4 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {cols.map((c) => (
                <td key={c} className="py-1 pr-4">{formatCell(r[c])}</td>
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
  if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString("vi-VN") : String(v);
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
  return n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
}
function fmtTime(iso?: string, by: "hour" | "day" = "hour") {
  if (!iso) return "";
  const d = new Date(iso);
  return by === "hour"
    ? d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
