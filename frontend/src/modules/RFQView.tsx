// src/modules/RFQView.tsx

import { useEffect, useState } from "react";
import { useGetRFQs } from "hooks/useGetRFQs";
import { RFQ, RFQCreatePayload } from "types/rfq";
import Modal from "components/Modal";
import { useCreateRFQ } from "hooks/useCreateRFQ";
import { TbPlus } from "react-icons/tb";

interface RFQsViewProps {
  onRfqSelect: (rfq: RFQ) => void;
}

const INITIAL_FORM_STATE: RFQCreatePayload = {
  item: "",
  due_date: null,
  amount_required_lbs: null,
  ship_to_location: "",
  required_certifications: [],
};

export default function RFQsView({ onRfqSelect }: RFQsViewProps) {
  const { rfqs, isLoading, error, execute: fetchRfqs } = useGetRFQs();
  const {
    isLoading: isCreating,
    error: createError,
    execute: createRfq,
  } = useCreateRFQ();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRfqData, setNewRfqData] =
    useState<RFQCreatePayload>(INITIAL_FORM_STATE);
  const [certInput, setCertInput] = useState("");

  useEffect(() => {
    fetchRfqs();
  }, [fetchRfqs]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setNewRfqData((prev) => ({
      ...prev,
      [name]: type === "number" && value ? parseFloat(value) : value,
    }));
  };

  const handleOpenModal = () => {
    setNewRfqData(INITIAL_FORM_STATE);
    setCertInput("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async () => {
    const payload: RFQCreatePayload = {
      ...newRfqData,
      amount_required_lbs: newRfqData.amount_required_lbs || null,
      due_date: newRfqData.due_date || null,
      required_certifications: certInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    };

    try {
      await createRfq(payload);
      handleCloseModal();
      fetchRfqs(); // Refresh the list
    } catch (e) {
      console.error("Failed to create RFQ:", e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Requests for Quote (RFQs)</h2>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <TbPlus size={20} />
          New RFQ
        </button>
      </div>

      {isLoading && <p className="text-gray-500">Loading RFQs...</p>}
      {error && (
        <p className="text-red-500">Failed to load RFQs: {error.message}</p>
      )}

      {!isLoading && rfqs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200 text-gray-500">
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Item</th>
                <th className="px-4 py-2 font-medium">Due Date</th>
                <th className="px-4 py-2 font-medium text-right">
                  Amount (lbs)
                </th>
                <th className="px-4 py-2 font-medium">Ship To</th>
                <th className="px-4 py-2 font-medium">Certifications</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((rfq: RFQ) => (
                <tr
                  key={rfq.id}
                  // 👇 Add onClick handler and cursor styling
                  className="border-b border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => onRfqSelect(rfq)}
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {rfq.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {rfq.item}
                  </td>
                  <td className="px-4 py-2">
                    {rfq.due_date
                      ? new Date(rfq.due_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rfq.amount_required_lbs?.toLocaleString() ?? "-"}
                  </td>
                  <td className="px-4 py-2">{rfq.ship_to_location ?? "-"}</td>
                  <td className="px-4 py-2">
                    {rfq.required_certifications?.length
                      ? rfq.required_certifications
                          .map((cert) => cert.name)
                          .join(", ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && rfqs.length === 0 && !error && (
        <p className="text-gray-500">No RFQs available.</p>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create a New Request for Quote"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="item"
              className="block text-sm font-medium text-gray-700"
            >
              Item Name
            </label>
            <input
              type="text"
              name="item"
              id="item"
              value={newRfqData.item}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2" // <-- Added py-2
              required
            />
          </div>

          <div>
            <label
              htmlFor="amount_required_lbs"
              className="block text-sm font-medium text-gray-700"
            >
              Amount Required (lbs)
            </label>
            <input
              type="number"
              name="amount_required_lbs"
              id="amount_required_lbs"
              value={newRfqData.amount_required_lbs ?? ""}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2" // <-- Added py-2
            />
          </div>

          <div>
            <label
              htmlFor="ship_to_location"
              className="block text-sm font-medium text-gray-700"
            >
              Ship To Location
            </label>
            <input
              type="text"
              name="ship_to_location"
              id="ship_to_location"
              value={newRfqData.ship_to_location}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2" // <-- Added py-2
            />
          </div>

          <div>
            <label
              htmlFor="due_date"
              className="block text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              id="due_date"
              value={newRfqData.due_date ?? ""}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2" // <-- Added py-2
            />
          </div>

          <div>
            <label
              htmlFor="required_certifications"
              className="block text-sm font-medium text-gray-700"
            >
              Required Certifications (comma-separated)
            </label>
            <input
              type="text"
              name="required_certifications"
              id="required_certifications"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="Organic, Non-GMO"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2" // <-- Added py-2
            />
          </div>

          {createError && (
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
              Error: {createError.message}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleCloseModal}
              className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={isCreating || !newRfqData.item}
            >
              {isCreating ? "Creating..." : "Create RFQ"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}