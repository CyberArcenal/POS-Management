import React from 'react';
import type { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAddToCart} />
      ))}
    </div>
  );
};

export default ProductGrid;