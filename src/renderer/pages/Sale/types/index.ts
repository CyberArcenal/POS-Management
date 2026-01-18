// types/index.ts
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  category: ProductCategory;
  stock: number;
  sku?: string;
  barcode?: string;
  isActive: boolean;
  taxRate?: number;
}

export type ProductCategory = 'all' | 'food' | 'drinks' | 'alcohol' | 'electronics' | 'clothing' | 'accessories';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl: string;
  taxRate: number;
  taxAmount: number;
  discountAmount?: number;
}

export interface Promo {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'bogo';
  value: number;
  description: string;
  minPurchase?: number;
  validUntil?: Date;
  isActive: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  discounts: number;
  tax: number;
  total: number;
  createdAt: Date;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'digital';
}

export interface SalesSectionProps {
  onCompleteTransaction?: (order: Order) => void;
  onCancelTransaction?: () => void;
  onPaymentRequest?: () => void;
}

export interface TaxRate {
  name: string;
  rate: number;
  description: string;
}