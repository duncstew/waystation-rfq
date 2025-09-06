import { useState, useCallback } from 'react';
import { getSuppliers as fetchSuppliersApi } from 'api/supplier-api';
import { Supplier } from 'types/supplier';

export const useGetSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // useCallback ensures this function isn't recreated on every render
  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchSuppliersApi();
      setSuppliers(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means the function is created only once

  return { suppliers, isLoading, error, execute };
};