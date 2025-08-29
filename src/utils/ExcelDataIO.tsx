"use client";

import * as XLSX from "xlsx";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props<T> = {
  data: T[];
  fileName?: string;
  onImport: (data: T[]) => void;
  columns?: string[]; // optional: define export fields
};

export default function ExcelDataIO<T>({ data, onImport, fileName = "data.xlsx", columns }: Props<T>) {
  const handleExport = () => {
    const exportData = columns
      ? data.map((row) => {
          const filtered: Record<string, any> = {};
          columns.forEach((col) => {
            filtered[col] = (row as any)[col];
          });
          return filtered;
        })
      : data;

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, fileName);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsed = XLSX.utils.sheet_to_json<T>(sheet);
      onImport(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <label className="relative inline-flex items-center">
        <input
          className="hidden"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImport(e.target.files[0]);
          }}
        />
        <Button variant="secondary">
          <Upload className="mr-2 h-4 w-4" />
          Import Excel
        </Button>
      </label>
      <Button variant="secondary" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Xuất Excel
      </Button>
    </>
  );
}
