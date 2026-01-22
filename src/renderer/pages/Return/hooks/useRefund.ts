import { useState, useCallback } from 'react';
import { returnsAPI } from '../api/returns';
import { posAuthStore } from '../../../lib/authStore';
import inventoryTransactionAPI from '../../../api/inventory_transaction';
import auditTrailAPI from '../../../api/audit';

export interface RefundItem {
  id: number;
  product_id: number;
  quantity: number;
  reason: string;
}

export interface RefundOptions {
  sale_id: number;
  items: RefundItem[];
  notes?: string;
  refund_type?: 'full' | 'partial';
}

export const useRefund = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  const processRefund = useCallback(async (options: RefundOptions) => {
    try {
      setProcessing(true);
      setError(null);
      setResult(null);
      
      const user = posAuthStore.getUserDisplayInfo();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // 1. Process the refund
      const refundResponse = await returnsAPI.processRefund({
        sale_id: options.sale_id,
        items: options.items,
        reason: options.notes,
        refund_type: options.refund_type || 'partial',
        performed_by: user.terminalId ? parseInt(user.terminalId as string) : undefined
      });
      
      if (!refundResponse.status) {
        throw new Error(refundResponse.message || 'Refund processing failed');
      }
      
      // 2. Log inventory adjustments
      const inventoryPromises = options.items.map(item =>
        inventoryTransactionAPI.createTransactionLog({
          product_id: item.product_id,
          action: 'return_in',
          change_amount: item.quantity,
          quantity_before: 0,
          quantity_after: item.quantity,
          reference_id: refundResponse.data?.receipt_number || options.sale_id.toString(),
          reference_type: 'refund',
          notes: `Refund: ${item.reason}`,
          location_id: 'main_store'
        })
      );
      
      await Promise.all(inventoryPromises);
      
      // 3. Log audit trail
    //   await auditTrailAPI.logAuditEvent({
    //     action: 'process_refund',
    //     entity: 'sale',
    //     entity_id: options.sale_id,
    //     details: {
    //       refund_amount: refundResponse.data?.refund_amount,
    //       items_count: options.items.length,
    //       items: options.items,
    //       notes: options.notes,
    //       performed_by: user.name,
    //       user_id: user.terminalId ? parseInt(user.terminalId) : undefined,
    //       timestamp: new Date().toISOString()
    //     }
    //   });
      
      setResult(refundResponse.data);
      return {
        success: true,
        data: refundResponse.data,
        message: 'Refund processed successfully'
      };
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process refund';
      setError(errorMessage);
      
      // Log error to audit trail
    //   try {
    //     await auditTrailAPI.logAuditEvent({
    //       action: 'refund_error',
    //       entity: 'sale',
    //       entity_id: options.sale_id,
    //       details: {
    //         error: errorMessage,
    //         items: options.items,
    //         timestamp: new Date().toISOString()
    //       }
    //     });
    //   } catch (auditError) {
    //     console.error('Failed to log refund error:', auditError);
    //   }
      
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setProcessing(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);
  
  return {
    processing,
    error,
    result,
    processRefund,
    reset
  };
};