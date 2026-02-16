// src/renderer/pages/purchase/hooks/usePurchaseView.ts
import { useState } from 'react';
import purchaseAPI, { type Purchase, type PurchaseItem } from '../../../api/purchase';
import supplierAPI, { type Supplier } from '../../../api/supplier';
import productAPI, { type Product } from '../../../api/product';

export function usePurchaseView() {
  const [isOpen, setIsOpen] = useState(false);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const open = async (purchaseId: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      // Fetch purchase with details
      const response = await purchaseAPI.getById(purchaseId);
      if (response.status) {
        const purchaseData = response.data;
        setPurchase(purchaseData);
        // If purchaseItems are included, use them; otherwise fetch separately
        if (purchaseData.purchaseItems) {
          setItems(purchaseData.purchaseItems);
        } else {
          const itemsRes = await purchaseAPI.getItems(purchaseId);
          if (itemsRes.status) setItems(itemsRes.data);
        }
      }
    } catch (error) {
      console.error('Error loading purchase details:', error);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setPurchase(null);
    setItems([]);
  };

  return {
    isOpen,
    purchase,
    items,
    loading,
    open,
    close,
  };
}