import { useForm, useFieldArray } from "react-hook-form";

export type FormMode = "add" | "edit";

export interface PurchaseFormData {
  supplierId: number;
  orderDate: string;
  notes: string;
  items: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export function usePurchaseForm(mode: FormMode, initialData?: any) {
  const defaultValues: PurchaseFormData =
    mode === "edit" && initialData
      ? {
          supplierId: initialData.supplier?.id || initialData.supplierId,
          orderDate: initialData.orderDate.split("T")[0],
          notes: initialData.notes || "",
          items: initialData.purchaseItems?.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })) || [{ productId: undefined, quantity: 1, unitPrice: 0 }],
        }
      : {
          supplierId: undefined,
          orderDate: new Date().toISOString().split("T")[0],
          notes: "",
          items: [{ productId: undefined, quantity: 1, unitPrice: 0 }],
        };

  const form = useForm<PurchaseFormData>({
    defaultValues,
  });

  const { control, watch } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );

  return {
    form,
    fields,
    append,
    remove,
    totalAmount,
  };
}
