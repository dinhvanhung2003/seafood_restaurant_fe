"use client";

import React from "react";
import CustomerFilter from "@/components/admin/report/customer/CustomerFilter";
import useCustomerReport from "@/hooks/admin/useCustomerReport";
import CustomerTable from "@/components/admin/report/customer/CustomerTable";

export default function CustomerReportPage() {
  const hook = useCustomerReport();
  const {
    date,
    setDate,
    customerQ,
    setCustomerQ,
    rows,
    summary,
    top10Customers,
    meta,
    setPage,
    page,
    loading,
    fetchReport,
    limit,
  } = hook;

  return (
    <div className="space-y-6">
      <CustomerFilter
        date={date}
        setDate={setDate}
        customerQ={customerQ}
        setCustomerQ={setCustomerQ}
      />
      <CustomerTable
        rows={rows}
        summary={summary}
        top10Customers={top10Customers}
        meta={meta as any}
        page={page}
        setPage={setPage}
        loading={loading}
        limit={limit}
      />
    </div>
  );
}
