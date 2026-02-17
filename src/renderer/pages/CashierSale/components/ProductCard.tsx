import React from 'react';
import { Package } from 'lucide-react';
import Decimal from 'decimal.js';
import type { Product } from '../types';
import { formatCurrency } from '../../../utils/formatters';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const isOutOfStock = product.stockQty === 0;

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isOutOfStock}
      className={`group relative bg-[var(--product-card-bg)] border border-[var(--product-card-border)] rounded-xl p-4 hover:border-[var(--accent-blue)] transition-all duration-200 hover:shadow-lg ${
        isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <Package className="w-10 h-10 text-[var(--accent-blue)] mb-2" />
        <h3 className="font-medium text-sm text-[var(--text-primary)] line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">{product.sku}</p>
        <p className="text-lg font-bold text-[var(--accent-green)] mt-2">
          {formatCurrency(new Decimal(product.price).toFixed(2))}
        </p>
        <p
          className={`text-xs mt-1 ${
            product.stockQty > 10
              ? 'text-[var(--stock-instock)]'
              : product.stockQty > 0
              ? 'text-[var(--stock-lowstock)]'
              : 'text-[var(--stock-outstock)]'
          }`}
        >
          Stock: {product.stockQty}
        </p>
      </div>
      {!isOutOfStock && (
        <div className="absolute inset-0 bg-[var(--accent-blue)]/0 group-hover:bg-[var(--accent-blue)]/5 rounded-xl transition-all duration-200" />
      )}
    </button>
  );
};

export default ProductCard;