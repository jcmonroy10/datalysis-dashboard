"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { fetchFilters } from "../lib/api";
import {
  Check,
  ChevronDown,
  MapPin,
  Grid3X3,
  Activity,
  Search,
} from "lucide-react";

function Dropdown({ label, value = [], options = [], onChange, icon: Icon }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = options.filter((opt: any) =>
    value?.includes(opt.value)
  );

  const filteredOptions = useMemo(() => {
    if (!search) return options;

    return options.filter((opt: any) => {
      const label = String(opt?.label || "").toLowerCase();
      return label.includes(search.toLowerCase());
    });
  }, [search, options]);

  return (
    <div ref={ref} className="relative min-w-[180px]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
            {selectedOptions.length > 0
              ? selectedOptions.map((o: any) => o.label).join(", ")
              : label}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      <div
        className={`
          absolute z-50 mt-2 w-full rounded-xl border 
          border-gray-200 dark:border-zinc-800 
          bg-white dark:bg-zinc-950 shadow-lg overflow-hidden
          transition-all duration-200 ease-out
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="p-2 border-b border-gray-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-zinc-900">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
            />
          </div>
        </div>

        <div className="max-h-60 overflow-auto">
          <div
            onClick={() => {
              onChange([]);
              setSearch("");
              setOpen(false);
            }}
            className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer text-gray-500"
          >
            All
          </div>

          {filteredOptions.map((opt: any, i: number) => {
            const isSelected = value?.includes(opt.value);
            return (
              <div
                key={i}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                className="px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-zinc-900 cursor-pointer"
              >
                <span className="text-gray-700 dark:text-gray-200">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
              </div>
            );
          })}

          {filteredOptions.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Filters({ onChange, onClear, initialValues }: any) {
  const [options, setOptions] = useState<any>({});
  const [selected, setSelected] = useState({
    state: [] as string[],
    category: [] as string[],
    status: [] as string[],
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchFilters().then(setOptions);
  }, []);

  // ✅ FIX: compara antes de setSelected para evitar infinite loop
  useEffect(() => {
    if (!initialValues) return;

    const newState = Array.isArray(initialValues.state)
      ? initialValues.state
      : initialValues.state ? [initialValues.state] : [];
    const newCategory = Array.isArray(initialValues.category)
      ? initialValues.category
      : initialValues.category ? [initialValues.category] : [];
    const newStatus = Array.isArray(initialValues.status)
      ? initialValues.status
      : initialValues.status ? [initialValues.status] : [];

    setSelected((prev) => {
      const sameState    = JSON.stringify(prev.state)    === JSON.stringify(newState);
      const sameCategory = JSON.stringify(prev.category) === JSON.stringify(newCategory);
      const sameStatus   = JSON.stringify(prev.status)   === JSON.stringify(newStatus);

      // Si no cambió nada, devuelve el mismo objeto → React no re-renderiza
      if (sameState && sameCategory && sameStatus) return prev;

      return { state: newState, category: newCategory, status: newStatus };
    });
  }, [initialValues]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange("state", selected.state);
    onChange("category", selected.category);
    onChange("status", selected.status);
  }, [selected]);

  const format = (t: string) =>
    t?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const handle = (key: string, value: string) => {
    setSelected((prev: any) => {
      const exists = prev[key].includes(value);
      const updated = exists
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value];
      return { ...prev, [key]: updated };
    });
  };

  const handleClear = () => {
    setSelected({ state: [], category: [], status: [] });
    if (onClear) onClear();
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
      <button
        onClick={handleClear}
        className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 transition"
      >
        Clear
      </button>
    </div>
  );
}