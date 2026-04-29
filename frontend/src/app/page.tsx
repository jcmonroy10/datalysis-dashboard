"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";

import {
  fetchKpis,
  fetchRevenueTrend,
  fetchTopProducts,
} from "../lib/api";

import Filters from "../components/Filters";
import RevenueChart from "../components/RevenueChart";
import TopProductsTable from "../components/TopProductsTable";

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<any>({});
  const [kpi, setKpi] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [metric, setMetric] = useState<"gmv" | "revenue">("revenue");

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const formatDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [dateRange, setDateRange] = useState({
    from: formatDate(thirtyDaysAgo),
    to: formatDate(today),
  });

  const [debouncedBaseQuery, setDebouncedBaseQuery] = useState("");
  const [debouncedTopQuery, setDebouncedTopQuery] = useState("");

  const cardClass =
    "bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-sm";

  const formatCurrency = (value: number) =>
    `$${Number(value || 0).toLocaleString()}`;

  const formatNumber = (value: number) =>
    Number(value || 0).toLocaleString();

  const hasDateRange = !!dateRange.from && !!dateRange.to;

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const newFilters: any = {};
    ["state", "category", "status"].forEach((key) => {
      const val = params.get(key);
      if (val) newFilters[key] = val;
    });
    setFilters(newFilters);
    setDateRange({
      from: params.get("from") || formatDate(thirtyDaysAgo),
      to: params.get("to") || formatDate(today),
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value as string);
    });
    router.replace(`?${params.toString()}`);
  }, [filters, dateRange, router]);

  useEffect(() => {
    if (!dateRange.from || !dateRange.to) {
      setError(null);
      return;
    }
    if (dateRange.from >= dateRange.to) {
      setError("La fecha 'From' debe ser anterior a la fecha 'To'");
    } else {
      setError(null);
    }
  }, [dateRange]);
    const baseQuery = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return "";
    if (dateRange.from >= dateRange.to) return "";
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateRange.from) || !dateRegex.test(dateRange.to)) return "";

    const params = new URLSearchParams();
    params.append("from", dateRange.from);
    params.append("to", dateRange.to);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    return params.toString();
  }, [filters, dateRange]);

  const topQuery = useMemo(() => {
    if (!baseQuery) return "";
    const params = new URLSearchParams(baseQuery);
    params.set("metric", metric);
    return params.toString();
  }, [baseQuery, metric]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBaseQuery(baseQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [baseQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTopQuery(topQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [topQuery]);

  // fetch kpis + trend
  useEffect(() => {
    if (!debouncedBaseQuery) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setKpi(null);
    setTrend([]);

    Promise.all([fetchKpis(debouncedBaseQuery), fetchRevenueTrend(debouncedBaseQuery)])
      .then(([kpiData, trendData]) => {
        if (!isMounted) return;
        setKpi(kpiData?.[0] ?? null);
        setTrend(Array.isArray(trendData) ? trendData : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Error cargando datos del dashboard");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [debouncedBaseQuery]);

  // fetch top products
  useEffect(() => {
    if (!debouncedTopQuery) return;

    let isMounted = true;
    setTableLoading(true);
    setTop([]);

    fetchTopProducts(debouncedTopQuery)
      .then((data) => {
        if (!isMounted) return;
        setTop(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError((prev) => prev ?? (err.message || "Error cargando top productos"));
      })
      .finally(() => {
        if (isMounted) setTableLoading(false);
      });

    return () => { isMounted = false; };
  }, [debouncedTopQuery]);

  const handleFilter = (key: string, value: string | string[]) => {
    setFilters((prev: any) => {
      const prevValue = prev[key];
      if (JSON.stringify(prevValue) === JSON.stringify(value)) return prev;
      return { ...prev, [key]: value };
    });
  };

  const handleClear = () => {
    setFilters({});
    setDateRange({ from: formatDate(thirtyDaysAgo), to: formatDate(today) });
    router.replace("?");
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 dark:text-zinc-600">
      <BarChart3 className="w-8 h-8" />
      <p className="text-sm">No data for selected filters</p>
    </div>
  );

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
              Dashboard
            </h1>
          </div>
        </div>

        {/* FILTERS */}
        <div className={`${cardClass} p-5`}>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
              />
            </div>
            <Filters
              onChange={handleFilter}
              onClear={handleClear}
              initialValues={filters}
            />
          </div>
        </div>

        {/* NO DATE RANGE SELECTED */}
        {!hasDateRange && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400 dark:text-zinc-600">
            <CalendarDays className="w-12 h-12" />
            <p className="text-base">Select a date range to load the dashboard</p>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {hasDateRange && (
          <>
            {/* ERROR */}
            {error && (
              <div className="text-sm px-4 py-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          <div className={`${error ? "opacity-40 pointer-events-none select-none" : ""} space-y-10`}>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse border border-gray-200 dark:border-zinc-800" />
                ))
              ) : (
                <>
                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> GMV
                    </div>
                    <div className="text-xl font-semibold mt-1">{formatCurrency(kpi?.gmv)}</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Revenue
                    </div>
                    <div className="text-xl font-semibold mt-1">{formatCurrency(kpi?.revenue)}</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-purple-500" /> Orders
                    </div>
                    <div className="text-xl font-semibold mt-1">{formatNumber(kpi?.orders)}</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-500" /> AOV
                    </div>
                    <div className="text-xl font-semibold mt-1">{formatCurrency(kpi?.aov)}</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" /> IPO
                    </div>
                    <div className="text-xl font-semibold mt-1">{(kpi?.ipo || 0).toFixed(2)}</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" /> Cancel Rate
                    </div>
                    <div className="text-xl font-semibold mt-1">{((kpi?.cancel_rate || 0) * 100).toFixed(1)}%</div>
                  </div>

                  <div className={`${cardClass} p-5`}>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" /> On-Time
                    </div>
                    <div className="text-xl font-semibold mt-1">{((kpi?.on_time_rate || 0) * 100).toFixed(1)}%</div>
                  </div>
                </>
              )}
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">

              {/* CHART */}
              <div className={`${cardClass} p-6 h-[380px] flex flex-col`}>
                <div className="text-sm font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Revenue Trend
                </div>
                <div className="flex-1">
                  {loading && (
                    <div className="h-full w-full rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse" />
                  )}
                  {!loading && trend.length === 0 && <EmptyState />}
                  {!loading && trend.length > 0 && <RevenueChart data={trend} />}
                </div>
              </div>

              {/* TABLE */}
              <div className={`${cardClass} p-6 h-[380px] flex flex-col`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    Top Products
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMetric("revenue")}
                      className={`px-3 py-1 text-xs rounded-lg border transition ${
                        metric === "revenue"
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      onClick={() => setMetric("gmv")}
                      className={`px-3 py-1 text-xs rounded-lg border transition ${
                        metric === "gmv"
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
                      }`}
                    >
                      GMV
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {tableLoading && (
                    <div className="h-full w-full rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse" />
                  )}
                  {!tableLoading && top.length === 0 && <EmptyState />}
                  {!tableLoading && top.length > 0 && <TopProductsTable data={top} />}
                </div>
              </div>

            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}