// src/api/rfq-api.ts
import api from "utils/api";
import { RFQ, RFQCreatePayload } from "types/rfq";
import { Quote } from "types/quote";

export const getRFQs = async (): Promise<RFQ[]> => {
  return await api.get<RFQ[]>("/api/rfqs");
};

export const getQuotesForRfq = async (rfqId: string): Promise<Quote[]> => {
  return await api.get<Quote[]>(`/api/rfqs/${rfqId}/quotes`);
};

export const createRFQ = async (rfqData: RFQCreatePayload): Promise<RFQ> => {
  return await api.post<RFQ>("/api/rfqs", rfqData);
};

/**
 * Sends raw email text to the backend for a specific RFQ to be processed.
 * @param rfqId The ID of the RFQ the email belongs to.
 * @param raw_text The full, plain text content of the supplier's email.
 * @returns The newly created or updated Quote object.
 */
export const processEmailForRfq = async (
  rfqId: string,
  raw_text: string,
): Promise<Quote> => {
  return await api.post<Quote>(`/api/rfqs/${rfqId}/extract-quote-from-email`, {
    raw_text,
  });
};