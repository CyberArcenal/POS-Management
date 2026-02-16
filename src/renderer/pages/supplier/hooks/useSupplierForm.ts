// src/renderer/pages/supplier/hooks/useSupplierForm.ts
import { useState } from 'react';
import type { Supplier } from '../../../api/supplier';

export type FormMode = 'add' | 'edit';

export function useSupplierForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('add');
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [initialData, setInitialData] = useState<Partial<Supplier> | undefined>();

  const openAdd = () => {
    setMode('add');
    setSupplierId(undefined);
    setInitialData(undefined);
    setIsOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setMode('edit');
    setSupplierId(supplier.id);
    setInitialData(supplier);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setMode('add');
    setSupplierId(undefined);
    setInitialData(undefined);
  };

  return {
    isOpen,
    mode,
    supplierId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
}