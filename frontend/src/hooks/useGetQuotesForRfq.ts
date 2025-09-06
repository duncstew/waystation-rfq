// src/hooks/useGetQuotesForRfq.ts
import { useState, useCallback } from "react";
import { getQuotesForRfq as fetchQuotesApi } from "api/rfq-api";
import { Quote } from "types/quote";

export const useGetQuotesForRfq = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (rfqId: string) => {
    if (!rfqId) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchQuotesApi(rfqId);
      setQuotes(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { quotes, isLoading, error, execute };
};