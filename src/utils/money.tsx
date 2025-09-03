export const currency = (n: number) =>
new Intl.NumberFormat("vi-VN", {
style: "currency",
currency: "VND",
maximumFractionDigits: 0,
}).format(n);


export function minsSince(iso?: string) {
if (!iso) return 0;
const diff = Date.now() - new Date(iso).getTime();
return Math.max(0, Math.round(diff / 60000));
}