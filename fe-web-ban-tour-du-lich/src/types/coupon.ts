export interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  discount_percent?: number | null;
  discount_amount?: number | null; 
  expire_at?: string | null;       
  max_use: number;
  discount_limit: number;
  created_at?: string;
  is_active: boolean;
}

export type UpsertCoupon = Omit<Coupon, 'id' | 'created_at'> & { id?: number };


