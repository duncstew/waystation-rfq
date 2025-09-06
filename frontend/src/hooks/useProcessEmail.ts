// src/hooks/useProcessEmail.ts
import { useState, useCallback } from "react";
import { processEmailForRfq as processEmailApi } from "api/rfq-api";
import { Quote } from "types/quote";

export const useProcessEmail = () => {
  const [data, setData] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (rfqId: string, raw_text: string) => {
    if (!rfqId || !raw_text) {
      setError(new Error("RFQ ID and email text are required."));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await processEmailApi(rfqId, raw_text);
      setData(result);
      return result; // Return result for immediate use
    } catch (err) {
      setError(err as Error);
      throw err; // Re-throw to be caught by the calling component
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
};