import React from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import type { PaymentMethod } from '../types';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  onChange,
}) => {
  return (
    <div>
      <label className="block text-xs text-[var(--text-tertiary)] mb-1">Payment Method</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onChange('cash')}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
            paymentMethod === 'cash'
              ? 'border-[var(--accent-green)] bg-[var(--accent-green-light)] text-[var(--accent-green)]'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span className="text-xs">Cash</span>
        </button>
        <button
          onClick={() => onChange('card')}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
            paymentMethod === 'card'
              ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-light)] text-[var(--accent-blue)]'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-xs">Card</span>
        </button>
        <button
          onClick={() => onChange('wallet')}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
            paymentMethod === 'wallet'
              ? 'border-[var(--accent-purple)] bg-[var(--accent-purple-light)] text-[var(--accent-purple)]'
              : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-xs">Wallet</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;