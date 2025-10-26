// frontend/src/livestock/services/salesApi.ts
import { authService } from '../../services/authService';

const API_BASE_URL = 'http://localhost:5000';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Standalone API request function for sales
const salesApiRequest = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    });

    if (response.status === 401) {
      authService.logout();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      let errorData: { error?: string; message?: string };
      try {
        errorData = await response.json() as { error?: string; message?: string };
      } catch {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: `Route not found: ${fullUrl}`
        };
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData as ApiResponse<T>;

  } catch (error) {
    console.error('Sales API Request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown sales API error occurred');
  }
};

export interface SaleRecord {
  id?: number;
  livestock_id?: number;
  flock_id?: number;
  sale_type: 'animal' | 'product' | 'other';
  sale_date: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_name?: string;
  customer_contact?: string;
  payment_method: string;
  notes?: string;
}

export const salesApi = {
  // Record a new sale
  recordSale: async (saleData: Omit<SaleRecord, 'id'>): Promise<ApiResponse<SaleRecord>> => {
    return salesApiRequest<SaleRecord>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  },

  // Get all sales
  getAll: async (): Promise<ApiResponse<SaleRecord[]>> => {
    return salesApiRequest<SaleRecord[]>('/api/sales');
  },

  // Get sales summary
  getSummary: async (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    let url = '/api/sales/summary';
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return salesApiRequest<any>(url);
  },

  // Delete a sale
  delete: async (saleId: number): Promise<ApiResponse<{ message: string }>> => {
    return salesApiRequest<{ message: string }>(`/api/sales/${saleId}`, {
      method: 'DELETE',
    });
  },

  // Get sales by flock
  getByFlock: async (flockId: number): Promise<ApiResponse<SaleRecord[]>> => {
    return salesApiRequest<SaleRecord[]>(`/api/sales/flock/${flockId}`);
  },

  // Get recent sales
  getRecent: async (limit: number = 10): Promise<ApiResponse<SaleRecord[]>> => {
    return salesApiRequest<SaleRecord[]>(`/api/sales/recent?limit=${limit}`);
  }
};