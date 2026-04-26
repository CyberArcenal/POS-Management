import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import Decimal from 'decimal.js';
import type { Product } from '../types';
import { formatCurrency } from '../../../utils/formatters';
import {
  useStockAlertThreshold,
  useAllowNegativeStock,
} from '../../../utils/posUtils';
import productAPI from '../../../api/core/product';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const stockAlertThreshold = useStockAlertThreshold();
  const allowNegativeStock = useAllowNegativeStock();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const isDisabled = !allowNegativeStock && product.stockQty === 0;

  useEffect(() => {
    if (product.image) {
      const url = productAPI.getImageUrl?.(product.image);
      if (url) {
        setImageUrl(url);
      } else {
        setImageError(true);
      }
    } else {
      setImageError(true);
    }
  }, [product.image]);

  let stockStatusClass = '';
  if (product.stockQty === 0) {
    stockStatusClass = 'text-[var(--stock-outstock)]';
  } else if (product.stockQty <= stockAlertThreshold) {
    stockStatusClass = 'text-[var(--stock-lowstock)]';
  } else {
    stockStatusClass = 'text-[var(--stock-instock)]';
  }

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <button
      onClick={() => onAdd(product)}
      disabled={isDisabled}
      className={`group relative rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* Background image or fallback gradient */}
      {!imageError && imageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--product-card-bg)] to-[var(--card-bg)] border border-[var(--product-card-border)]" />
      )}

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col items-center text-center min-h-[200px]">
        {imageError || !imageUrl ? (
          <Package className="w-10 h-10 text-[var(--accent-blue)] mb-2" />
        ) : (
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-md mb-2">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
        )}

        <h3 className="font-medium text-sm text-white drop-shadow line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <p className="text-xs text-white/70 drop-shadow mt-1">{product.sku}</p>
        <p className="text-lg font-bold text-[var(--accent-green)] drop-shadow mt-2">
          {formatCurrency(new Decimal(product.price).toFixed(2))}
        </p>
        <p className={`text-xs mt-1 drop-shadow font-medium ${stockStatusClass}`}>
          Stock: {product.stockQty}
        </p>
      </div>
    </button>
  );
};

export default ProductCard;