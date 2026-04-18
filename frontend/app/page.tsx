import { ArrowUpRight, DollarSign, ShoppingCart } from "lucide-react";

async function getKpis() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/kpis?from=2017-01-01&to=2018-01-01`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Error al obtener KPIs");
  }

  return res.json();
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export default async function Home() {
  const data = await getKpis();
  const kpi = data[0];

  return (
    <div className="min-h-screen bg-zinc-100 p-10">
      
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-500 text-sm">
            Resumen general del negocio
          </p>
        </div>

        <div className="text-sm text-zinc-500">
          2017 - 2018
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* GMV */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-zinc-500">GMV</h2>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>

          <p className="text-3xl font-bold mt-3">
            {formatCurrency(Number(kpi.gmv))}
          </p>

          <div className="flex items-center text-green-500 text-sm mt-2">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            +12.5%
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-zinc-500">Revenue</h2>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>

          <p className="text-3xl font-bold mt-3">
            {formatCurrency(Number(kpi.revenue))}
          </p>

          <div className="flex items-center text-green-500 text-sm mt-2">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            +8.2%
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-zinc-500">Orders</h2>
            <ShoppingCart className="w-5 h-5 text-purple-500" />
          </div>

          <p className="text-3xl font-bold mt-3">
            {Number(kpi.orders).toLocaleString()}
          </p>

          <div className="flex items-center text-green-500 text-sm mt-2">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            +5.1%
          </div>
        </div>

      </div>

      {/* Placeholder para lo siguiente */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">
          Próximamente: gráficos 📈
        </h2>
        <p className="text-zinc-500 text-sm">
          Aquí puedes agregar ventas por fecha, categorías, etc.
        </p>
      </div>

    </div>
  );
}