import { useState } from "react";
import { type Product } from "../../../api/product";

export interface ProductFormData {
  sku: string;
  name: string;
  price: number;
  stockQty?: number;
  description?: string | null;
  isActive?: boolean;
  categoryId?: number | null; // new field
  supplierId?: number | null; // new field
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
    isActive: true,
    categoryId: 0,
    supplierId: 0,
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
      isActive: true,
      categoryId: 0,
      supplierId: 0,
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
      isActive: product.isActive,
      categoryId: product.category?.id || 0,
      supplierId: product.supplier?.id || 0,
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
