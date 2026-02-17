import { type Product as ApiProduct } from '../../api/product';
import { type Customer as ApiCustomer } from '../../api/customer';

export type Product = ApiProduct;
export type Customer = ApiCustomer;

export interface CartItem extends Product {
  cartQuantity: number;
  lineDiscount: number; // percentage
  lineTax: number;      // percentage
}

export type PaymentMethod = 'cash' | 'card' | 'wallet';