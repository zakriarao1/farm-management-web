// frontend/src/services/api.ts
import type { 
  Crop, 
  CreateCropRequest, 
  UpdateCropRequest, 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ApiResponse,
  Task, 
  WeatherData, 
  InventoryItem, 
  CreateTaskRequest, 
  CreateInventoryItemRequest, 
  UseInventoryItemRequest,
  HarvestReminderResponse,
  WeatherRecommendationsResponse,
  ProfitLossReport,
  ROIAnalysisResponse,
  
} from '../types';
import type {
  Flock,
  LivestockExpense,
  CreateLivestockExpenseRequest,
  UpdateLivestockExpenseRequest,
  FlockExpenseSummary,
  LivestockExpenseReport
} from '../livestock/types';
import type {
  Livestock,
  CreateLivestockRequest,
  UpdateLivestockRequest,
  HealthRecord,
  BreedingRecord,
  LivestockStats,
  HealthAlert,
    MedicalTreatment,
  UpdateMedicalTreatmentRequest,
  ProductionRecord, 
  FlockFinancialSummary,
  AnimalFinancialSummary,
  CreateMedicalTreatmentRequest
} from '../livestock/types';

// Define response format types
interface RawApiResponse {
  data?: unknown;
  message?: string;
  [key: string]: unknown; // Allow other properties like 'crops', 'expenses', etc.
}

// Safe environment variable access
const getApiBaseUrl = (): string => {
  // Check if process exists and has env (for Node.js/React build process)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback for browser environment
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Get auth headers without circular dependency
const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const token = localStorage.getItem('authToken');
    
    // Check token expiry
    const expiry = localStorage.getItem('tokenExpiry');
    if (expiry && Date.now() >= parseInt(expiry, 10)) {
      // Token expired, clear it
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
      return {};
    }
    
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
};

// Handle unauthorized response
const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// Enhanced API request handler with proper typing
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    });

    if (response.status === 401) {
      // Token expired or invalid
      handleUnauthorized();
      throw new Error('Authentication required. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('Access forbidden. Please check your permissions.');
    }

    if (!response.ok) {
      let errorData: { error?: string; message?: string };
      try {
        errorData = await response.json() as { error?: string; message?: string };
      } catch {
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: `Request failed: ${fullUrl}`
        };
      }
      
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json() as RawApiResponse | unknown[];
    console.log('✅ API Raw Response:', responseData);

    // Handle different response formats with proper typing
    let finalData: ApiResponse<T>;

    if (Array.isArray(responseData)) {
      // Backend returns direct array
      console.log('📦 Backend returns direct array');
      finalData = { 
        data: responseData as T, 
        message: 'Success' 
      };
    } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      // Backend returns { data: [], message: '' } format
      console.log('📦 Backend returns wrapped response');
      finalData = responseData as ApiResponse<T>;
    } else if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      // Backend returns { message: '', crops: [] } or similar
      console.log('📦 Backend returns custom format');
      const customResponse = responseData as Record<string, unknown>;
      
      // Try to find the data in different property names
      const dataProperty = Object.keys(customResponse).find(key => 
        key !== 'message' && Array.isArray(customResponse[key])
      );
      
      if (dataProperty) {
        finalData = { 
          data: customResponse[dataProperty] as T, 
          message: (customResponse.message as string) || 'Success' 
        };
      } else {
        // Single object response
        finalData = { 
          data: responseData as T, 
          message: (customResponse.message as string) || 'Success' 
        };
      }
    } else {
      // Single object response or unknown format
      console.log('📦 Backend returns single object or unknown format');
      finalData = { 
        data: responseData as T, 
        message: 'Success' 
      };
    }

    console.log('✅ Final processed data:', finalData);
    return finalData;

  } catch (error) {
    console.error('❌ API Request failed:', error);
    
    if (error instanceof Error) {
      // Handle network errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
    
    throw new Error('Unknown API error occurred');
  }
};

// Axios instance (optional - you can remove this if not used)
export const axiosInstance = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Crop API methods
export const cropApi = {
  create: async (cropData: CreateCropRequest): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>('/api/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    });
  },
  
  getAll: async (): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>('/api/crops');
  },
  
  getById: async (id: number): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>(`/api/crops/${id}`);
  },

  update: async (id: number, cropData: UpdateCropRequest): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>(`/api/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/crops/${id}`, {
      method: 'DELETE',
    });
  },

  search: async (query: string): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>(`/api/crops/search?q=${encodeURIComponent(query)}`);
  },

  getByStatus: async (status: string): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>(`/api/crops/status/${status}`);
  },

  getExpenses: async (cropId: number): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>(`/api/crops/${cropId}/expenses`);
  },

  addExpense: async (expenseData: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/api/crops/${expenseData.cropId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  updateExpense: async (id: number, expenseData: UpdateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  deleteExpense: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};

// Expense API methods
export const expenseApi = {
  create: (expense: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },
  
  getAll: (): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>('/api/expenses');
  },
  
  getRecent: (): Promise<ApiResponse<Expense[]>> => {
    // Use existing endpoint and filter on frontend
    return apiRequest<Expense[]>('/api/expenses')
      .then(response => {
        // Simulate recent by taking last 5
        const recent = response.data ? response.data.slice(-5) : [];
        return { ...response, data: recent };
      });
  },
  
  getByCropId: (cropId: string): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>(`/api/expenses?cropId=${cropId}`);
  },
  
  getById: (id: string): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/api/expenses/${id}`);
  },
  
  update: (id: string, expense: Partial<Expense>): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  },
  
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};

// Task API methods
export const taskApi = {
  create: (taskData: CreateTaskRequest): Promise<ApiResponse<Task>> => 
    apiRequest<Task>('/api/tasks', { 
      method: 'POST', 
      body: JSON.stringify(taskData) 
    }),
  
  getUpcoming: (days?: number): Promise<ApiResponse<Task[]>> => 
    apiRequest<Task[]>(`/api/tasks/upcoming?days=${days || 7}`),
  
  generateHarvestReminders: (): Promise<ApiResponse<HarvestReminderResponse>> => 
    apiRequest<HarvestReminderResponse>('/api/tasks/generate-harvest-reminders', { 
      method: 'POST' 
    }),
};

// Weather API methods
export const weatherApi = {
  getForecast: (lat: number, lon: number): Promise<ApiResponse<WeatherData>> => 
    apiRequest<WeatherData>(`/api/weather?lat=${lat}&lon=${lon}`),
  
  getRecommendations: (lat: number, lon: number, cropType: string): Promise<ApiResponse<WeatherRecommendationsResponse>> => 
    apiRequest<WeatherRecommendationsResponse>(`/api/weather/recommendations?lat=${lat}&lon=${lon}&cropType=${cropType}`),
};

// Inventory API methods
export const inventoryApi = {
  getAll: (): Promise<ApiResponse<InventoryItem[]>> => 
    apiRequest<InventoryItem[]>('/api/inventory'),
  
  addItem: (itemData: CreateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => 
    apiRequest<InventoryItem>('/api/inventory', { 
      method: 'POST', 
      body: JSON.stringify(itemData) 
    }),
  
  useItem: (usageData: UseInventoryItemRequest): Promise<ApiResponse<{ remainingQuantity: number }>> => 
    apiRequest<{ remainingQuantity: number }>('/api/inventory/use', { 
      method: 'POST', 
      body: JSON.stringify(usageData) 
    }),
  
  getLowStock: (): Promise<ApiResponse<InventoryItem[]>> => 
    apiRequest<InventoryItem[]>('/api/inventory/low-stock'),
};

// Finance API methods
export const financeApi = {
  getProfitLossReport: (startDate?: string, endDate?: string): Promise<ApiResponse<ProfitLossReport>> => 
    apiRequest<ProfitLossReport>(`/api/finance/profit-loss?${startDate ? `startDate=${startDate}&endDate=${endDate}` : ''}`),
  
  getROIAnalysis: (period?: string): Promise<ApiResponse<ROIAnalysisResponse>> => 
    apiRequest<ROIAnalysisResponse>(`/api/finance/roi-analysis?period=${period || 'monthly'}`),
};

// Livestock API methods with proper types
export const livestockApi = {
  getAll: async (): Promise<ApiResponse<Livestock[]>> => {
    return apiRequest<Livestock[]>('/api/livestock');
  },

  getById: async (id: number): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>(`/api/livestock/${id}`);
  },

  create: async (livestockData: CreateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>('/api/livestock', {
      method: 'POST',
      body: JSON.stringify(livestockData),
    });
  },

  update: async (id: number, livestockData: UpdateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>(`/api/livestock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(livestockData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/livestock/${id}`, {
      method: 'DELETE',
    });
  },

  getHealthRecords: async (livestockId: number): Promise<ApiResponse<HealthRecord[]>> => {
    return apiRequest<HealthRecord[]>(`/api/livestock/${livestockId}/health-records`);
  },

  addHealthRecord: async (livestockId: number, record: Omit<HealthRecord, 'id' | 'livestockId' | 'createdAt'>): Promise<ApiResponse<HealthRecord>> => {
    return apiRequest<HealthRecord>(`/api/livestock/${livestockId}/health-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  updateHealthRecord: async (recordId: number, recordData: Partial<HealthRecord>): Promise<ApiResponse<HealthRecord>> => {
    return apiRequest<HealthRecord>(`/api/health-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  },

  deleteHealthRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/health-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  getBreedingRecords: async (livestockId: number): Promise<ApiResponse<BreedingRecord[]>> => {
    return apiRequest<BreedingRecord[]>(`/api/livestock/${livestockId}/breeding-records`);
  },

  addBreedingRecord: async (livestockId: number, record: Omit<BreedingRecord, 'id' | 'livestockId' | 'createdAt'>): Promise<ApiResponse<BreedingRecord>> => {
    return apiRequest<BreedingRecord>(`/api/livestock/${livestockId}/breeding-records`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  updateBreedingRecord: async (recordId: number, recordData: Partial<BreedingRecord>): Promise<ApiResponse<BreedingRecord>> => {
    return apiRequest<BreedingRecord>(`/api/breeding-records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
  },

  deleteBreedingRecord: async (recordId: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/api/breeding-records/${recordId}`, {
      method: 'DELETE',
    });
  },

  getLivestockStats: async (): Promise<ApiResponse<LivestockStats>> => {
    return apiRequest<LivestockStats>('/api/livestock/analytics/stats');
  },

  getHealthAlerts: async (): Promise<ApiResponse<HealthAlert[]>> => {
    return apiRequest<HealthAlert[]>('/api/livestock/analytics/health-alerts');
  },
   recordSale: (id: number, saleData: { sale_price: number; sale_date: string; sale_reason?: string }): Promise<ApiResponse<Livestock>> => 
    apiRequest<Livestock>(`/api/livestock/${id}/sale`, {
      method: 'POST',
      body: JSON.stringify(saleData),
    }),

  updateWeight: (id: number, currentWeight: number): Promise<ApiResponse<Livestock>> => 
    apiRequest<Livestock>(`/api/livestock/${id}/weight`, {
      method: 'PUT',
      body: JSON.stringify({ current_weight: currentWeight }),
    }),

  getFinancials: (id: number): Promise<ApiResponse<any>> => 
    apiRequest<any>(`/api/livestock/${id}/financials`),
};
export const flockApi = {
  // Flock management
  getAll: (): Promise<ApiResponse<Flock[]>> => 
    apiRequest<Flock[]>('/api/flocks'),

  getById: (id: number): Promise<ApiResponse<Flock>> => 
    apiRequest<Flock>(`/api/flocks/${id}`),

  create: (flockData: Omit<Flock, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Flock>> => 
    apiRequest<Flock>('/api/flocks', {
      method: 'POST',
      body: JSON.stringify(flockData),
    }),

  update: (id: number, flockData: Partial<Flock>): Promise<ApiResponse<Flock>> => 
    apiRequest<Flock>(`/api/flocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flockData),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    apiRequest<{ message: string }>(`/flocks/${id}`, {
      method: 'DELETE',
    }),

  getStats: (id: number): Promise<ApiResponse<any>> => 
    apiRequest<any>(`/api/flocks/${id}/stats`),
};

export const livestockExpenseApi = {
  // Expense management
  getAll: (): Promise<ApiResponse<LivestockExpense[]>> => 
    apiRequest<LivestockExpense[]>('/api/livestock-expenses'),

  getByFlockId: (flockId: number): Promise<ApiResponse<LivestockExpense[]>> => 
    apiRequest<LivestockExpense[]>(`/api/livestock-expenses/flock/${flockId}`),

  getById: (id: number): Promise<ApiResponse<LivestockExpense>> => 
    apiRequest<LivestockExpense>(`/api/livestock-expenses/${id}`),

  create: (expenseData: CreateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => 
    apiRequest<LivestockExpense>('/api/livestock-expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  update: (id: number, expenseData: UpdateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => 
    apiRequest<LivestockExpense>(`/api/livestock-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    apiRequest<{ message: string }>(`/api/livestock-expenses/${id}`, {
      method: 'DELETE',
    }),

  // Reporting
  getExpenseSummary: (): Promise<ApiResponse<Array<{ category: string; expense_count: number; total_amount: number }>>> => 
    apiRequest('/api/livestock-expenses/reports/summary'),

  getFlockExpenseSummary: (): Promise<ApiResponse<FlockExpenseSummary[]>> => 
    apiRequest<FlockExpenseSummary[]>('/api/livestock-expenses/reports/flock-summary'),
};

// Default export for backward compatibility
export default {
  apiRequest,
  axiosInstance,
  cropApi,
  expenseApi,
  taskApi,
  weatherApi,
  inventoryApi,
  financeApi,
  livestockApi,
};

export interface FarmExpense {
  id: number;
  expense_type: 'livestock' | 'crop' | 'operational' | 'infrastructure';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  date: string;
  payment_method?: string;
  supplier?: string;
  receipt_number?: string;
  notes?: string;
  
  // Optional foreign keys
  crop_id?: number;
  flock_id?: number;
  livestock_id?: number;
  
  // Joined data
  crop_name?: string;
  flock_name?: string;
  animal_identifier?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateFarmExpenseRequest {
  expense_type: 'livestock' | 'crop' | 'operational' | 'infrastructure';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  date: string;
  payment_method?: string;
  supplier?: string;
  receipt_number?: string;
  notes?: string;
  crop_id?: number;
  flock_id?: number;
  livestock_id?: number;
}

export interface ExpenseSummary {
  total_expenses: number;
  expenses_by_type: Array<{
    expense_type: string;
    total_amount: number;
    expense_count: number;
  }>;
  expenses_by_category: Array<{
    category: string;
    subcategory?: string;
    total_amount: number;
    expense_count: number;
  }>;
  monthly_expenses: Array<{
    month: string;
    total_amount: number;
    expense_count: number;
  }>;
}

// Expense categories and subcategories
export const EXPENSE_CATEGORIES = {
  livestock: {
    feed: ['wanda', 'grass', 'straw', 'concentrate', 'minerals', 'other_feed'],
    labor: ['servant_salary', 'veterinary_labor', 'other_labor'],
    medical: ['deworming', 'vaccination', 'treatment', 'vitamins', 'other_medical'],
    equipment: ['feeding_equipment', 'shelter_equipment', 'other_equipment'],
    other: ['transportation', 'insurance', 'other']
  },
  crop: {
    inputs: ['seeds', 'fertilizer', 'pesticides', 'irrigation', 'other_inputs'],
    labor: ['planting_labor', 'harvesting_labor', 'other_labor'],
    equipment: ['tractor', 'tools', 'irrigation_equipment', 'other_equipment'],
    other: ['transportation', 'storage', 'other']
  },
  operational: {
    utilities: ['electricity', 'water', 'internet', 'other_utilities'],
    maintenance: ['building_repair', 'equipment_repair', 'vehicle_maintenance', 'other_maintenance'],
    administration: ['office_supplies', 'communication', 'professional_fees', 'other_administration'],
    other: ['taxes', 'insurance', 'other']
  },
  infrastructure: {
    construction: ['sheds', 'fences', 'storage_buildings', 'other_construction'],
    equipment: ['tractors', 'vehicles', 'machinery', 'other_equipment'],
    land: ['land_purchase', 'land_development', 'other_land'],
    other: ['planning', 'permits', 'other']
  }
};

export const medicalTreatmentApi = {
  getAll: (): Promise<ApiResponse<MedicalTreatment[]>> => 
    apiRequest<MedicalTreatment[]>('/api/medical-treatments'),

  getByLivestockId: (livestockId: number): Promise<ApiResponse<MedicalTreatment[]>> => 
    apiRequest<MedicalTreatment[]>(`/api/medical-treatments/livestock/${livestockId}`),

  getUpcoming: (days?: number): Promise<ApiResponse<MedicalTreatment[]>> => 
    apiRequest<MedicalTreatment[]>(`/api/medical-treatments/upcoming?days=${days || 30}`),

  create: (treatmentData: CreateMedicalTreatmentRequest): Promise<ApiResponse<MedicalTreatment>> => 
    apiRequest<MedicalTreatment>('/api/medical-treatments', {
      method: 'POST',
      body: JSON.stringify(treatmentData),
    }),

  update: (id: number, treatmentData: UpdateMedicalTreatmentRequest): Promise<ApiResponse<MedicalTreatment>> => 
    apiRequest<MedicalTreatment>(`/api/medical-treatments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(treatmentData),
    }),

  delete: (id: number): Promise<ApiResponse<{ message: string }>> => 
    apiRequest<{ message: string }>(`/api/medical-treatments/${id}`, {
      method: 'DELETE',
    }),
};

export const productionApi = {
  getAll: (): Promise<ApiResponse<ProductionRecord[]>> => 
    apiRequest<ProductionRecord[]>('/api/production-records'),

  getByFlockId: (flockId: number): Promise<ApiResponse<ProductionRecord[]>> => 
    apiRequest<ProductionRecord[]>(`/api/production-records/flock/${flockId}`),

  getSummary: (flockId?: number): Promise<ApiResponse<any>> => 
    apiRequest<any>(`/api/production-records/summary${flockId ? `?flockId=${flockId}` : ''}`),

  create: (recordData: Omit<ProductionRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProductionRecord>> => 
    apiRequest<ProductionRecord>('/api/production-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),
};

export const financialSummaryApi = {
  getFlockSummary: (flockId?: number): Promise<ApiResponse<FlockFinancialSummary[]>> => 
    apiRequest<FlockFinancialSummary[]>(`/api/financial-summary/flocks${flockId ? `?flockId=${flockId}` : ''}`),

  getAnimalSummary: (animalId?: number): Promise<ApiResponse<AnimalFinancialSummary[]>> => 
    apiRequest<AnimalFinancialSummary[]>(`/api/financial-summary/animals${animalId ? `?animalId=${animalId}` : ''}`),

  getFlockMetrics: (flockId: number): Promise<ApiResponse<any>> => 
    apiRequest<any>(`/api/financial-summary/flocks/${flockId}/metrics`),
};


