// /Users/duncan/dev/personal-projects/waystation/frontend/src/hooks/useGetQuotes.ts
import { useState, useCallback } from "react";
import { getQuotes as fetchQuotesApi } from "api/quote-api";
import { FullQuote } from "types/quote";

export const useGetQuotes = () => {
  const [quotes, setQuotes] = useState<FullQuote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchQuotesApi();
      setQuotes(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { quotes, isLoading, error, execute };
};