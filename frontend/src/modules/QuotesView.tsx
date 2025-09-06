// /Users/duncan/dev/personal-projects/waystation/frontend/src/modules/QuotesView.tsx
import { useEffect } from "react";
import { useGetQuotes } from "hooks/useGetQuotes";
import { FullQuote } from "types/quote";

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || typeof value === "undefined") return "-";
  return `$${value.toFixed(2)}`;
};

export default function QuotesView() {
  const { quotes, isLoading, error, execute } = useGetQuotes();

  useEffect(() => {
    execute();
  }, [execute]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">All Quotes</h2>
      </div>

      {isLoading && <p className="text-gray-500 text-center py-4">Loading quotes...</p>}
      {error && (
        <p className="text-red-500 text-center py-4">
          Failed to load quotes: {error.message}
        </p>
      )}

      {!isLoading && quotes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 text-sm text-gray-500">
                <th className="px-4 py-3 font-medium">RFQ Item</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium text-right">Price / lb</th>
                <th className="px-4 py-3 font-medium">Country of Origin</th>
                <th className="px-4 py-3 font-medium">Certifications</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote: FullQuote) => (
                <tr
                  key={quote.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{quote.rfq.item}</div>
                    <div className="font-mono text-xs text-gray-400">
                      {quote.rfq.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 py-3">{quote.supplier.company_name}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {formatCurrency(quote.price_per_pound)}
                  </td>
                  <td className="px-4 py-3">{quote.country_of_origin ?? "-"}</td>
                  <td className="px-4 py-3">
                    {quote.certifications?.length
                      ? quote.certifications.map((cert) => cert.name).join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && quotes.length === 0 && !error && (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800">No Quotes Found</h3>
          <p className="mt-2 text-gray-500">
            There are no quotes in the system yet.
          </p>
        </div>
      )}
    </div>
  );
}