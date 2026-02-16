// src/renderer/pages/purchase/components/PurchaseFormDialog.tsx
import React, { useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { dialogs } from '../../../utils/dialogs';
import purchaseAPI from '../../../api/purchase';
import { usePurchaseForm, type PurchaseFormData, type FormMode } from '../hooks/usePurchaseForm';

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
  const {
    form,
    fields,
    append,
    remove,
    totalAmount,
    suppliers,
    products,
    loading: dataLoading,
    handleProductChange,
  } = usePurchaseForm(mode, initialData);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;

  // Reset form when initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      // map initialData to form structure
      const formData: PurchaseFormData = {
        supplierId: initialData.supplier?.id || initialData.supplierId,
        orderDate: initialData.orderDate.split('T')[0],
        status: initialData.status,
        notes: initialData.notes || '',
        items: initialData.purchaseItems?.map((item: any) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      };
      form.reset(formData);
    } else if (isOpen) {
      form.reset({
        supplierId: undefined,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
        items: [{ productId: undefined, quantity: 1, unitPrice: 0 }],
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      const payload = {
        ...data,
        orderDate: new Date(data.orderDate).toISOString(),
        items: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      let response;
      if (mode === 'add') {
        response = await purchaseAPI.create(payload, 'system');
      } else {
        if (!purchaseId) return;
        response = await purchaseAPI.update(purchaseId, payload, 'system');
      }

      if (response.status) {
        dialogs.alert({ title: 'Success', message: `Purchase ${mode === 'add' ? 'created' : 'updated'} successfully.` });
        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      dialogs.alert({ title: 'Error', message: error.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {mode === 'add' ? 'Create Purchase Order' : 'Edit Purchase Order'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {dataLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Supplier */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Supplier <span className="text-[var(--accent-red)]">*</span>
                </label>
                <select
                  {...register('supplierId', { required: 'Supplier is required' })}
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.supplierId && <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.supplierId.message}</p>}
              </div>

              {/* Order Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Order Date <span className="text-[var(--accent-red)]">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('orderDate', { required: 'Order date is required' })}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                  {errors.orderDate && <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.orderDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Items</label>
                  <button
                    type="button"
                    onClick={() => append({ productId: undefined, quantity: 1, unitPrice: 0 })}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--accent-blue)] text-white rounded hover:bg-[var(--accent-blue-hover)]"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-[var(--border-color)] rounded-lg p-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <select
                        {...register(`items.${index}.productId`, { required: 'Product is required' })}
                        onChange={(e) => handleProductChange(index, Number(e.target.value))}
                        className="flex-1 px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm text-[var(--text-primary)]"
                      >
                        <option value="">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { required: 'Qty required', min: 1 })}
                        placeholder="Qty"
                        className="w-20 px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm text-[var(--text-primary)]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unitPrice`, { required: 'Price required', min: 0 })}
                        placeholder="Price"
                        className="w-24 px-2 py-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm text-[var(--text-primary)]"
                      />
                      <span className="text-sm text-[var(--text-secondary)] w-20 text-right">
                        ₱{((watch(`items.${index}.quantity`) || 0) * (watch(`items.${index}.unitPrice`) || 0)).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] disabled:opacity-30"
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
                <span className="text-xl font-bold text-[var(--accent-green)]">₱{totalAmount.toFixed(2)}</span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
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
                  className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg text-sm hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'add' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};