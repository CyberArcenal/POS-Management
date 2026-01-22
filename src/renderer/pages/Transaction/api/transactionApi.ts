// src/features/transactions/api/transactionApi.ts
import saleAPI, { type Sale as ApiSale, type PaginatedResponse as ApiPaginatedResponse } from '../../../api/sales';
import { convertApiSaleToTransaction, type Transaction } from './types';

export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  reference_number?: string;
  customer_name?: string;
  status?: string;
  payment_method?: string;
  min_total?: number;
  max_total?: number;
  user_id?: number;
  search?: string;
}

export interface ExportOptions {
  format: "csv" | "pdf";
  include_items?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}
class TransactionApi {
  async getTransactions(
    page: number = 1,
    pageSize: number = 20,
    filters?: TransactionFilters
  ): Promise<ApiPaginatedResponse<Transaction>> {
    try {
      // Convert TransactionFilters to saleAPI filters
      const saleFilters: any = {};
      
      if (filters) {
        if (filters.start_date) saleFilters.start_date = filters.start_date;
        if (filters.end_date) saleFilters.end_date = filters.end_date;
        if (filters.reference_number) saleFilters.reference_number = filters.reference_number;
        if (filters.customer_name) saleFilters.customer_name = filters.customer_name;
        if (filters.status) saleFilters.status = filters.status;
        if (filters.payment_method) saleFilters.payment_method = filters.payment_method;
        if (filters.min_total !== undefined) saleFilters.min_total = filters.min_total;
        if (filters.max_total !== undefined) saleFilters.max_total = filters.max_total;
        if (filters.search) saleFilters.search = filters.search;
        if (filters.user_id !== undefined) saleFilters.user_id = filters.user_id;
      }

      const response = await saleAPI.findPage(
        saleFilters,
        page,
        pageSize
      );

      // Convert ApiSale[] to Transaction[]
      const transactions: Transaction[] = response.data.map(convertApiSaleToTransaction);

      return {
        ...response,
        data: transactions
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  async getTransactionById(id: number): Promise<Transaction> {
    try {
      const response = await saleAPI.getSaleById(id);
      return convertApiSaleToTransaction(response.data);
    } catch (error: any) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  async exportTransactions(
    filters: TransactionFilters,
    options: ExportOptions
  ): Promise<{ url: string; filename: string }> {
    try {
      // Convert TransactionFilters to saleAPI filters
      const saleFilters: any = {};
      
      if (filters.start_date) saleFilters.start_date = filters.start_date;
      if (filters.end_date) saleFilters.end_date = filters.end_date;
      if (filters.user_id !== undefined) saleFilters.user_id = filters.user_id;
      if (filters.status) saleFilters.status = filters.status;

      // CSV Export
      if (options.format === 'csv') {
        const response = await saleAPI.exportSalesToCSV(saleFilters);
        return response;
      }

      // PDF Export (placeholder)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `transactions_export_${timestamp}.pdf`;
      const blob = new Blob(['PDF export placeholder'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      return { url, filename };
    } catch (error: any) {
      throw new Error(`Failed to export transactions: ${error.message}`);
    }
  }

  async getTransactionStats(filters?: TransactionFilters) {
    try {
      const response = await saleAPI.getSalesStats(
        {
          start_date: filters?.start_date || undefined,
          end_date: filters?.end_date || undefined,
        },
        {
          user_id: filters?.user_id,
          payment_method: filters?.payment_method,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch transaction stats:', error);
      return null;
    }
  }
}

export const transactionApi = new TransactionApi();