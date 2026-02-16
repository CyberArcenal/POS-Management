// src/renderer/pages/purchase/hooks/usePurchaseForm.ts
import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type Control } from 'react-hook-form';
import supplierAPI, { type Supplier } from '../../../api/supplier';
import productAPI, { type Product } from '../../../api/product';

export type FormMode = 'add' | 'edit';

export interface PurchaseFormData {
  supplierId: number;
  orderDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export function usePurchaseForm(mode: FormMode, initialData?: any) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<PurchaseFormData>({
    defaultValues: initialData || {
      supplierId: undefined,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      notes: '',
      items: [{ productId: undefined, quantity: 1, unitPrice: 0 }],
    },
  });

  const { control, watch, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items to calculate total
  const items = watch('items');
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  // Fetch suppliers and products on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [suppliersRes, productsRes] = await Promise.all([
          supplierAPI.getActive(),
          productAPI.getActive({ limit: 100 }), // get up to 100 active products
        ]);
        if (suppliersRes.status) setSuppliers(suppliersRes.data);
        if (productsRes.status) setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to fetch form data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // When product selection changes, auto-fill unitPrice from product's price
  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  return {
    form,
    fields,
    append,
    remove,
    totalAmount,
    suppliers,
    products,
    loading,
    handleProductChange,
  };
}