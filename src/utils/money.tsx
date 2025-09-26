export const currency = (n: number) =>
new Intl.NumberFormat("vi-VN", {
style: "currency",
currency: "VND",
maximumFractionDigits: 0,
}).format(n);




/**
 * Tính phút đã trôi qua từ chuỗi ISO nhưng BỎ offset/Z.
 * Ví dụ "2025-09-18T12:37:36+07:00" -> lấy "2025-09-18T12:37:36" (LOCAL)
 */
export function minsSince(iso: string) {
  if (!iso) return 0;

  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (m) {
    const [, y, mo, d, h, mi, s] = m;
    const dt = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      s ? Number(s) : 0
    ); // <- LOCAL time, không offset
    const diffMs = Date.now() - dt.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  // Fallback nếu chuỗi không đúng pattern
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}

