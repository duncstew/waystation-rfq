import { useEffect } from "react";
import { useGetSuppliers } from "../hooks/useGetSuppliers";
import { Supplier } from "../types/supplier";

export default function SuppliersView() {
  const { suppliers, isLoading, error, execute } = useGetSuppliers();

  useEffect(() => {
    execute();
  }, [execute]);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-medium mb-4">Suppliers</h2>

      {isLoading && <p className="text-gray-500">Loading suppliers...</p>}
      {error && (
        <p className="text-red-500">Failed to load suppliers: {error.message}</p>
      )}

      {!isLoading && suppliers.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500">
                <th className="px-4 py-2 font-medium">Company</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Payment Terms</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier: Supplier) => (
                <tr
                  key={supplier.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{supplier.company_name}</td>
                  <td className="px-4 py-2">{supplier.contact_name ?? "-"}</td>
                  <td className="px-4 py-2">{supplier.contact_email}</td>
                  <td className="px-4 py-2">{supplier.contact_phone ?? "-"}</td>
                  <td className="px-4 py-2">{supplier.payment_terms ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && suppliers.length === 0 && !error && (
        <p className="text-gray-500">No suppliers available.</p>
      )}
    </div>
  );
}