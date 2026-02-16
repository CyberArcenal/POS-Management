// src/renderer/pages/supplier/components/SupplierFormDialog.tsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import supplierAPI, { type Supplier } from '../../../api/supplier';
import { dialogs } from '../../../utils/dialogs';
import type { FormMode } from '../hooks/useSupplierForm';

interface SupplierFormDialogProps {
  isOpen: boolean;
  mode: FormMode;
  supplierId?: number;
  initialData?: Partial<Supplier>;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  contactInfo?: string;
  address?: string;
  isActive: boolean;
}

export const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  isOpen,
  mode,
  supplierId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      name: '',
      contactInfo: '',
      address: '',
      isActive: true,
      ...Object.fromEntries(Object.entries(initialData || {}).filter(([, v]) => v !== null)),
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset(initialData);
    } else if (isOpen) {
      reset({ name: '', contactInfo: '', address: '', isActive: true });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (mode === 'add') {
        const response = await supplierAPI.create(data);
        if (response.status) {
          dialogs.alert({ title: 'Success', message: 'Supplier created successfully.' });
          onSuccess();
        } else {
          throw new Error(response.message);
        }
      } else {
        if (!supplierId) return;
        const response = await supplierAPI.update(supplierId, data);
        if (response.status) {
          dialogs.alert({ title: 'Success', message: 'Supplier updated successfully.' });
          onSuccess();
        } else {
          throw new Error(response.message);
        }
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
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              {mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Name <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Contact Info
              </label>
              <input
                {...register('contactInfo')}
                placeholder="Phone, email, or contact person"
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Address
              </label>
              <textarea
                {...register('address')}
                rows={2}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                id="isActive"
                className="rounded border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
              />
              <label htmlFor="isActive" className="text-sm text-[var(--text-primary)]">
                Active
              </label>
            </div>

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
        </div>
      </div>
    </div>
  );
};