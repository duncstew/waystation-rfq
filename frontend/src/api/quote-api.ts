// /Users/duncan/dev/personal-projects/waystation/frontend/src/api/quote-api.ts
import api from "utils/api";
import { FullQuote } from "types/quote";

/**
 * Fetches a list of all quotes from the backend.
 */
export const getQuotes = async (): Promise<FullQuote[]> => {
  return await api.get<FullQuote[]>("/api/quotes");
};

/**
 * Requests the backend to generate a clarification email for a given quote.
 * @param quoteId The ID of the quote needing clarification.
 * @returns An object containing the generated email text.
 */
export const generateClarificationEmail = async (quoteId: string): Promise<{ email_text: string }> => {
  return await api.post<{ email_text: string }>(`/api/quotes/${quoteId}/generate-clarification-email`);
};