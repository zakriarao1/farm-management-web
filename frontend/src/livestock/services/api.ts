// frontend/src/livestock/services/api.ts
import { authService } from '../../services/authService';
import type { 
  Livestock, 
  HealthRecord, 
  BreedingRecord, 
  MilkProduction,
  CreateLivestockRequest,
  UpdateLivestockRequest,
  Flock,
  FlockFinancialSummary,
  LivestockExpense,
  CreateLivestockExpenseRequest,
  UpdateLivestockExpenseRequest,
  FlockExpenseSummary,
  MedicalTreatment,
  CreateMedicalTreatmentRequest,
  UpdateMedicalTreatmentRequest,
  ProductionRecord,
  UpdateHealthRecordRequest
} from '../types';
import { salesApi } from './salesApi';

const getApiBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8888/.netlify/functions';
  }
  return '/.netlify/functions';
};
const API_BASE_URL = getApiBaseUrl();

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

// Transformation function for livestock data (handles both old and new field names during transition)
const transformLivestockData = (data: any): Livestock => {
  return {
    id: data.id,
    tag_number: data.tag_number || data.tagId || '',
    animal_type: data.animal_type || data.type || 'OTHER',
    breed: data.breed || '',
    gender: data.gender || 'UNKNOWN',
    date_of_birth: data.date_of_birth || data.dateOfBirth,
    purchase_date: data.purchase_date || data.purchaseDate,
    purchase_price: data.purchase_price || data.purchasePrice || 0,
    current_weight: data.current_weight || data.weight || 0,
    status: data.status || 'HEALTHY',
    location: data.location || '',
    notes: data.notes || '',
    flock_id: data.flock_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
    flock_name: data.flock_name
  };
};

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

export type CreateHealthRecordRequest = Omit<HealthRecord, "id" | "livestock_id" | "created_at" | "updated_at">;

// Utility function for safe number conversion
export const safeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Financial Summary API
export const financialSummaryApi = {
  getFlockSummary: async (flockId?: number): Promise<ApiResponse<FlockFinancialSummary[]>> => {
    const response = await livestockApiRequest<any[]>(`/financial-summary/flocks${flockId ? `?flockId=${flockId}` : ''}`);
    return {
      ...response,
      data: response.data?.map(transformFinancialData) || []
    };
  },

  getAnimalSummary: async (animalId?: number): Promise<ApiResponse<any[]>> => {
    const response = await livestockApiRequest<any[]>(`/financial-summary/animals${animalId ? `?animalId=${animalId}` : ''}`);
    return {
      ...response,
      data: response.data?.map(transformFinancialData) || []
    };
  },

  getFlockMetrics: async (flockId: number): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/financial-summary/flocks/${flockId}/metrics`);
  },
};

// Export the livestock API methods
export const livestockApi = {
  // Livestock CRUD
  getAll: async (): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>('/livestock');
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getById: async (id: number): Promise<ApiResponse<Livestock>> => {
    const response = await livestockApiRequest<any>(`/livestock/${id}`);
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  create: async (livestockData: CreateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    // No transformation needed - data is already in correct format
    const response = await livestockApiRequest<any>('/livestock', {
      method: 'POST',
      body: JSON.stringify(livestockData),
    });
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  update: async (id: number, livestockData: UpdateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    // No transformation needed - data is already in correct format
    const response = await livestockApiRequest<any>(`/livestock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(livestockData),
    });
    return {
      ...response,
      data: transformLivestockData(response.data)
    };
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/livestock/${id}`, {
      method: 'DELETE',
    });
  },

  // Sale recording (individual animal sale)
  recordSale: async (id: number, saleData: { sale_price: number; sale_date: string; sale_reason?: string }): Promise<ApiResponse<Livestock>> => {
    const response = await livestockApiRequest<any>(`/livestock/${id}/sale`, {
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
    const response = await livestockApiRequest<any[]>(`/livestock/${livestockId}/health-records`);
    return {
      ...response,
      data: response.data || []
    };
  },

  addHealthRecord: async (livestockId: number, record: CreateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => {
    const response = await livestockApiRequest<HealthRecord>(`/livestock/${livestockId}/health-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return response;
  },

  updateHealthRecord: async (recordId: number, recordData: Partial<HealthRecord>): Promise<ApiResponse<HealthRecord>> => {
    const response = await livestockApiRequest<HealthRecord>(`/health-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return response;
  },

  deleteHealthRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/health-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  // Breeding Records
  getBreedingRecords: async (livestockId: number): Promise<ApiResponse<BreedingRecord[]>> => {
    const response = await livestockApiRequest<any[]>(`/livestock/${livestockId}/breeding-records`);
    return {
      ...response,
      data: response.data || []
    };
  },

  addBreedingRecord: async (livestockId: number, record: Omit<BreedingRecord, 'id' | 'livestock_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<BreedingRecord>> => {
    const response = await livestockApiRequest<BreedingRecord>(`/livestock/${livestockId}/breeding-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return response;
  },

  updateBreedingRecord: async (recordId: number, recordData: Partial<BreedingRecord>): Promise<ApiResponse<BreedingRecord>> => {
    const response = await livestockApiRequest<BreedingRecord>(`/breeding-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return response;
  },

  deleteBreedingRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/breeding-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  // Milk Production Records
  getMilkProductions: async (livestockId: number): Promise<ApiResponse<MilkProduction[]>> => {
    const response = await livestockApiRequest<any[]>(`/livestock/${livestockId}/milk-productions`);
    return {
      ...response,
      data: response.data || []
    };
  },

  addMilkProduction: async (livestockId: number, record: Omit<MilkProduction, 'id' | 'livestock_id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<MilkProduction>> => {
    const response = await livestockApiRequest<MilkProduction>(`/livestock/${livestockId}/milk-productions`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
    return response;
  },

  // Search and filter
  searchLivestock: async (query: string): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/livestock/search?q=${encodeURIComponent(query)}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getByStatus: async (status: string): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/livestock/status/${status}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  },

  getByFlock: async (flockId: number): Promise<ApiResponse<Livestock[]>> => {
    const response = await livestockApiRequest<any[]>(`/livestock/flock/${flockId}`);
    return {
      ...response,
      data: response.data?.map(transformLivestockData) || []
    };
  }
};

// Flock API (unchanged)
export const flockApi = {
  getAll: async (): Promise<ApiResponse<Flock[]>> => {
    console.log('🔄 Fetching flocks from API...');
    const response = await livestockApiRequest<any[]>('/flocks');
    console.log('📦 Raw flocks API response:', response);
    
    const transformedData = response.data?.map(flock => ({
      id: flock.id,
      name: flock.name,
      animal_type: flock.animal_type || flock.breed || 'OTHER',
      breed: flock.breed,
      total_animals: flock.total_animals || flock.quantity || 0,
      current_animals: flock.current_animals || flock.quantity || 0,
      purchase_date: flock.purchase_date,
      purchase_price: flock.purchase_price || flock.total_purchase_cost,
      health_status: flock.health_status,
      age: flock.age,
      description: flock.description,
      created_at: flock.created_at,
      updated_at: flock.updated_at
    })) || [];
    
    return {
      ...response,
      data: transformedData as Flock[]
    };
  },

  getById: async (id: number): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>(`/flocks/${id}`);
    return {
      ...response,
      data: {
        id: response.data.id,
        name: response.data.name,
        animal_type: response.data.animal_type || response.data.breed || 'OTHER',
        breed: response.data.breed,
        total_animals: response.data.total_animals || response.data.quantity || 0,
        current_animals: response.data.current_animals || response.data.quantity || 0,
        purchase_date: response.data.purchase_date,
        purchase_price: response.data.purchase_price || response.data.total_purchase_cost,
        health_status: response.data.health_status,
        age: response.data.age,
        description: response.data.description,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      } as Flock
    };
  },

  create: async (flockData: Omit<Flock, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>('/flocks', {
      method: 'POST',
      body: JSON.stringify(flockData),
    });
    return {
      ...response,
      data: response.data as Flock
    };
  },

  update: async (id: number, flockData: Partial<Flock>): Promise<ApiResponse<Flock>> => {
    const response = await livestockApiRequest<any>(`/flocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flockData),
    });
    return {
      ...response,
      data: response.data as Flock
    };
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return livestockApiRequest<{ message: string }>(`/flocks/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async (id: number): Promise<ApiResponse<any>> => {
    return livestockApiRequest<any>(`/flocks/${id}/stats`);
  }
};

// Other APIs remain unchanged...
export const livestockExpenseApi = {
  getAll: (): Promise<ApiResponse<LivestockExpense[]>> => 
    livestockApiRequest<LivestockExpense[]>('/livestock-expenses'),

  getByFlockId: (flockId: number): Promise<ApiResponse<LivestockExpense[]>> => 
    livestockApiRequest<LivestockExpense[]>(`/livestock-expenses/flock/${flockId}`),

  getById: (id: number): Promise<ApiResponse<LivestockExpense>> => 
    livestockApiRequest<LivestockExpense>(`/livestock-expenses/${id}`),

  create: (expenseData: CreateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => 
    livestockApiRequest<LivestockExpense>('/livestock-expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  update: (id: number, expenseData: UpdateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => 
    livestockApiRequest<LivestockExpense>(`/livestock-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    livestockApiRequest<{ message: string }>(`/livestock-expenses/${id}`, {
      method: 'DELETE',
    }),

  getExpenseSummary: (): Promise<ApiResponse<Array<{ category: string; expense_count: number; total_amount: number }>>> => 
    livestockApiRequest('/livestock-expenses/reports/summary'),

  getFlockExpenseSummary: (): Promise<ApiResponse<FlockExpenseSummary[]>> => 
    livestockApiRequest<FlockExpenseSummary[]>('/livestock-expenses/reports/flock-summary'),
};

export const medicalTreatmentApi = {
  getAll: (): Promise<ApiResponse<MedicalTreatment[]>> => 
    livestockApiRequest<MedicalTreatment[]>('/medical-treatments'),

  getByLivestockId: (livestockId: number): Promise<ApiResponse<MedicalTreatment[]>> => 
    livestockApiRequest<MedicalTreatment[]>(`/medical-treatments/livestock/${livestockId}`),

  getUpcoming: (days?: number): Promise<ApiResponse<MedicalTreatment[]>> => 
    livestockApiRequest<MedicalTreatment[]>(`/medical-treatments/upcoming?days=${days || 30}`),

  getById: (id: number): Promise<ApiResponse<MedicalTreatment>> => 
    livestockApiRequest<MedicalTreatment>(`/medical-treatments/${id}`),

  create: (treatmentData: CreateMedicalTreatmentRequest): Promise<ApiResponse<MedicalTreatment>> => 
    livestockApiRequest<MedicalTreatment>('/medical-treatments', {
      method: 'POST',
      body: JSON.stringify(treatmentData),
    }),

  update: (id: number, treatmentData: UpdateMedicalTreatmentRequest): Promise<ApiResponse<MedicalTreatment>> => 
    livestockApiRequest<MedicalTreatment>(`/medical-treatments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(treatmentData),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    livestockApiRequest<{ message: string }>(`/medical-treatments/${id}`, {
      method: 'DELETE',
    }),
};

export const productionApi = {
  getAll: (): Promise<ApiResponse<ProductionRecord[]>> => 
    livestockApiRequest<ProductionRecord[]>('/production-records'),

  getByFlockId: (flockId: number): Promise<ApiResponse<ProductionRecord[]>> => 
    livestockApiRequest<ProductionRecord[]>(`/production-records/flock/${flockId}`),

  getSummary: (flockId?: number): Promise<ApiResponse<any>> => 
    livestockApiRequest<any>(`/production-records/summary${flockId ? `?flockId=${flockId}` : ''}`),

  create: (recordData: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProductionRecord>> => 
    livestockApiRequest<ProductionRecord>('/production-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),
};

export const healthRecordsApi = {
  getAll: (): Promise<ApiResponse<HealthRecord[]>> => 
    livestockApiRequest<HealthRecord[]>('/health-records'),

  getByLivestock: (livestockId: number): Promise<ApiResponse<HealthRecord[]>> => 
    livestockApiRequest<HealthRecord[]>(`/health-records?livestockId=${livestockId}`),

  getById: (id: number): Promise<ApiResponse<HealthRecord>> => 
    livestockApiRequest<HealthRecord>(`/health-records/${id}`),

  create: (data: CreateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => 
    livestockApiRequest<HealthRecord>('/health-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => 
    livestockApiRequest<HealthRecord>(`/health-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    livestockApiRequest<{ message: string }>(`/health-records/${id}`, {
      method: 'DELETE',
    }),
};

// Re-export salesApi from the separate file
export { salesApi };

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