// src/modules/QuoteComparisonView.tsx
import { useEffect, useMemo, useState } from "react";
import { useGetQuotesForRfq } from "hooks/useGetQuotesForRfq";
import { RFQ, Certification } from "types/rfq";
import { Quote } from "types/quote";
import { FaRegCopy, FaCheck } from "react-icons/fa";
import { TbMailPlus, TbHelpOctagon } from "react-icons/tb";
import Modal from "components/Modal";
import { useProcessEmail } from "hooks/useProcessEmail";
import { useGenerateClarificationEmail } from "hooks/useGenerateClarificationEmail";

interface QuoteComparisonViewProps {
  rfq: RFQ;
  onBack: () => void;
}

// Helper to find missing information
const getMissingInfo = (quote: Quote, rfq: RFQ): string[] => {
  const missing: string[] = [];
  if (quote.price_per_pound == null) {
    missing.push("Price per pound");
  }
  if (quote.country_of_origin == null) {
    missing.push("Country of origin");
  }
  if (quote.min_order_quantity == null) {
    missing.push("Minimum order quantity");
  }

  const quoteCertNames = new Set(quote.certifications.map((c) => c.name));
  const requiredCertNames = rfq.required_certifications?.map((c) => c.name) ?? [];

  for (const requiredCert of requiredCertNames) {
    if (!quoteCertNames.has(requiredCert)) {
      missing.push(`Certification: ${requiredCert}`);
    }
  }
  return missing;
};

// Helper to style certification badges
const CertificationBadge = ({ cert }: { cert: Certification }) => {
  const colorClasses: { [key: string]: string } = {
    Organic: "bg-green-100 text-green-800",
    "Non-GMO": "bg-blue-100 text-blue-800",
    Halal: "bg-teal-100 text-teal-800",
    "Allergen Free": "bg-purple-100 text-purple-800",
  };

  const badgeClass = colorClasses[cert.name] || "bg-gray-100 text-gray-800";

  return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badgeClass}`}>{cert.name}</span>;
};

// Helper to format date to Pacific Time
const formatToPST = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Invalid date format:", dateString);
    console.error("formatToPST: ", e);
    return "-";
  }
};

export default function QuoteComparisonView({ rfq, onBack }: QuoteComparisonViewProps) {
  const { quotes, isLoading, error, execute: fetchQuotes } = useGetQuotesForRfq();
  const { execute: processEmail, isLoading: isProcessingEmail } = useProcessEmail();
  const { data: generatedEmail, isLoading: isGeneratingEmail, error: generationError, execute: generateEmail } = useGenerateClarificationEmail();

  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailText, setEmailText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // State for clarification modal
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    fetchQuotes(rfq.id);
  }, [fetchQuotes, rfq.id]);

  const bestPrice = useMemo(() => {
    if (quotes.length === 0) return null;
    return Math.min(...quotes.map((q) => q.price_per_pound || Infinity));
  }, [quotes]);

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => {
      const priceA = a.price_per_pound ?? Infinity;
      const priceB = b.price_per_pound ?? Infinity;
      if (priceA < priceB) return -1;
      if (priceA > priceB) return 1;
      return 0;
    });
  }, [quotes]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rfq.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setEmailText("");
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEmailSubmit = async () => {
    if (!emailText.trim()) {
      setFormError("Email content cannot be empty.");
      return;
    }
    setFormError(null);

    try {
      await processEmail(rfq.id, emailText);
      handleCloseModal();
      fetchQuotes(rfq.id);
    } catch (err) {
      console.error("Failed to process email:", err);
      setFormError((err as Error).message || "An unexpected error occurred while processing the email.");
    }
  };

  const handleRequestInfoClick = async (quoteId: string) => {
    setIsClarificationModalOpen(true);
    await generateEmail(quoteId);
  };

  const handleCloseClarificationModal = () => {
    setIsClarificationModalOpen(false);
  };

  const handleCopyEmail = async () => {
    if (!generatedEmail) return;
    try {
      await navigator.clipboard.writeText(generatedEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email text: ", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900 transition-colors p-1 rounded-md hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold">Quote Comparison</h1>
            <p className="text-gray-500">
              For RFQ: <span className="font-medium text-gray-700">{rfq.item}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                RFQ ID: <span className="font-mono text-gray-700">{rfq.id}</span>
              </span>
              <button onClick={handleCopy} className={`text-gray-400 hover:text-gray-600 transition-all duration-300 ${copied ? "text-green-500" : ""}`} aria-label="Copy RFQ ID to clipboard">
                {copied ? <FaCheck size={14} /> : <FaRegCopy size={14} />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleOpenModal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
          <TbMailPlus size={20} />
          Add Email Quote
        </button>
      </div>

      {/* RFQ Details Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Amount Required</dt>
            <dd className="font-medium text-gray-900 mt-1">{rfq.amount_required_lbs?.toLocaleString() ?? "-"} lbs</dd>
          </div>
          <div>
            <dt className="text-gray-500">Due Date</dt>
            <dd className="font-medium text-gray-900 mt-1">{rfq.due_date ? new Date(rfq.due_date).toLocaleDateString() : "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Ship To</dt>
            <dd className="font-medium text-gray-900 mt-1">{rfq.ship_to_location ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Required Certs</dt>
            <dd className="font-medium text-gray-900 mt-1 flex flex-wrap gap-2">
              {rfq.required_certifications?.length ? rfq.required_certifications.map((cert) => <CertificationBadge key={cert.id} cert={cert} />) : <span>-</span>}
            </dd>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {isLoading && <p className="text-gray-500">Loading quotes...</p>}
        {error && <p className="text-red-500">Failed to load quotes: {error.message}</p>}

        {!isLoading && quotes.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price / lb
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min. Order Qty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country of Origin
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Terms
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certifications
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted (PST)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedQuotes.map((quote) => {
                  const isBestPrice = quote.price_per_pound === bestPrice && bestPrice !== Infinity;
                  const missingInfo = getMissingInfo(quote, rfq);
                  const hasMissingInfo = missingInfo.length > 0;
                  return (
                    <tr key={quote.id} className={isBestPrice ? "bg-green-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{quote.supplier.company_name}</div>
                        <div className="text-sm text-gray-500">{quote.supplier.contact_name ?? "No contact"}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${isBestPrice ? "text-green-600" : "text-gray-900"}`}>
                        {quote.price_per_pound ? `$${quote.price_per_pound.toFixed(2)}` : "-"}
                        {isBestPrice && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Best</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{quote.min_order_quantity ? `${quote.min_order_quantity.toLocaleString()} lbs` : "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.country_of_origin ?? "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quote.supplier.payment_terms ?? "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {quote.certifications.length > 0 ? quote.certifications.map((cert) => <CertificationBadge key={cert.id} cert={cert} />) : <span className="text-sm text-gray-500">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatToPST(quote.date_submitted)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleRequestInfoClick(quote.id)} disabled={!hasMissingInfo} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                          <TbHelpOctagon size={18} />
                          Request Info
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && quotes.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <h3 className="text-lg font-medium text-gray-800">No quotes yet</h3>
            <p className="mt-2 text-gray-500">No quotes have been submitted. Add one by processing a supplier's email.</p>
          </div>
        )}
      </div>

      {/* Add Email Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Process Email for: ${rfq.item}`}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Paste the full content of an email from a supplier below. The system will automatically extract quote details, identify the supplier, and add or update their quote for this RFQ.</p>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder="Subject: Quote for Soy Protein Isolate RFQ..."
            className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
            disabled={isProcessingEmail}
          />

          {formError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{formError}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCloseModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors" disabled={isProcessingEmail}>
              Cancel
            </button>
            <button onClick={handleEmailSubmit} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed" disabled={isProcessingEmail}>
              {isProcessingEmail ? "Processing..." : "Extract & Save Quote"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Clarification Email Modal */}
      <Modal isOpen={isClarificationModalOpen} onClose={handleCloseClarificationModal} title="Generated Clarification Email">
        <div className="flex flex-col gap-4">
          {isGeneratingEmail && (
            <div className="text-center py-8">
              <p className="text-gray-600">Generating email...</p>
            </div>
          )}

          {generationError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md">
              <h4 className="font-bold">Error</h4>
              <p>{generationError.message}</p>
            </div>
          )}

          {generatedEmail && !isGeneratingEmail && (
            <>
              <p className="text-sm text-gray-600">Review the generated email below. You can copy it to your clipboard.</p>
              <textarea readOnly value={generatedEmail} className="w-full h-64 p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm" />
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleCloseClarificationModal} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCopyEmail} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                  {emailCopied ? "Copied!" : "Copy Text"}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}