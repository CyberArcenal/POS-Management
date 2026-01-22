// src/features/transactions/components/TransactionRow.tsx
import React from 'react';
import type { Transaction } from '../api/types';

interface TransactionRowProps {
  transaction: Transaction;
  onClick: () => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onClick }) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-300 border-green-700/50';
      case 'cancelled':
        return 'bg-red-900/30 text-red-300 border-red-700/50';
      case 'refunded':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50';
      case 'pending':
        return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  return (
    <tr 
      className="hover:bg-gray-800/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDateTime(transaction.datetime)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
        {transaction.reference_number || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {transaction.customer_name || 'Walk-in'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
        ₱{transaction.total.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        <span className="px-2 py-1 text-xs bg-gray-800 rounded">
          {transaction.payment_method}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(transaction.status)}`}>
          {transaction.status.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {transaction.user?.display_name || transaction.user?.username || 'System'}
      </td>
    </tr>
  );
};