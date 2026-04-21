"use client";

import { useEffect, useState } from "react";
import { fetchFilters } from "../lib/api";
import { Check, ChevronDown, MapPin, Grid3X3, Activity } from "lucide-react";
function Dropdown({ label, value, options, onChange, icon: Icon }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-w-[180px]">

      {/* trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {value || label}
          </span>
        </div>

        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {/* menu */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg overflow-hidden">

          <div className="max-h-60 overflow-auto">

            <div
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer text-gray-500"
            >
              All
            </div>

            {options?.map((opt: any, i: number) => (
              <div
                key={i}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  {opt.label}
                </span>

                {value === opt.value && (
                  <Check className="w-4 h-4 text-indigo-500" />
                )}
              </div>
            ))}

          </div>

        </div>
      )}
    </div>
  );
}
export default function Filters({ onChange }: any) {
  const [options, setOptions] = useState<any>({});
  const [selected, setSelected] = useState({
    state: "",
    category: "",
    status: "",
  });

  useEffect(() => {
    fetchFilters().then(setOptions);
  }, []);

  const format = (t: string) =>
    t?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const handle = (key: string, value: string) => {
    const next = { ...selected, [key]: value };
    setSelected(next);
    onChange(key, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">

      <Dropdown
        label="State"
        value={selected.state}
        icon={MapPin}
        options={options.states?.map((s: any) => ({
          label: s.customer_state,
          value: s.customer_state,
        }))}
        onChange={(v: string) => handle("state", v)}
      />

      <Dropdown
        label="Category"
        value={selected.category}
        icon={Grid3X3}
        options={options.categories?.map((c: any) => ({
          label: format(c.product_category_name),
          value: c.product_category_name,
        }))}
        onChange={(v: string) => handle("category", v)}
      />

      <Dropdown
        label="Status"
        value={selected.status}
        icon={Activity}
        options={options.statuses?.map((s: any) => ({
          label: format(s.order_status),
          value: s.order_status,
        }))}
        onChange={(v: string) => handle("status", v)}
      />

      {/* clear */}
      <button
        onClick={() => {
          setSelected({ state: "", category: "", status: "" });
          onChange("state", "");
          onChange("category", "");
          onChange("status", "");
        }}
        className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
      >
        Clear
      </button>

    </div>
  );
}