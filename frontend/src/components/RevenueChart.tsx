"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

export default function RevenueChart({ data }: any) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data || data.length === 0) {
    return (
      <div className="h-full w-full rounded-xl bg-gray-100 dark:bg-zinc-900 animate-pulse" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <XAxis
          dataKey="period"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          interval={30}  
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          }}
        />

        {/* Eje izquierdo → Revenue */}
        <YAxis
          yAxisId="revenue"
          orientation="left"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />

        {/* Eje derecho → Orders */}
        <YAxis
          yAxisId="orders"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />

        <Tooltip />
        <Legend />

        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />

        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}