"use client";

import { useEffect, useState } from "react";
import { fetchKpis, fetchRevenueTrend, fetchTopProducts } from "../lib/api";
import KpiCard from "../components/KpiCard";
import Filters from "../components/Filters";
import RevenueChart from "../components/RevenueChart";
import TopProductsTable from "../components/TopProductsTable";

export default function Home() {
  const [filters, setFilters] = useState<any>({});
  const [kpi, setKpi] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);

  const buildQuery = () => {
    const params = new URLSearchParams({
      from: "2017-01-01",
      to: "2018-01-01",
      ...filters,
    });
    return params.toString();
  };

  useEffect(() => {
    const query = buildQuery();

    fetchKpis(query).then((d) => setKpi(d[0]));
    fetchRevenueTrend(query).then(setTrend);
    fetchTopProducts(query).then(setTop);
  }, [filters]);

  const handleFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-10">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      <Filters onChange={handleFilter} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="GMV" value={`$${Number(kpi?.gmv || 0).toLocaleString()}`} />
        <KpiCard title="Revenue" value={`$${Number(kpi?.revenue || 0).toLocaleString()}`} />
        <KpiCard title="Orders" value={Number(kpi?.orders || 0).toLocaleString()} />
        <KpiCard title="AOV" value={`$${Number(kpi?.aov || 0).toLocaleString()}`} />
      </div>

      <RevenueChart data={trend} />

      <TopProductsTable data={top} />
    </div>
  );
}