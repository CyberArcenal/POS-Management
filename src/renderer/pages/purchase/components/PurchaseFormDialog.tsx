// src/renderer/pages/purchase/components/PurchaseFormDialog.tsx
import React, { useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { usePurchaseForm, type PurchaseFormData, type FormMode } from '../hooks/usePurchaseForm';
import SupplierSelect from '../../../components/Selects/Supplier';
import ProductSelect from '../../../components/Selects/Product';
import purchaseAPI from '../../../api/purchase';
import { dialogs } from '../../../utils/dialogs';

interface PurchaseFormDialogProps {
  isOpen: boolean;
  mode: FormMode;
  purchaseId?: number;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const PurchaseFormDialog: React.FC<PurchaseFormDialogProps> = ({
  isOpen,
  mode,
  purchaseId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const { form, fields, append, remove, totalAmount } = usePurchaseForm(mode, initialData);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        reset({
          supplierId: initialData.supplier?.id || initialData.supplierId,
          orderDate: initialData.orderDate.split('T')[0],
          notes: initialData.notes || '',
          items: initialData.purchaseItems?.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })) || [],
        });
      } else {
        reset({
          supplierId: undefined,
          orderDate: new Date().toISOString().split('T')[0],
          notes: '',
          items: [{ productId: undefined, quantity: 1, unitPrice: 0 }],
        });
      }
    }
  }, [isOpen, initialData, mode, reset]);

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      const items = data.items.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity as unknown as string),
        unitPrice: item.unitPrice,
      }));

      let response;
      if (mode === 'add') {
        response = await purchaseAPI.create(
          {
            supplierId: data.supplierId,
            orderDate: new Date(data.orderDate).toISOString(),
            notes: data.notes,
            items,
            status: 'pending',
          },
          'system'
        );
      } else {
        if (!purchaseId) return;
        response = await purchaseAPI.update(
          purchaseId,
          {
            supplierId: data.supplierId,
            orderDate: new Date(data.orderDate).toISOString(),
            notes: data.notes,
            items,
          },
          'system'
        );
      }

      if (response.status) {
        await dialogs.alert({
          title: 'Success',
          message: `Purchase order ${mode === 'add' ? 'created' : 'updated'} successfully.`,
        });
        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      dialogs.alert({
        title: 'Error',
        message: error.message || 'An unexpected error occurred.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div
          className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          style={{ border: '1px solid var(--border-color)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {mode === 'add' ? 'Create Purchase Order' : 'Edit Purchase Order'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Supplier <span className="text-[var(--accent-red)]">*</span>
              </label>
              <SupplierSelect
                value={watch('supplierId')}
                onChange={(id) => setValue('supplierId', id as number, { shouldValidate: true })}
                disabled={isSubmitting}
                placeholder="Select supplier"
                activeOnly
              />
              {errors.supplierId && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.supplierId.message}</p>
              )}
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Order Date <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="date"
                {...register('orderDate', { required: 'Order date is required' })}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
              {errors.orderDate && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.orderDate.message}</p>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Items</label>
                <button
                  type="button"
                  onClick={() => append({ productId: 0, quantity: 1, unitPrice: 0 })}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--accent-blue)] text-white rounded hover:bg-[var(--accent-blue-hover)] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto border border-[var(--border-color)] rounded-lg p-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    {/* Product Select */}
                    <div className="flex-1">
                      <ProductSelect
                        value={watch(`items.${index}.productId`)}
                        onChange={(id, product) => {
                          setValue(`items.${index}.productId`, id as number, { shouldValidate: true });
                          if (product) {
                            const currentPrice = watch(`items.${index}.unitPrice`);
                            if (!currentPrice || currentPrice === 0) {
                              setValue(`items.${index}.unitPrice`, product.price);
                            }
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Select product"
                        activeOnly
                      />
                      {errors.items?.[index]?.productId && (
                        <p className="mt-1 text-xs text-[var(--accent-red)]">
                          {errors.items[index].productId?.message}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, {
                          required: 'Qty req',
                          min: { value: 1, message: 'Min 1' },
                        })}
                        placeholder="Qty"
                        className="w-full px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm text-[var(--text-primary)]"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-[var(--accent-red)]">
                          {errors.items[index].quantity?.message}
                        </p>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unitPrice`, {
                          required: 'Price req',
                          min: { value: 0, message: 'Min 0' },
                        })}
                        placeholder="Price"
                        className="w-full px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm text-[var(--text-primary)]"
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-xs text-[var(--accent-red)]">
                          {errors.items[index].unitPrice?.message}
                        </p>
                      )}
                    </div>

                    {/* Subtotal */}
                    <span className="text-sm text-[var(--text-secondary)] w-20 text-right">
                      ₱
                      {(
                        (watch(`items.${index}.quantity`) || 0) *
                        (watch(`items.${index}.unitPrice`) || 0)
                      ).toFixed(2)}
                    </span>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex justify-end items-center gap-4 pt-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Total:</span>
              <span className="text-xl font-bold text-[var(--accent-green)]">
                ₱{totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'add' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};