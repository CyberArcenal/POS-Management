// src/renderer/pages/stock/components/StockSummaryCards.tsx
import React from 'react';
import { Package, DollarSign, AlertTriangle, XCircle } from 'lucide-react';
import type { Product } from '../../../api/product';
import Decimal from 'decimal.js';

interface StockSummaryCardsProps {
  products: Product[];
}

export const StockSummaryCards: React.FC<StockSummaryCardsProps> = ({ products }) => {
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockQty * Number(p.price)), 0);
  const lowStockCount = products.filter(p => p.stockQty > 0 && p.stockQty <= 5).length;
  const outOfStockCount = products.filter(p => p.stockQty === 0).length;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Total Products</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{totalProducts}</p>
          </div>
          <Package className="w-8 h-8 text-[var(--accent-blue)] opacity-70" />
        </div>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Stock Value</p>
            <p className="text-2xl font-bold text-[var(--accent-green)]">₱{new Decimal(totalStockValue).toFixed(2)}</p>
          </div>
          <DollarSign className="w-8 h-8 text-[var(--accent-green)] opacity-70" />
        </div>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Low Stock</p>
            <p className="text-2xl font-bold text-[var(--status-pending)]">{lowStockCount}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-[var(--status-pending)] opacity-70" />
        </div>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Out of Stock</p>
            <p className="text-2xl font-bold text-[var(--status-cancelled)]">{outOfStockCount}</p>
          </div>
          <XCircle className="w-8 h-8 text-[var(--status-cancelled)] opacity-70" />
        </div>
      </div>
    </div>
  );
};