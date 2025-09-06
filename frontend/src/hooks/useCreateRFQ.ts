// src/hooks/useCreateRFQ.ts
import { useState, useCallback } from "react";
import { createRFQ as createRfqApi } from "api/rfq-api";
import { RFQ, RFQCreatePayload } from "types/rfq";

export const useCreateRFQ = () => {
  const [data, setData] = useState<RFQ | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (payload: RFQCreatePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await createRfqApi(payload);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
};