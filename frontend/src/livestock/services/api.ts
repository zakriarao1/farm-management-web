// frontend/src/livestock/services/api.ts
import { authService } from '../../services/authService';
import type { 
  Livestock, 
  HealthRecord, 
  BreedingRecord, 
  MilkProduction,
  CreateLivestockRequest,
  UpdateLivestockRequest,
  LivestockStats,
  HealthAlert,
  Flock,
  FlockFinancialSummary
} from '../types';
import { salesApi } from './salesApi';

const API_BASE_URL = 'http://localhost:5000';

interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

// Standalone API request function for livestock only
export const livestockApiRequest = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
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
    console.error('Livestock API Request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown livestock API error occurred');
  }
};

const transformLivestockData = (data: any): Livestock => ({
  id: data.id,
  tagId: data.tag_id,
  type: data.type as Livestock['type'],
  breed: data.breed,
  gender: data.gender as Livestock['gender'],
  dateOfBirth: data.date_of_birth,
  purchaseDate: data.purchase_date,
  purchasePrice: data.purchase_price,
  weight: data.weight,
  status: data.status as Livestock['status'],
  location: data.location,
  notes: data.notes,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  // Use tag_id as identifier if identifier doesn't exist
  identifier: data.identifier || data.tag_id,
  species: data.species || data.type,
  flock_name: data.flock_name,
  flock_id: data.flock_id
});

const transformToSnakeCase = (data: any): any => ({
  tag_id: data.tagId,
  type: data.type,
  breed: data.breed,
  gender: data.gender,
  date_of_birth: data.dateOfBirth,
  purchase_date: data.purchaseDate,
  purchase_price: data.purchasePrice,
  weight: data.weight,
  status: data.status,
  location: data.location,
  notes: data.notes,
  // Include the additional properties if they exist
  ...(data.identifier && { identifier: data.identifier }),
  ...(data.species && { species: data.species }),
  ...(data.flock_name && { flock_name: data.flock_name })
});

const transformFinancialData = (data: any): any => {
  if (!data) return data;
  
  // Ensure all numeric fields are properly converted
  const numericFields = [
    'total_purchase_cost', 'total_sale_revenue', 'total_production_revenue',
    'total_expenses', 'total_medical_costs', 'net_profit_loss',
    'purchase_cost', 'total_revenue', 'net_profit', 'current_value'
  ];
  
  const transformed = { ...data };
  
  numericFields.forEach(field => {
    if (field in transformed) {
      transformed[field] = Number(transformed[field]) || 0;
    }
  });
  
  return transformed;
};

// Add to your api.ts file
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Financial Summary API
export const financialSummaryApi = {
  getFlockSummary: async (flockId?: number): Promise<ApiResponse<FlockFinancialSummary[]>> => {
    const response = await livestockApiRequest<any[]>(`/api/financial-summary/flocks${flockId ? `?flockId=${flockId}` : ''}`);
    return {
      ...response,
      data: response.data?.map(transformFinancialData) || []
    };
  },

  getAnimalSummary: async (animalId?: number): Promise<ApiResponse<any[]>> => {
    const response = await livestockApiRequest<any[]>(`/api/financial-summary/animals${animalId ? `?animalId=${animalId}` : ''}`);
    return {
      ...response,
      data: response.data?.map(transformFinancialData) || []
    };
  },

  getFlockMetrics: async (flockId: number): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/api/financial-summary/flocks/${flockId}/metrics`);
  },
};

// Export the livestock API methods
export const livestockApi = {
  // Livestock CRUD
  getAll: async (): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>('/api/livestock');
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getById: async (id: number): Promise<ApiResponse<Livestock>> => {
    const response = await livestockApiRequest<any>(`/api/livestock/${id}`);
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  create: async (livestockData: CreateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    const snakeCaseData = transformToSnakeCase(livestockData);
    const response = await livestockApiRequest<any>('/api/livestock', {
      method: 'POST',
      body: JSON.stringify(snakeCaseData),
    });
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  update: async (id: number, livestockData: UpdateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    const snakeCaseData = transformToSnakeCase(livestockData);
    const response = await livestockApiRequest<any>(`/api/livestock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(snakeCaseData),
    });
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/livestock/${id}`, {
      method: 'DELETE',
    });
  },

  // Sale recording (individual animal sale)
  recordSale: async (id: number, saleData: { sale_price: number; sale_date: string; sale_reason?: string }): Promise<ApiResponse<Livestock>> => {
    const response = await livestockApiRequest<any>(`/api/livestock/${id}/sale`, {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  // Health Records
  getHealthRecords: async (livestockId: number): Promise<ApiResponse<HealthRecord[]>> => {
    return livestockApiRequest<HealthRecord[]>(`/api/livestock/${livestockId}/health-records`);
  },

  addHealthRecord: async (livestockId: number, record: Omit<HealthRecord, 'id' | 'livestockId' | 'createdAt'>): Promise<ApiResponse<HealthRecord>> => {
    return livestockApiRequest<HealthRecord>(`/api/livestock/${livestockId}/health-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  updateHealthRecord: async (recordId: number, recordData: Partial<HealthRecord>): Promise<ApiResponse<HealthRecord>> => {
    return livestockApiRequest<HealthRecord>(`/api/health-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  },

  deleteHealthRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/health-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  // Breeding Records
  getBreedingRecords: async (livestockId: number): Promise<ApiResponse<BreedingRecord[]>> => {
    return livestockApiRequest<BreedingRecord[]>(`/api/livestock/${livestockId}/breeding-records`);
  },

  addBreedingRecord: async (livestockId: number, record: Omit<BreedingRecord, 'id' | 'livestockId' | 'createdAt'>): Promise<ApiResponse<BreedingRecord>> => {
    return livestockApiRequest<BreedingRecord>(`/api/livestock/${livestockId}/breeding-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  updateBreedingRecord: async (recordId: number, recordData: Partial<BreedingRecord>): Promise<ApiResponse<BreedingRecord>> => {
    return livestockApiRequest<BreedingRecord>(`/api/breeding-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  },

  deleteBreedingRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/breeding-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  // Milk Production Records
  getMilkProductions: async (livestockId: number): Promise<ApiResponse<MilkProduction[]>> => {
    return livestockApiRequest<MilkProduction[]>(`/api/livestock/${livestockId}/milk-productions`);
  },

  addMilkProduction: async (livestockId: number, record: Omit<MilkProduction, 'id' | 'livestockId' | 'createdAt'>): Promise<ApiResponse<MilkProduction>> => {
    return livestockApiRequest<MilkProduction>(`/api/livestock/${livestockId}/milk-productions`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  // Analytics
  getLivestockStats: async (): Promise<ApiResponse<LivestockStats>> => {
    return livestockApiRequest<LivestockStats>('/api/livestock/analytics/stats');
  },

  getHealthAlerts: async (): Promise<ApiResponse<HealthAlert[]>> => {
    return livestockApiRequest<HealthAlert[]>('/api/livestock/analytics/health-alerts');
  },

  // Search and filter
  searchLivestock: async (query: string): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/api/livestock/search?q=${encodeURIComponent(query)}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getByStatus: async (status: string): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/api/livestock/status/${status}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getByFlock: async (flockId: number): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/api/livestock/flock/${flockId}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  }
};

export const flockApi = {
  getAll: async (): Promise<ApiResponse<Flock[]>> => {
    console.log('🔄 Fetching flocks from API...');
    const response = await livestockApiRequest<any[]>('/api/flocks');
    console.log('📦 Raw flocks API response:', response);
    
    // Transform the data if needed
    const transformedData = response.data?.map(flock => ({
      id: flock.id,
      name: flock.name,
      description: flock.description,
      purchase_date: flock.purchase_date,
      total_purchase_cost: flock.total_purchase_cost,
      created_at: flock.created_at,
      updated_at: flock.updated_at
    })) || [];
    
    console.log('🔄 Transformed flocks data:', transformedData);
    
    return {
      ...response,
      data: transformedData
    };
  },

  getById: async (id: number): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>(`/api/flocks/${id}`);
    return {
      ...response,
      data: {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        purchase_date: response.data.purchase_date,
        total_purchase_cost: response.data.total_purchase_cost,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      }
    };
  },

  create: async (flockData: Omit<Flock, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>('/api/flocks', {
      method: 'POST',
      body: JSON.stringify(flockData),
    });
    return {
      ...response,
      data: response.data
    };
  },

  update: async (id: number, flockData: Partial<Flock>): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>(`/api/flocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flockData),
    });
    return {
      ...response,
      data: response.data
    };
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/flocks/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (id: number): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/api/flocks/${id}/stats`);
  }
};

// Additional livestock expense API
export const livestockExpenseApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>('/api/livestock-expenses');
  },

  getByFlockId: async (flockId: number): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>(`/api/livestock-expenses/flock/${flockId}`);
  },

  getById: async (id: number): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/api/livestock-expenses/${id}`);
  },

  create: async (expenseData: any): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>('/api/livestock-expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  update: async (id: number, expenseData: any): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/api/livestock-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/livestock-expenses/${id}`, {
      method: 'DELETE',
    });
  },

  getExpenseSummary: async (): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>('/api/livestock-expenses/reports/summary');
  },

  getFlockExpenseSummary: async (): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>('/api/livestock-expenses/reports/flock-summary');
  }
};

// Medical treatments API
export const medicalTreatmentApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>('/api/medical-treatments');
  },

  getByLivestockId: async (livestockId: number): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>(`/api/medical-treatments/livestock/${livestockId}`);
  },

  getUpcoming: async (days?: number): Promise<ApiResponse<any[]>> => {
    const url = days ? `/api/medical-treatments/upcoming?days=${days}` : '/api/medical-treatments/upcoming';
    return livestockApiRequest<any[]>(url);
  },

  create: async (treatmentData: any): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>('/api/medical-treatments', {
      method: 'POST',
      body: JSON.stringify(treatmentData),
    });
  },

  update: async (id: number, treatmentData: any): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/api/medical-treatments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(treatmentData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/api/medical-treatments/${id}`, {
      method: 'DELETE',
    });
  }
};

// Production records API
export const productionApi = {
  getAll: async (): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>('/api/production-records');
  },

  getByFlockId: async (flockId: number): Promise<ApiResponse<any[]>> => {
    return livestockApiRequest<any[]>(`/api/production-records/flock/${flockId}`);
  },

  getSummary: async (flockId?: number): Promise<ApiResponse<any>> => {
    const url = flockId ? `/api/production-records/summary?flockId=${flockId}` : '/api/production-records/summary';
    return livestockApiRequest<any>(url);
  },

  create: async (recordData: any): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>('/api/production-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }
};

// Re-export salesApi from the separate file
export { salesApi } from './salesApi';

// Default export for backward compatibility
export default {
  livestockApi,
  flockApi,
  salesApi,
  financialSummaryApi,
  livestockExpenseApi,
  medicalTreatmentApi,
  productionApi,
  safeNumber,
  livestockApiRequest
};