"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
} from "lucide-react";

import {
  fetchKpis,
  fetchRevenueTrend,
  fetchTopProducts,
} from "../lib/api";

import Filters from "../components/Filters";
import RevenueChart from "../components/RevenueChart";
import TopProductsTable from "../components/TopProductsTable";

export default function Home() {
  const [filters, setFilters] = useState<any>({});
  const [kpi, setKpi] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    `$${Number(value || 0).toLocaleString()}`;

  const formatNumber = (value: number) =>
    Number(value || 0).toLocaleString();

  const query = useMemo(() => {
    const params = new URLSearchParams({
      from: "2017-01-01",
      to: "2018-01-01",
      ...filters,
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetchKpis(query),
      fetchRevenueTrend(query),
      fetchTopProducts(query),
    ])
      .then(([kpiData, trendData, topData]) => {
        setKpi(kpiData?.[0] || {});
        setTrend(Array.isArray(trendData) ? trendData : []);
        setTop(Array.isArray(topData) ? topData : []);
      })
      .catch(() => {
        setError("Error cargando datos del dashboard");
        setKpi({});
        setTrend([]);
        setTop([]);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const handleFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const hasNoData = !loading && trend.length === 0 && top.length === 0;

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black text-gray-900 dark:text-white">

      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-[-300px] right-[-200px] w-[600px] h-[600px] bg-blue-500/5 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-500" />
              Datalysis
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Business intelligence dashboard for revenue analytics
            </p>
          </div>

          <div className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur w-fit">
            2017 — 2018
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
          <Filters onChange={handleFilter} />
        </div>

        {/* ERROR */}
        {error && (
          <div className="text-sm px-4 py-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse border border-gray-200 dark:border-zinc-800"
              />
            ))
          ) : (
            <>
              <div className="rounded-xl border p-5 bg-white dark:bg-zinc-950">
                GMV <div className="text-xl">{formatCurrency(kpi?.gmv)}</div>
              </div>

              <div className="rounded-xl border p-5 bg-white dark:bg-zinc-950">
                Revenue <div className="text-xl">{formatCurrency(kpi?.revenue)}</div>
              </div>

              <div className="rounded-xl border p-5 bg-white dark:bg-zinc-950">
                Orders <div className="text-xl">{formatNumber(kpi?.orders)}</div>
              </div>

              <div className="rounded-xl border p-5 bg-white dark:bg-zinc-950">
                AOV <div className="text-xl">{formatCurrency(kpi?.aov)}</div>
              </div>
            </>
          )}
        </div>

        {/* EMPTY */}
        {hasNoData && (
          <div className="text-center py-20 text-sm text-gray-500">
            No data available for selected filters
          </div>
        )}

        {/* MAIN GRID (FIX DEFINITIVO LAYOUT) */}
        {!hasNoData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">

            {/* CHART */}
            <div className="bg-white dark:bg-zinc-950 border rounded-xl p-6 shadow-sm flex flex-col">
              <div className="text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Revenue Trend
              </div>

              {/* sin flex-1 ni min-h-0, solo deja que el chart defina su altura */}
              <div className="w-full">
                <RevenueChart data={trend} />
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-zinc-950 border rounded-xl p-6 shadow-sm h-[420px] flex flex-col">

              <div className="text-sm font-medium mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                Top Products
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="h-64 bg-gray-100 dark:bg-zinc-900 animate-pulse rounded-lg" />
                ) : (
                  <TopProductsTable data={top} />
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}