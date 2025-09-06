// /Users/duncan/dev/personal-projects/waystation/frontend/src/types/quote.ts
import { Certification } from "./rfq";

export interface SupplierComparison {
  company_name: string;
  contact_name?: string | null;
  hq_address?: string | null;
  payment_terms?: string | null;
}

export interface Quote {
  id: string;
  date_submitted: string;
  price_per_pound?: number | null;
  country_of_origin?: string | null;
  min_order_quantity?: number | null;
  certifications: Certification[];
  supplier: SupplierComparison;
}

interface RFQInfo {
  id: string;
  item: string;
}

export interface FullQuote extends Quote {
  rfq: RFQInfo;
}