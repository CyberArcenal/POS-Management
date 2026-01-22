// customerAPI.ts
export interface CustomerData {
  id: number;
  customer_code: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  company_name: string | null;
  tax_id: string | null;
  customer_type: 'individual' | 'business' | 'wholesale' | 'retail';
  status: 'active' | 'inactive' | 'blocked';
  credit_limit: number;
  current_balance: number;
  payment_terms: string | null;
  preferred_payment_method: string | null;
  customer_group: string | null;
  customer_rating: number;
  notes: string | null;
  tags: string[] | null;
  allow_marketing_emails: boolean;
  allow_sms_notifications: boolean;
  created_at: string;
  updated_at: string;
  last_purchase_at: string | null;
  created_by: number | null;
  updated_by: number | null;
}

export interface CustomerContactData {
  id: number;
  customer_id: number;
  contact_type: 'primary' | 'secondary' | 'billing' | 'shipping' | 'technical';
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  is_default_contact: boolean;
  receive_statements: boolean;
  receive_marketing: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerTransactionData {
  id: number;
  customer_id: number;
  transaction_type: 'sale' | 'payment' | 'refund' | 'credit_note' | 'debit_note' | 'adjustment';
  transaction_date: string;
  reference_id: string | null;
  reference_type: string | null;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  status: 'pending' | 'completed' | 'cancelled' | 'reversed';
  created_at: string;
  created_by: number | null;
}

export interface CustomerStatsData {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
  blocked_customers: number;
  total_balance: number;
  avg_balance: number;
  credit_exposure: number;
  customers_with_sales: number;
  total_revenue: number;
  avg_sale_value: number;
  total_sales: number;
  conversion_rate: number;
  unique_customer_types: number;
  unique_customer_groups: number;
}

export interface CustomerSearchResult {
  customers: CustomerData[];
  pagination: {
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
    next: boolean;
    previous: boolean;
  };
  summary: {
    total_sales: number;
    total_revenue: number;
    total_discount: number;
    total_tax: number;
  };
}

export interface CustomerStatementData {
  statement_info: {
    statement_number: string;
    customer_id: number;
    customer_code: string;
    customer_name: string;
    period: {
      start: string;
      end: string;
      generated_at: string;
    };
  };
  opening_balance: number;
  closing_balance: number;
  transactions: CustomerTransactionData[];
  summary: {
    total_sales: number;
    total_payments: number;
    total_credit_notes: number;
    total_debit_notes: number;
    total_adjustments_debit: number;
    total_adjustments_credit: number;
    debit_total: number;
    credit_total: number;
    net_change: number;
  };
  totals: {
    opening_balance: number;
    total_debits: number;
    total_credits: number;
    net_change: number;
    closing_balance: number;
  };
}

export interface CustomerLifetimeValueData {
  customer_profile: {
    id: number;
    code: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
    cohort: string;
  };
  historical_performance: {
    first_purchase: string;
    last_purchase: string;
    customer_age: {
      days: number;
      months: number;
      years: number;
    };
    total_transactions: number;
    total_revenue: number;
    estimated_profit: number;
    avg_transaction_value: number;
    unique_purchase_days: number;
    avg_days_between_purchases: number;
    purchase_frequency_per_month: number;
  };
  lifetime_value_calculations: {
    historical_ltv: number;
    monthly_ltv: number;
    annual_ltv: number;
    predicted_future_12m_value: number;
    total_predicted_lifetime_value: number;
    calculation_method: string;
  };
  segmentation: {
    value_segment: string;
    retention_risk: string;
    health_score: number;
    purchase_behavior: string;
    revenue_tier: string;
  };
  cohort_analysis: {
    cohort_month: string;
    cohort_size: number;
    cohort_total_revenue: number;
    cohort_avg_ltv: number;
    customer_position_in_cohort: string;
    percentile_rank: string;
  };
  predictive_metrics: {
    churn_probability: string;
    next_purchase_prediction_days: number;
    expected_lifetime_months: number;
    potential_upsell_opportunity: string;
  };
  insights: string[];
  recommendations: string[];
  comparison_benchmarks: {
    industry_avg_ltv: number;
    business_avg_ltv: number;
    percentile_vs_peers: string;
  };
}

export interface CustomerPurchaseHistoryData {
  overview: {
    customer_id: number;
    analysis_period: {
      start: string;
      end: string;
      total_days: number;
    };
    purchase_summary: {
      total_purchases: number;
      total_spent: number;
      avg_purchase_value: number;
      payment_methods: Record<string, number>;
      status_counts: Record<string, number>;
      first_purchase: string | null;
      last_purchase: string | null;
    };
  };
  product_analysis: {
    total_products_purchased: number;
    total_items_purchased: number;
    top_products: Array<{
      product_id: number;
      product_name: string;
      total_quantity: number;
      total_amount: number;
      purchase_count: number;
      avg_quantity_per_purchase: number;
    }>;
    product_categories: {
      category_count: string;
      top_category: string;
      category_diversity: string;
    };
    product_preferences: {
      favorite_product: string;
      most_frequent_product: string;
      highest_value_product: string;
      product_variety_score: string;
    };
  };
  behavioral_analysis: {
    purchase_frequency: {
      unique_purchase_days: number;
      avg_days_between_purchases: number;
      purchase_consistency: string;
      likely_next_purchase_days: number;
    };
    temporal_patterns: {
      day_of_week_preference: Record<string, number>;
      time_of_day_preference: Record<string, number>;
      preferred_purchase_time: string;
    };
    monetary_patterns: {
      avg_purchase_value: number;
      purchase_value_distribution: {
        min: number;
        max: number;
        median: number;
        quartile_1: number;
        quartile_3: number;
        interquartile_range: number;
      };
      spending_trend: string;
    };
  };
  trend_analysis: {
    monthly_trend: Array<{
      month: string;
      purchase_count: number;
      total_amount: number;
      avg_amount: number;
    }>;
    quarterly_trend: Array<{
      quarter: string;
      purchase_count: number;
      total_amount: number;
    }>;
    yearly_trend: Array<{
      year: string;
      purchase_count: number;
      total_amount: number;
    }>;
    growth_metrics: {
      avg_monthly_growth: number;
      growth_consistency: number;
      trend_strength: string;
      volatility: number;
    };
  };
  insights: {
    purchase_patterns: Record<string, boolean>;
    customer_segment: string;
    loyalty_indicator: number;
    potential_opportunities: string[];
  };
  recommendations: string[];
}

export interface CustomerCreateData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company_name?: string;
  tax_id?: string;
  customer_type?: 'individual' | 'business' | 'wholesale' | 'retail';
  status?: 'active' | 'inactive' | 'blocked';
  credit_limit?: number;
  current_balance?: number;
  payment_terms?: string;
  preferred_payment_method?: string;
  customer_group?: string;
  customer_rating?: number;
  notes?: string;
  tags?: string[];
  allow_marketing_emails?: boolean;
  allow_sms_notifications?: boolean;
}

export interface CustomerUpdateData extends CustomerCreateData {
  id: number;
}

export interface CustomerContactCreateData {
  customer_id: number;
  contact_type?: 'primary' | 'secondary' | 'billing' | 'shipping' | 'technical';
  first_name?: string;
  last_name?: string;
  position?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_default_contact?: boolean;
  receive_statements?: boolean;
  receive_marketing?: boolean;
  notes?: string;
}

export interface CustomerTransactionCreateData {
  customer_id: number;
  transaction_type: 'sale' | 'payment' | 'refund' | 'credit_note' | 'debit_note' | 'adjustment';
  transaction_date?: string;
  reference_id?: string;
  reference_type?: string;
  amount: number;
  description?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'reversed';
}

export interface CustomerFilters {
  status?: string;
  customer_type?: string;
  customer_group?: string;
  city?: string;
  search?: string;
  min_balance?: number;
  max_balance?: number;
  created_after?: string;
  created_before?: string;
  last_purchase_after?: string;
  page?: number;
  pageSize?: number;
  start_date?: string;
  end_date?: string;
  payment_method?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface CustomerResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
  pagination?: {
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
    next: boolean;
    previous: boolean;
  };
  summary?: any;
}

export interface CustomerPayload {
  method: string;
  params?: Record<string, any>;
}

class CustomerAPI {
  // 🔎 Read-only methods
  
  /**
   * Get all customers with optional filters
   */
  async getAllCustomers(filters?: CustomerFilters): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getAllCustomers",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customers");
    }
  }

  /**
   * Get paginated customers
   */
  async findPage(filters: CustomerFilters = {}, page: number = 1, pageSize: number = 20): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "findPage",
        params: { ...filters, page, pageSize },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customers page");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customers page");
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: number): Promise<CustomerResponse<CustomerData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer");
    }
  }

  /**
   * Get customer by customer code
   */
  async getCustomerByCode(customer_code: string): Promise<CustomerResponse<CustomerData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerByCode",
        params: { customer_code },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer");
    }
  }

  /**
   * Get customers by type
   */
  async getCustomersByType(customer_type: string, filters?: CustomerFilters): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomersByType",
        params: { customer_type, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customers by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customers by type");
    }
  }

  /**
   * Get customers by status
   */
  async getCustomersByStatus(status: string, filters?: CustomerFilters): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomersByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customers by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customers by status");
    }
  }

  /**
   * Get customers by group
   */
  async getCustomersByGroup(customer_group: string, filters?: CustomerFilters): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomersByGroup",
        params: { customer_group, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customers by group");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customers by group");
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string, filters?: CustomerFilters): Promise<CustomerResponse<CustomerData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "searchCustomers",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search customers");
    }
  }

  /**
   * Get customer contacts
   */
  async getCustomerContacts(customer_id: number): Promise<CustomerResponse<CustomerContactData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerContacts",
        params: { customer_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer contacts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer contacts");
    }
  }

  /**
   * Get customer transactions
   */
  async getCustomerTransactions(customer_id: number, filters?: CustomerFilters): Promise<CustomerResponse<CustomerTransactionData[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerTransactions",
        params: { customer_id, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer transactions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer transactions");
    }
  }

  /**
   * Get customer balance
   */
  async getCustomerBalance(customer_id: number): Promise<CustomerResponse<{
    customer: {
      id: number;
      code: string;
      name: string;
    };
    balance_details: {
      current_balance: number;
      credit_limit: number;
      available_credit: number;
      credit_utilization: number;
    };
    recent_transactions: CustomerTransactionData[];
    recent_summary: {
      total_sales: number;
      total_payments: number;
      transaction_count: number;
      net_change: number;
    };
    aging_analysis: Record<string, number>;
    last_updated: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerBalance",
        params: { customer_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer balance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer balance");
    }
  }

  /**
   * Get customer statement
   */
  async getCustomerStatement(
    customer_id: number,
    start_date: string,
    end_date: string
  ): Promise<CustomerResponse<CustomerStatementData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerStatement",
        params: { customer_id, start_date, end_date },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer statement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer statement");
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(
    date_range?: { start_date?: string; end_date?: string },
    filters?: CustomerFilters
  ): Promise<CustomerResponse<CustomerStatsData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerStats",
        params: { date_range, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer stats");
    }
  }

  /**
   * Get top customers
   */
  async getTopCustomers(
    limit: number = 10,
    date_range?: { start_date?: string; end_date?: string },
    filters?: CustomerFilters
  ): Promise<CustomerResponse<{
    top_customers_by_spending: Array<any>;
    top_customers_by_frequency: Array<any>;
    top_customers_by_recent_activity: Array<any>;
    summary: any;
    ranking_criteria: any;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getTopCustomers",
        params: { limit, date_range, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get top customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get top customers");
    }
  }

  /**
   * Get customer lifetime value
   */
  async getCustomerLifetimeValue(customer_id: number): Promise<CustomerResponse<CustomerLifetimeValueData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerLifetimeValue",
        params: { customer_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer lifetime value");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer lifetime value");
    }
  }

  /**
   * Get customer purchase history
   */
  async getCustomerPurchaseHistory(
    customer_id: number,
    filters?: CustomerFilters
  ): Promise<CustomerResponse<CustomerPurchaseHistoryData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerPurchaseHistory",
        params: { customer_id, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get customer purchase history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get customer purchase history");
    }
  }

  // 🔒 Mutating methods

  /**
   * Create a new customer
   */
  async createCustomer(customer_data: CustomerCreateData): Promise<CustomerResponse<{
    customer: CustomerData;
    customer_code: string;
    timestamp: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "createCustomer",
        params: { customer_data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create customer");
    }
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(customer_id: number, customer_data: CustomerUpdateData): Promise<CustomerResponse<{
    customer: CustomerData;
    changes: Array<{
      field: string;
      old_value: any;
      new_value: any;
    }>;
    timestamp: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "updateCustomer",
        params: { customer_id, customer_data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update customer");
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(customer_id: number, reason?: string): Promise<CustomerResponse<{
    customer_id: number;
    customer_code: string;
    status: string;
    sales_count?: number;
    deleted_at?: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "deleteCustomer",
        params: { customer_id, reason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete customer");
    }
  }

  /**
   * Activate a customer
   */
  async activateCustomer(customer_id: number): Promise<CustomerResponse<{
    customer: CustomerData;
    timestamp: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "activateCustomer",
        params: { customer_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to activate customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to activate customer");
    }
  }

  /**
   * Deactivate a customer
   */
  async deactivateCustomer(customer_id: number, reason?: string): Promise<CustomerResponse<{
    customer: CustomerData;
    timestamp: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "deactivateCustomer",
        params: { customer_id, reason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to deactivate customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to deactivate customer");
    }
  }

  /**
   * Add a contact to a customer
   */
  async addContact(contact_data: CustomerContactCreateData): Promise<CustomerResponse<{
    contact: CustomerContactData;
    customer: {
      id: number;
      code: string;
      name: string;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "addContact",
        params: { contact_data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add contact");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add contact");
    }
  }

  /**
   * Update a contact
   */
  async updateContact(contact_id: number, contact_data: Partial<CustomerContactCreateData>): Promise<CustomerResponse<{
    contact: CustomerContactData;
    changes: Array<{
      field: string;
      old_value: any;
      new_value: any;
    }>;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "updateContact",
        params: { contact_id, contact_data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update contact");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update contact");
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contact_id: number): Promise<CustomerResponse<{
    contact_id: number;
    customer_id: number;
    was_default: boolean;
    deleted_at: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "deleteContact",
        params: { contact_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete contact");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete contact");
    }
  }

  /**
   * Update customer balance
   */
  async updateCustomerBalance(
    customer_id: number,
    amount: number,
    transaction_type?: string,
    description?: string,
    reference_id?: string,
    reference_type?: string
  ): Promise<CustomerResponse<{
    customer: {
      id: number;
      code: string;
      name: string;
    };
    transaction: CustomerTransactionData;
    balance_summary: {
      before: number;
      after: number;
      change: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "updateCustomerBalance",
        params: {
          customer_id,
          amount,
          transaction_type,
          description,
          reference_id,
          reference_type,
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update customer balance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update customer balance");
    }
  }

  /**
   * Add a transaction to a customer
   */
  async addTransaction(transaction_data: CustomerTransactionCreateData): Promise<CustomerResponse<{
    transaction: CustomerTransactionData;
    customer_balance: {
      before: number;
      after: number;
      change: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.customer) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.customer({
        method: "addTransaction",
        params: { transaction_data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add transaction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add transaction");
    }
  }

  // Utility methods

  /**
   * Check if customer exists by email
   */
  async customerExistsByEmail(email: string): Promise<boolean> {
    try {
      const response = await this.searchCustomers(email, { search: email });
      return response.data.length > 0;
    } catch (error) {
      console.error("Error checking if customer exists by email:", error);
      return false;
    }
  }

  /**
   * Check if customer exists by phone
   */
  async customerExistsByPhone(phone: string): Promise<boolean> {
    try {
      const response = await this.searchCustomers(phone, { search: phone });
      return response.data.length > 0;
    } catch (error) {
      console.error("Error checking if customer exists by phone:", error);
      return false;
    }
  }

  /**
   * Get customer by email or phone
   */
  async getCustomerByEmailOrPhone(emailOrPhone: string): Promise<CustomerData | null> {
    try {
      const response = await this.searchCustomers(emailOrPhone, { search: emailOrPhone });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error("Error getting customer by email or phone:", error);
      return null;
    }
  }

  /**
   * Generate a new customer code
   */
  async generateCustomerCode(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CUST-${timestamp}-${random}`;
  }

  /**
   * Validate customer data before creation
   */
  async validateCustomerData(customerData: CustomerCreateData): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required fields
    if (!customerData.first_name && !customerData.company_name) {
      errors.push("Either first name or company name is required");
    }

    // Validate email format if provided
    if (customerData.email && !this.isValidEmail(customerData.email)) {
      errors.push("Invalid email format");
    }

    // Validate phone format if provided
    if (customerData.phone && !this.isValidPhone(customerData.phone)) {
      errors.push("Invalid phone number format");
    }

    // Validate credit limit if provided
    if (customerData.credit_limit !== undefined && customerData.credit_limit < 0) {
      errors.push("Credit limit cannot be negative");
    }

    // Validate current balance if provided
    if (customerData.current_balance !== undefined && customerData.current_balance < 0) {
      errors.push("Current balance cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate customer credit utilization
   */
  async calculateCreditUtilization(customer_id: number): Promise<number> {
    try {
      const balanceResponse = await this.getCustomerBalance(customer_id);
      const balanceDetails = balanceResponse.data.balance_details;
      
      if (balanceDetails.credit_limit > 0) {
        return (balanceDetails.current_balance / balanceDetails.credit_limit) * 100;
      }
      return 0;
    } catch (error) {
      console.error("Error calculating credit utilization:", error);
      return 0;
    }
  }

  /**
   * Check if customer can make purchase based on credit limit
   */
  async canMakePurchase(customer_id: number, purchase_amount: number): Promise<{
    canPurchase: boolean;
    availableCredit: number;
    reason?: string;
  }> {
    try {
      const balanceResponse = await this.getCustomerBalance(customer_id);
      const balanceDetails = balanceResponse.data.balance_details;
      
      const availableCredit = Math.max(0, balanceDetails.credit_limit - balanceDetails.current_balance);
      const canPurchase = purchase_amount <= availableCredit;
      
      return {
        canPurchase,
        availableCredit,
        reason: canPurchase ? undefined : `Purchase amount exceeds available credit by ${purchase_amount - availableCredit}`,
      };
    } catch (error) {
      console.error("Error checking purchase eligibility:", error);
      return {
        canPurchase: false,
        availableCredit: 0,
        reason: "Error checking customer credit",
      };
    }
  }

  /**
   * Get customers who haven't purchased in X days
   */
  async getInactiveCustomers(days: number = 90): Promise<CustomerData[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const response = await this.getAllCustomers({
        status: 'active',
        last_purchase_after: cutoffDate.toISOString().split('T')[0],
      });
      
      return response.data.filter(customer => {
        if (!customer.last_purchase_at) return true;
        const lastPurchase = new Date(customer.last_purchase_at);
        return lastPurchase < cutoffDate;
      });
    } catch (error) {
      console.error("Error getting inactive customers:", error);
      return [];
    }
  }

  /**
   * Get customers with high credit utilization
   */
  async getHighRiskCustomers(threshold: number = 80): Promise<Array<{
    customer: CustomerData;
    credit_utilization: number;
  }>> {
    try {
      const allCustomers = await this.getAllCustomers({ status: 'active' });
      const highRiskCustomers: Array<{ customer: CustomerData; credit_utilization: number }> = [];
      
      for (const customer of allCustomers.data) {
        if (customer.credit_limit > 0) {
          const utilization = (customer.current_balance / customer.credit_limit) * 100;
          if (utilization >= threshold) {
            highRiskCustomers.push({
              customer,
              credit_utilization: utilization,
            });
          }
        }
      }
      
      return highRiskCustomers;
    } catch (error) {
      console.error("Error getting high-risk customers:", error);
      return [];
    }
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Event listeners
  onCustomerCreated(callback: (customer: CustomerData) => void) {
    if (window.backendAPI && window.backendAPI.onCustomerCreated) {
      window.backendAPI.onCustomerCreated(callback);
    }
  }

  onCustomerUpdated(callback: (customer: CustomerData) => void) {
    if (window.backendAPI && window.backendAPI.onCustomerUpdated) {
      window.backendAPI.onCustomerUpdated(callback);
    }
  }

  onCustomerDeleted(callback: (customerId: number) => void) {
    if (window.backendAPI && window.backendAPI.onCustomerDeleted) {
      window.backendAPI.onCustomerDeleted(callback);
    }
  }

  onCustomerBalanceUpdated(callback: (data: {
    customer_id: number;
    old_balance: number;
    new_balance: number;
    transaction: CustomerTransactionData;
  }) => void) {
    if (window.backendAPI && window.backendAPI.onCustomerBalanceUpdated) {
      window.backendAPI.onCustomerBalanceUpdated(callback);
    }
  }
}

const customerAPI = new CustomerAPI();

export default customerAPI;