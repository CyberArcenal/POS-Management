import { useState, useCallback } from "react";
import { type InventoryMovement } from "../../../api/inventory";
import inventoryAPI from "../../../api/inventory";

export const useMovementView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [movement, setMovement] = useState<InventoryMovement | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (movement: InventoryMovement) => {
    setIsOpen(true);
    setLoading(true);
    try {
      // If needed, fetch more details (e.g., product, sale)
      // For now, use the provided movement (which may already have product)
      setMovement(movement);
    } catch (error) {
      console.error("Failed to load movement details", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMovement(null);
  }, []);

  return { isOpen, movement, loading, open, close };
};