// src/types/rfq.ts
export interface Certification {
  id: string;
  name: string;
}

export interface RFQ {
  id: string;
  item: string;
  due_date?: string;
  amount_required_lbs?: number;
  ship_to_location?: string;
  required_certifications?: Certification[];
}

export interface RFQCreatePayload {
  item: string;
  due_date?: string | null;
  amount_required_lbs?: number | null;
  ship_to_location?: string;
  required_certifications?: string[];
}