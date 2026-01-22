// src/components/cashier/ScannerInput.tsx
import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useCart } from '../../hooks/useCart';

interface ScannerInputProps {
  autoFocus?: boolean;
  placeholder?: string;
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (error: string) => void;
  disabled?: boolean;
}

const ScannerInput = forwardRef<HTMLInputElement, ScannerInputProps>(({
  autoFocus = true,
  placeholder = 'Scan barcode...',
  onScanSuccess,
  onScanError,
  disabled = false,
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItemByBarcode } = useCart();

  // Merge refs
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(inputRef.current);
    } else if (ref) {
      ref.current = inputRef.current;
    }
  }, [ref]);

  useEffect(() => {
    // Focus on mount and listen for F2
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoFocus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleScan(inputValue.trim());
    }
  };

  const handleScan = async (barcode: string) => {
    if (!barcode || disabled || isScanning) return;

    setIsScanning(true);
    
    try {
      const success = await addItemByBarcode(barcode);
      if (success) {
        onScanSuccess?.(barcode);
        setInputValue('');
      } else {
        onScanError?.(`Product not found: ${barcode}`);
      }
    } catch (error) {
      onScanError?.(error instanceof Error ? error.message : 'Scan failed');
    } finally {
      setIsScanning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isScanning}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            autoComplete="off"
            spellCheck="false"
          />
          {isScanning && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 text-xs text-gray-400">
        Press Enter to scan • F2 to focus
      </div>
    </div>
  );
});

ScannerInput.displayName = 'ScannerInput';

export default ScannerInput;