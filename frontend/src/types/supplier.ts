export interface Supplier {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string;
  contact_phone: string | null;
  hq_address: string | null;
  payment_terms: string | null;
}