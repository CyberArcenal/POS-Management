import { useState } from "react";
import { type Product } from "../../../api/product";

export interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  reorderLevel?: number;
  isActive: boolean;
  category?: string;
}

export function useProductForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [productId, setProductId] = useState<number | undefined>();
  const [initialData, setInitialData] = useState<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    price: 0,
    stockQty: 0,
    reorderLevel: 5,
    isActive: true,
    category: "",
  });

  const openAdd = () => {
    setMode("add");
    setProductId(undefined);
    setInitialData({
      sku: "",
      name: "",
      description: "",
      price: 0,
      stockQty: 0,
      reorderLevel: 5,
      isActive: true,
      category: "",
    });
    setIsOpen(true);
  };

  const openEdit = (product: Product) => {
    setMode("edit");
    setProductId(product.id);
    setInitialData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price:
        typeof product.price === "string"
          ? parseFloat(product.price)
          : product.price,
      stockQty: product.stockQty,
      reorderLevel: (product as any).reorderLevel || 5,
      isActive: product.isActive,
      category: (product as any).category || "",
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setProductId(undefined);
  };

  return {
    isOpen,
    mode,
    productId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
}