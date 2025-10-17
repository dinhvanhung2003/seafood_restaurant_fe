import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RevenueTable({ rows, summary }: { rows: any[]; summary?: any }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nhân viên</TableHead>
          <TableHead className="text-right">Doanh thu</TableHead>
          <TableHead className="text-right">Hoàn trả</TableHead>
          <TableHead className="text-right">Doanh thu ròng</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.userId}>
            <TableCell>{r.fullName}</TableCell>
            <TableCell className="text-right">{r.revenue.toLocaleString()}</TableCell>
            <TableCell className="text-right">{r.returnValue.toLocaleString()}</TableCell>
            <TableCell className="text-right font-semibold">{r.netRevenue.toLocaleString()}</TableCell>
          </TableRow>
        ))}
        {summary && (
          <TableRow className="font-semibold bg-muted/40">
            <TableCell>Tổng cộng</TableCell>
            <TableCell className="text-right">{summary.revenue.toLocaleString()}</TableCell>
            <TableCell className="text-right">{summary.returnValue.toLocaleString()}</TableCell>
            <TableCell className="text-right">{summary.netRevenue.toLocaleString()}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
