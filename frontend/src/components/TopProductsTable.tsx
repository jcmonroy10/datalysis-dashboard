export default function TopProductsTable({ data }: any) {
  const formatCategory = (text: string) =>
  text
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">

      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Top Products
        </h2>
      </div>

      <table className="w-full text-sm">

        <thead className="text-gray-500 bg-gray-50 dark:bg-zinc-900">
          <tr>
            <th className="text-left px-5 py-3 font-medium">Category</th>
            <th className="text-right px-5 py-3 font-medium">Value</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">

          {data.map((row: any, i: number) => (
            <tr
              key={i}
              className="hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
            >
              <td className="px-5 py-3 text-gray-900 dark:text-gray-200">
                {formatCategory(row.product_category_name)}
              </td>

              <td className="px-5 py-3 text-right font-medium text-gray-900 dark:text-gray-200">
                ${Number(row.value).toLocaleString()}
              </td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}