// src/renderer/pages/category/hooks/useCategoryForm.ts
import { useState } from 'react';
import { type Category } from '../../../api/category';

export type FormMode = 'add' | 'edit';

export function useCategoryForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('add');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [initialData, setInitialData] = useState<Partial<Category> | undefined>();

  const openAdd = () => {
    setMode('add');
    setCategoryId(undefined);
    setInitialData(undefined);
    setIsOpen(true);
  };

  const openEdit = (category: Category) => {
    setMode('edit');
    setCategoryId(category.id);
    setInitialData(category);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setMode('add');
    setCategoryId(undefined);
    setInitialData(undefined);
  };

  return {
    isOpen,
    mode,
    categoryId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
}