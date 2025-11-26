// frontend/src/livestock/services/salesApi.ts
import { authService } from '../../services/authService';

const getApiBaseUrl = (): string => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8888/.netlify/functions' 
    : '/.netlify/functions';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Enhanced API request function with better error handling
const salesApiRequest = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
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
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use default message
      }
      
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    return responseData;

  } catch (error) {
    console.error('Sales API Request failed:', error);
    throw error instanceof Error ? error : new Error('Unknown sales API error occurred');
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
  created_at?: string;
  updated_at?: string;
  // Joined fields
  flock_name?: string;
  livestock_tag?: string;
  livestock_type?: string;
}

export const salesApi = {
  // Record a new sale
  recordSale: async (saleData: Omit<SaleRecord, 'id'>): Promise<ApiResponse<SaleRecord>> => {
    // Ensure total_amount is calculated
    const processedData = {
      ...saleData,
      total_amount: saleData.quantity * saleData.unit_price
    };
    
    return salesApiRequest<SaleRecord>('/sales', {
      method: 'POST',
      body: JSON.stringify(processedData),
    });
  },

  // Get all sales with optional filtering
  getAll: async (params?: {
    startDate?: string;
    endDate?: string;
    flockId?: number;
    livestockId?: number;
  }): Promise<ApiResponse<SaleRecord[]>> => {
    let url = '/sales';
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.startDate) searchParams.append('startDate', params.startDate);
      if (params.endDate) searchParams.append('endDate', params.endDate);
      if (params.flockId) searchParams.append('flockId', params.flockId.toString());
      if (params.livestockId) searchParams.append('livestockId', params.livestockId.toString());
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    
    return salesApiRequest<SaleRecord[]>(url);
  },

  // Get sale by ID
  getById: async (saleId: number): Promise<ApiResponse<SaleRecord>> => {
    return salesApiRequest<SaleRecord>(`/sales/${saleId}`);
  },

  // Update sale
  update: async (saleId: number, saleData: Partial<SaleRecord>): Promise<ApiResponse<SaleRecord>> => {
    return salesApiRequest<SaleRecord>(`/sales/${saleId}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  },

  // Delete sale
  delete: async (saleId: number): Promise<ApiResponse<{ message: string }>> => {
    return salesApiRequest<{ message: string }>(`/sales/${saleId}`, {
      method: 'DELETE',
    });
  },

  // Get sales summary
  getSummary: async (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    let url = '/sales-summary'; // Note: Changed from /sales/summary to match your function
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return salesApiRequest<any>(url);
  },

  // Get recent sales
  getRecent: async (limit: number = 10): Promise<ApiResponse<SaleRecord[]>> => {
    return salesApiRequest<SaleRecord[]>(`/sales?limit=${limit}`);
  }
};