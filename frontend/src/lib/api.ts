const API =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL ?? "http://backend:4000"
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function handleResponse(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchKpis(params: string) {
  const res = await fetch(`${API}/kpis?${params}`, { cache: "no-store" });
  return handleResponse(res);
}

export async function fetchFilters() {
  const res = await fetch(`${API}/filters/options`, { cache: "no-store" });
  return handleResponse(res);
}

export async function fetchRevenueTrend(params: string) {
  const res = await fetch(`${API}/revenue-trend?${params}`, { cache: "no-store" });
  return handleResponse(res);
}

export async function fetchTopProducts(params: string) {
  const res = await fetch(`${API}/top-products?${params}`, { cache: "no-store" });
  return handleResponse(res);
}