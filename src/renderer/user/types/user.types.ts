export interface User {
  id: number;
  email: string;
  display_name: string;
  username: string;
  roles: string[];
  status: 'active' | 'inactive' | 'suspended';
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  created_by: number | null;
  department?: string;
  phone?: string;
  notes?: string;
}

export interface UserFormData {
  email: string;
  display_name: string;
  username: string;
  password?: string;
  roles: string[];
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  phone?: string;
  notes?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  created_after?: string;
  created_before?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: {
    id: number;
    display_name: string;
    email: string;
  };
}