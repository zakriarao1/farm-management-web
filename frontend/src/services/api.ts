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
  ExpenseCategory,
} from '../types';


// Define response format types
interface RawApiResponse {
  data?: unknown;
  message?: string;
  [key: string]: unknown;
}

// Use Netlify functions with correct URL for local development
const getApiBaseUrl = (): string => {
  // For local development - use absolute URL with localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8888/.netlify/functions';
  }
  
  // For production - use relative URL
  return '/.netlify/functions';
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
export const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  // Debug: log the exact endpoint being called
  console.log('🔍 API Request - Original endpoint:', endpoint);
  console.log('🔍 API Request - API_BASE_URL:', API_BASE_URL);
  
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔍 API Request - Full URL:', fullUrl);
  console.log('🔍 API Request - Calling URL:', fullUrl);
  
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  try {
    console.log('🌐 FINAL API Request:', fullUrl, options.method || 'GET');
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ API Response:', result);
    
    return result;

  } catch (error) {
    console.error('❌ API Request failed:', error);
    throw error;
  }
};

// Crop API methods
export const cropApi = {
  create: async (cropData: CreateCropRequest): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>('/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    });
  },
    getExpenses: async (cropId: number): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>(`/crops/${cropId}/expenses`);
  },

  getAll: async (): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>('/crops');
  },
  
  getById: async (id: number): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>(`/crops/${id}`);
  },

  update: async (id: number, cropData: UpdateCropRequest): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>(`/crops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/crops/${id}`, {
      method: 'DELETE',
    });
  },

  search: async (query: string): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>(`/crops/search?q=${encodeURIComponent(query)}`);
  },

  getByStatus: async (status: string): Promise<ApiResponse<Crop[]>> => {
    return apiRequest<Crop[]>(`/crops/status/${status}`);
  },


};

// Expense API methods
export const expenseApi = {
  create: (expense: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    // The API expects snake_case, but our CreateExpenseRequest uses snake_case
    // So we can send it directly
    return apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense), // Already snake_case
    }).then(response => ({
      ...response,
      data: response.data ? transformExpense(response.data) : response.data
    }));
  },
  
 getAll: (): Promise<ApiResponse<Expense[]>> => {
  return apiRequest<any[]>('/expenses')  // Use any[] to bypass TypeScript
    .then(response => ({
      ...response,
      data: response.data ? response.data.map(transformExpense) : response.data
    }));
},
  
  getRecent: (limit: number = 5): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>('/expenses')
      .then(response => {
        const data = response.data ? response.data.map(transformExpense) : [];
        // Sort by date descending and take the most recent
        const recent = data
          .sort((a, b) => {
            const dateA = a.date || a.created_at || new Date().toISOString();
            const dateB = b.date || b.created_at || new Date().toISOString();
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .slice(0, limit);
        return { ...response, data: recent };
      });
  },
  
  getByCropId: (cropId: string | number): Promise<ApiResponse<Expense[]>> => {
  const cropIdStr = String(cropId);
  
  // DEBUG: Show what URL we're building
  console.log(`🔍 Building URL for crop ${cropIdStr}`);
  console.log(`🔍 Should call: /crops/${cropIdStr}/expenses`);
  
  // Make sure we're calling the expenses endpoint, not crops endpoint
  return apiRequest<any>(`/crops/${cropIdStr}/expenses`)
    .then(response => {
      console.log(`🔍 Called URL: /crops/${cropIdStr}/expenses`);
      console.log(`🔍 Response from expenses endpoint:`, response);
      
      // Your backend returns expenses directly in response.data as an array
      const expensesData = response.data;
      
      console.log('🔍 Response.data:', expensesData);
      console.log('🔍 Is array?', Array.isArray(expensesData));
      
      if (!expensesData || !Array.isArray(expensesData)) {
        console.log('⚠️ No array data found, returning empty array');
        return {
          ...response,
          data: []
        };
      }
      
      const transformedData = expensesData.map(transformExpense);
      console.log(`🔄 Transformed ${transformedData.length} expenses`);
      
      return {
        ...response,
        data: transformedData
      };
    })
    .catch(error => {
      console.error('❌ Error in getByCropId:', error);
      return { 
        data: [], 
        status: 500, 
        message: error.message,
        success: false 
      };
    });
},
  getById: (id: string): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/expenses/${id}`)
      .then(response => ({
        ...response,
        data: response.data ? transformExpense(response.data) : response.data
      }));
  },
  
  update: (id: string, expense: UpdateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense), // Already snake_case
    }).then(response => ({
      ...response,
      data: response.data ? transformExpense(response.data) : response.data
    }));
  },
  
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
// Add this transformation function
const transformExpense = (data: any): Expense => {
  console.log('🔄 transformExpense RAW data:', data);
  
  if (!data) {
    console.error('❌ transformExpense: No data provided');
    return createEmptyExpense();
  }
  if ('name' in data && 'plantingDate' in data) {
    console.error('❌ transformExpense received CROP data, not EXPENSE data!');
    console.error('❌ Data looks like:', data);
    return createEmptyExpense();
  }
  // Debug: Show all keys from database
  console.log('🔍 Database keys:', Object.keys(data));
  
  // Create the transformed expense - MATCH EXACTLY what database returns
  const transformed: Expense = {
    id: Number(data.id) || 0,
    crop_id: Number(data.crop_id) || 0,
    description: data.description || '',
    category: (data.category || 'OTHER') as ExpenseCategory,
    amount: Number(data.amount) || 0,
    date: data.date || '',
    notes: data.notes || '',
    created_at: data.created_at || '',
    updated_at: data.updated_at || ''
  };
  
  console.log('✅ Transformed expense:', transformed);
  return transformed;
};

// Helper function for empty expense
const createEmptyExpense = (): Expense => ({
  id: 0,
  crop_id: 0,
  description: '',
  category: 'OTHER' as ExpenseCategory,
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  notes: '',
  created_at: '',
  updated_at: ''
});
// Task API methods
export const taskApi = {
  create: (taskData: CreateTaskRequest): Promise<ApiResponse<Task>> => 
    apiRequest<Task>('/tasks', { 
      method: 'POST', 
      body: JSON.stringify(taskData) 
    }),
  
  getUpcoming: (days?: number): Promise<ApiResponse<Task[]>> => 
    apiRequest<Task[]>(`/tasks/upcoming?days=${days || 7}`),
  
  generateHarvestReminders: (): Promise<ApiResponse<HarvestReminderResponse>> => 
    apiRequest<HarvestReminderResponse>('/tasks/generate-harvest-reminders', { 
      method: 'POST' 
    }),
};

// Weather API methods
export const weatherApi = {
  getForecast: (lat: number, lon: number): Promise<ApiResponse<WeatherData>> => 
    apiRequest<WeatherData>(`/weather?lat=${lat}&lon=${lon}`),
  
  getRecommendations: (lat: number, lon: number, cropType: string): Promise<ApiResponse<WeatherRecommendationsResponse>> => 
    apiRequest<WeatherRecommendationsResponse>(`/weather/recommendations?lat=${lat}&lon=${lon}&cropType=${cropType}`),
};

// Inventory API methods
export const inventoryApi = {
  getAll: (): Promise<ApiResponse<InventoryItem[]>> => 
    apiRequest<InventoryItem[]>('/inventory'),
  
  addItem: (itemData: CreateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => 
    apiRequest<InventoryItem>('/inventory', { 
      method: 'POST', 
      body: JSON.stringify(itemData) 
    }),
  
  useItem: (usageData: UseInventoryItemRequest): Promise<ApiResponse<{ remainingQuantity: number }>> => 
    apiRequest<{ remainingQuantity: number }>('/inventory/use', { 
      method: 'POST', 
      body: JSON.stringify(usageData) 
    }),
  
  getLowStock: (): Promise<ApiResponse<InventoryItem[]>> => 
    apiRequest<InventoryItem[]>('/inventory/low-stock'),
};

// Finance API methods
export const financeApi = {
  getProfitLossReport: (startDate?: string, endDate?: string): Promise<ApiResponse<ProfitLossReport>> => 
    apiRequest<ProfitLossReport>(`/finance/profit-loss?${startDate ? `startDate=${startDate}&endDate=${endDate}` : ''}`),
  
  getROIAnalysis: (period?: string): Promise<ApiResponse<ROIAnalysisResponse>> => 
    apiRequest<ROIAnalysisResponse>(`/finance/roi-analysis?period=${period || 'monthly'}`),
};



  

// Default export for backward compatibility
export default {
  apiRequest,
  cropApi,
  expenseApi,
  taskApi,
  weatherApi,
  inventoryApi,
  financeApi,
  
  
  
};