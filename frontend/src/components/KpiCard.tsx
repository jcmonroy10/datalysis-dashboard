export default function KpiCard({ title, value }: any) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-gray-500 text-sm">{title}</h2>
      <p className="text-2xl font-semibold mt-2">
        {value}
      </p>
    </div>
  );
}