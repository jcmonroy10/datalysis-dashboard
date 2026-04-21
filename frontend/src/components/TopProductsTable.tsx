export default function TopProductsTable({ data }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-6">
      <h2 className="mb-4 font-semibold">Top Products</h2>

      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500">
            <th>Category</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} className="border-t">
              <td>{row.product_category_name}</td>
              <td>${Number(row.value).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}