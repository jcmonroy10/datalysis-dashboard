"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}