// Netlify Functions base URL
const API_BASE_URL = '/.netlify/functions/api';

// Remove all Express server references and use Netlify Functions directly
export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const fullUrl = `${API_BASE_URL}${url}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(fullUrl, {
      headers,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json() as { error?: string; message?: string };
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    return responseData as ApiResponse<T>;

  } catch (error) {
    console.error('API Request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown API error occurred');
  }
};

// Update all API methods to use Netlify Functions paths
export const cropApi = {
  create: async (cropData: CreateCropRequest): Promise<ApiResponse<Crop>> => {
    return apiRequest<Crop>('/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    });
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

  getExpenses: async (cropId: number): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>(`/crops/${cropId}/expenses`);
  },

  addExpense: async (expenseData: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>(`/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },
};

export const expenseApi = {
  create: (expense: CreateExpenseRequest): Promise<ApiResponse<Expense>> => {
    return apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },
  
  getAll: (): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>('/expenses');
  },
  
  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  },
};