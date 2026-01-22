import React, { useState, useEffect } from 'react';
import { posAuthStore } from '../../lib/authStore';
import { showError, showSuccess } from '../../utils/notification';
import { Loader, AlertCircle } from 'lucide-react';
import './styles/returns.css';
import { ReturnProvider, useReturnContext } from './contexts/ReturnContext';
import ReturnFilter from './components/ReturnFilter';
import ReturnTable from './components/ReturnTable';
import ReturnDetailModal from './components/ReturnDetailModal';

interface ReturnsPageProps {
  onNavigate?: (path: string) => void;
}

const ReturnsPageContent: React.FC<ReturnsPageProps> = ({ onNavigate }) => {
  const {
    transactions,
    selectedTransaction,
    filters,
    loading,
    error,
    setFilters,
    selectTransaction,
    clearSelection,
    processRefund
  } = useReturnContext();
  
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(posAuthStore.getUserDisplayInfo());
  
  useEffect(() => {
    // Check authentication
    const user = posAuthStore.getUserDisplayInfo();
    if (!user) {
      onNavigate?.('/login');
      return;
    }
    setCurrentUser(user);
    
    // Check permissions
    if (!posAuthStore.canPerformAction('apply_discount')) {
      showError('You do not have permission to process returns');
      onNavigate?.('/dashboard');
    }
  }, [onNavigate]);
  
  const handleTransactionSelect = (transaction: any) => {
    selectTransaction(transaction);
    setShowModal(true);
  };
  
  const handleRefundProcess = async (refundData: {
    items: Array<{
      id: number;
      quantity: number;
      reason: string;
    }>;
    notes?: string;
  }) => {
    try {
      const result = await processRefund(refundData);
      if (result.success) {
        showSuccess('Refund processed successfully');
        setShowModal(false);
        clearSelection();
      } else {
        showError(result.message || 'Failed to process refund');
      }
    } catch (error: any) {
      showError(error.message || 'An error occurred');
    }
  };
  
  return (
    <div className="returns-page">
      {/* Page Header */}
      <div className="returns-header">
        <div className="header-left">
          <h1 className="page-title">Returns & Refunds</h1>
          <p className="page-subtitle">Process returns and refunds for completed transactions</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar" style={{ 
              background: currentUser?.colorScheme?.bg || 'var(--gradient-primary)',
              color: currentUser?.colorScheme?.text || 'white'
            }}>
              {currentUser?.initials || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{currentUser?.role}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="returns-content">
        {/* Filter Section */}
        <div className="returns-filter-section">
          <ReturnFilter 
            filters={filters}
            onFilterChange={setFilters}
          />
        </div>
        
        {/* Status Bar */}
        <div className="returns-status-bar">
          <div className="status-item">
            <span className="status-label">Total Transactions</span>
            <span className="status-value">{transactions.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Refundable Today</span>
            <span className="status-value">0</span>
          </div>
          <div className="status-item">
            <span className="status-label">Processing Time</span>
            <span className="status-value">24h</span>
          </div>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <Loader className="loader-icon animate-spin" size={48} />
              <p>Loading transactions...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && !loading && (
          <div className="error-container">
            <AlertCircle className="error-icon" size={48} />
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => setFilters(filters)}>
              Retry
            </button>
          </div>
        )}
        
        {/* Transaction Table */}
        {!loading && !error && (
          <div className="returns-table-container">
            <ReturnTable 
              transactions={transactions}
              onSelectTransaction={handleTransactionSelect}
              loading={loading}
            />
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Transactions Found</h3>
            <p>Try adjusting your search filters or date range</p>
          </div>
        )}
      </div>
      
      {/* Detail Modal */}
      {selectedTransaction && showModal && (
        <ReturnDetailModal
          transaction={selectedTransaction}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            clearSelection();
          }}
          onProcessRefund={handleRefundProcess}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

const ReturnsPage: React.FC<ReturnsPageProps> = (props) => {
  return (
    <ReturnProvider>
      <ReturnsPageContent {...props} />
    </ReturnProvider>
  );
};

// React Router Integration
export const ReturnsRoute = () => ({
  path: '/pos/returns',
  element: <ReturnsPage />,
  protected: true,
  requiredPermissions: ['can_process_sales', 'can_adjust_inventory'],
  breadcrumb: 'Returns & Refunds',
});

export default ReturnsPage;