import React, { createContext, useContext, useReducer, type ReactNode} from 'react';
import type { Product, ProductsResponse } from '../types/product.types';

interface ProductState {
  products: Product[];
  pagination: ProductsResponse['pagination'] | null;
  isLoading: boolean;
  filters: {
    page: number;
    limit: number;
    search: string;
    category_name: string;
    supplier_name: string;
  };
}

type ProductAction =
  | { type: 'SET_PRODUCTS'; payload: { products: Product[]; pagination: ProductsResponse['pagination'] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'CLEAR_FILTERS' };

const initialState: ProductState = {
  products: [],
  pagination: null,
  isLoading: false,
  filters: {
    page: 1,
    limit: 20,
    search: '',
    category_name: '',
    supplier_name: ''
  }
};

const productReducer = (state: ProductState, action: ProductAction): ProductState => {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload.products,
        pagination: action.payload.pagination,
        isLoading: false
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PAGE':
      return { ...state, filters: { ...state.filters, page: action.payload } };
    case 'SET_SEARCH':
      return { ...state, filters: { ...state.filters, search: action.payload, page: 1 } };
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value, page: 1 }
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters
      };
    default:
      return state;
  }
};

const ProductContext = createContext<{
  state: ProductState;
  dispatch: React.Dispatch<ProductAction>;
} | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(productReducer, initialState);

  return (
    <ProductContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within ProductProvider');
  }
  return context;
};