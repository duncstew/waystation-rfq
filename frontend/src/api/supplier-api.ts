import api from "utils/api"; // Make sure the path to your api.ts is correct
import { Supplier } from "types/supplier";

/**
 * Fetches a list of all suppliers from the backend.
 */
export const getSuppliers = async () => {
  return await api.get<Supplier[]>("/api/suppliers");
};