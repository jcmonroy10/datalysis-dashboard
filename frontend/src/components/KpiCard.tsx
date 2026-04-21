export default function KpiCard({ title, value }: any) {
  return (
    <div className="group relative rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 transition hover:-translate-y-0.5 hover:shadow-md">

      {/* subtle top glow */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition" />

      <p className="text-xs text-gray-500 uppercase tracking-wide">
        {title}
      </p>

      <p className="text-2xl font-semibold mt-2 text-gray-900 dark:text-white">
        {value}
      </p>

    </div>
  );
}