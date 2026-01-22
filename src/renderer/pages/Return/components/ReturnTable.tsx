import React from 'react';
import { Receipt, User, Calendar, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';

interface ReturnTableProps {
  transactions: any[];
  onSelectTransaction: (transaction: any) => void;
  loading: boolean;
}

const ReturnTable: React.FC<ReturnTableProps> = ({ 
  transactions, 
  onSelectTransaction,
  loading 
}) => {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: 'Completed', className: 'status-badge-completed' },
      pending: { label: 'Pending', className: 'status-badge-pending' },
      cancelled: { label: 'Cancelled', className: 'status-badge-cancelled' },
      refunded: { label: 'Refunded', className: 'status-badge-refunded' }
    };
    
    const statusInfo = statusMap[status] || { label: status, className: 'status-badge-unknown' };
    
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };
  
  const getPaymentBadge = (method: string) => {
    const methodMap: Record<string, { label: string; className: string }> = {
      cash: { label: 'Cash', className: 'payment-badge-cash' },
      card: { label: 'Card', className: 'payment-badge-card' },
      digital: { label: 'Digital', className: 'payment-badge-digital' },
      credit: { label: 'Credit', className: 'payment-badge-credit' }
    };
    
    const methodInfo = methodMap[method] || { label: method, className: 'payment-badge-other' };
    
    return (
      <span className={`payment-badge ${methodInfo.className}`}>
        {methodInfo.label}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="table-loading">
        <div className="loading-spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }
  
  return (
    <div className="return-table-container">
      <div className="table-wrapper">
        <table className="return-table">
          <thead>
            <tr>
              <th className="column-receipt">Receipt #</th>
              <th className="column-date">Date</th>
              <th className="column-customer">Customer</th>
              <th className="column-items">Items</th>
              <th className="column-total">Total</th>
              <th className="column-status">Status</th>
              <th className="column-payment">Payment</th>
              <th className="column-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr 
                key={transaction.id} 
                className="return-table-row"
                onClick={() => onSelectTransaction(transaction)}
              >
                <td className="cell-receipt">
                  <div className="receipt-info">
                    <Receipt size={16} />
                    <span className="receipt-number">{transaction.receipt_number}</span>
                  </div>
                </td>
                
                <td className="cell-date">
                  <div className="date-info">
                    <Calendar size={14} />
                    <span>{formatDate(transaction.datetime)}</span>
                  </div>
                </td>
                
                <td className="cell-customer">
                  <div className="customer-info">
                    <User size={14} />
                    <div className="customer-details">
                      <span className="customer-name">{transaction.customer_name || 'Walk-in'}</span>
                      {transaction.customer_phone && (
                        <span className="customer-phone">{transaction.customer_phone}</span>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="cell-items">
                  <div className="items-count">
                    {transaction.items?.length || 0} item(s)
                  </div>
                </td>
                
                <td className="cell-total">
                  <div className="total-amount">
                    ₱{Number(transaction.total).toFixed(2)}
                  </div>
                </td>
                
                <td className="cell-status">
                  {getStatusBadge(transaction.status)}
                </td>
                
                <td className="cell-payment">
                  {getPaymentBadge(transaction.payment_method)}
                  {transaction.payment_status && (
                    <div className="payment-status">
                      {transaction.payment_status}
                    </div>
                  )}
                </td>
                
                <td className="cell-actions">
                  <button 
                    className="btn-view-details"
                    onClick={() => onSelectTransaction(transaction)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="table-empty">
          <AlertCircle size={48} />
          <h3>No transactions found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      )}
    </div>
  );
};

export default ReturnTable;