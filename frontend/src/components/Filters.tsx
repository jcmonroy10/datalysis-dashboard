"use client";

import { useEffect, useState } from "react";
import { fetchFilters } from "../lib/api";

export default function Filters({ onChange }: any) {
  const [options, setOptions] = useState<any>({});

  useEffect(() => {
    fetchFilters().then(setOptions);
  }, []);

  return (
    <div className="flex gap-4 mb-6 flex-wrap">

      {/* STATES */}
      <select onChange={(e) => onChange("state", e.target.value)}>
        <option value="">Estado</option>
        {options.states?.map((s: any, i: number) => (
          <option key={s.customer_state || i} value={s.customer_state}>
            {s.customer_state}
          </option>
        ))}
      </select>

      {/* CATEGORIES */}
      <select onChange={(e) => onChange("category", e.target.value)}>
        <option value="">Categoría</option>
        {options.categories?.map((c: any, i: number) => (
          <option key={c.category || i} value={c.category}>
            {c.category}
          </option>
        ))}
      </select>

      {/* STATUS */}
      <select onChange={(e) => onChange("status", e.target.value)}>
        <option value="">Status</option>
        {options.statuses?.map((s: any, i: number) => (
          <option key={s.status || i} value={s.status}>
            {s.status}
          </option>
        ))}
      </select>

    </div>
  );
}