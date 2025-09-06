import { useState, useCallback } from "react";
import { getRFQs as fetchRFQsApi } from "api/rfq-api";
import { RFQ } from "types/rfq";

export const useGetRFQs = () => {
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchRFQsApi();
      setRFQs(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { rfqs, isLoading, error, execute };
};
