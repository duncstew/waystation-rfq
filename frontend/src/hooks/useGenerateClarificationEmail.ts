// /Users/duncan/dev/personal-projects/waystation/frontend/src/hooks/useGenerateClarificationEmail.ts
import { useState, useCallback } from "react";
import { generateClarificationEmail as generateEmailApi } from "api/quote-api";

export const useGenerateClarificationEmail = () => {
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (quoteId: string) => {
    if (!quoteId) {
      setError(new Error("Quote ID is required."));
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null); // Clear previous data on new execution
    try {
      const result = await generateEmailApi(quoteId);
      setData(result.email_text);
      return result.email_text;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
};