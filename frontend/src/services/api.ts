// Types
export interface Crop {
  id: number;
  name: string;
  type: string;
  variety: string;
  planting_date: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  area: number;
  area_unit: string;
  expected_yield: number;
  actual_yield?: number;
  yield_unit: string;
  market_price: number;
  total_expenses: number;
  status: string;
  field_location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCropRequest {
  name: string;
  type: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  area: number;
  areaUnit: string;
  expectedYield: number;
  yieldUnit: string;
  marketPrice: number;
  status: string;
  fieldLocation?: string;
  notes?: string;
}

export interface UpdateCropRequest {
  name?: string;
  type?: string;
  variety?: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
  actualHarvestDate?: string;
  area?: number;
  areaUnit?: string;
  expectedYield?: number;
  actualYield?: number;
  yieldUnit?: string;
  marketPrice?: number;
  status?: string;
  fieldLocation?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  crop_id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CreateExpenseRequest {
  cropId: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}
export interface AnalyticsSummary {
  total_crops?: number;
  active_crops?: number;
  total_expenses?: number;
  projected_revenue?: number;
}

export interface CropDistribution {
  type: string;
  count: number;
  total_area: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface MonthlyExpense {
  month: string;
  total_expenses: number;
  expense_count: number;
}

export interface AnalyticsData {
  summary?: AnalyticsSummary;
  cropDistribution: CropDistribution[];
  statusDistribution?: StatusDistribution[];
  monthlyExpenses?: MonthlyExpense[];
}

export interface FinancialReport {
  crops: Array<{
    crop_name: string;
    crop_type: string;
    expected_yield: number;
    market_price: number;
    projected_revenue: number;
    total_expenses: number;
    projected_profit: number;
    expense_count: number;
  }>;
  summary: {
    total_projected_revenue: number;
    total_expenses: number;
    total_projected_profit: number;
    total_crops: number;
  };
}

export interface ProfitLossReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    roi: number;
    soldCropsCount: number;
    expenseCount: number;
  };
  roiByCrop: Array<{
    name: string;
    type: string;
    revenue: number;
    total_expenses: number;
    roi_percentage: number;
  }>;
  timeframe: {
    startDate: string;
    endDate: string;
  };
}

export interface ROIAnalysis {
  period: string;
  crop_count: number;
  total_revenue: number;
  total_expenses: number;
  avg_roi_percentage: number;
  avg_net_profit: number;
}

// Inventory Types
export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  unit_cost?: number;
  supplier?: string;
  last_restocked?: string;
  expiration_date?: string;
  location?: string;
  notes?: string;
  is_low_stock?: boolean;
  transaction_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemRequest {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  unitCost?: number;
  supplier?: string;
  expirationDate?: string;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  minQuantity?: number;
  unitCost?: number;
  supplier?: string;
  expirationDate?: string;
  location?: string;
  notes?: string;
}

export interface Flock {
  id: number;
  name: string;
  breed: string;
  quantity: number;
  age: number;
  health_status: string;
  total_purchase_cost?: number;  // Add this
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFlockRequest {
  name: string;
  breed: string;
  quantity: number;
  age: number;
  health_status: string;
  total_purchase_cost?: number;
  notes?: string;
  // Add these if your form uses them:
  description?: string;
  purchase_date?: string;
}

export interface UpdateFlockRequest {
  name?: string;
  breed?: string;
  quantity?: number;
  age?: number;
  health_status?: string;
  notes?: string;
  total_purchase_cost?: number;  // Add this line
}

// Flock API methods
export const flockApi = {
  create: async (flockData: CreateFlockRequest): Promise<ApiResponse<Flock>> => {
    return apiRequest<Flock>('/flocks', {
      method: 'POST',
      body: JSON.stringify(flockData),
    });
  },
  
  getAll: async (): Promise<ApiResponse<Flock[]>> => {
    return apiRequest<Flock[]>('/flocks');
  },
  
  getById: async (id: number): Promise<ApiResponse<Flock>> => {
    return apiRequest<Flock>(`/flocks/${id}`);
  },

  update: async (id: number, flockData: UpdateFlockRequest): Promise<ApiResponse<Flock>> => {
    return apiRequest<Flock>(`/flocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flockData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/flocks/${id}`, {
      method: 'DELETE',
    });
  },
};
// Reports API methods
export const reportApi = {
  getAnalytics: async (startDate?: string, endDate?: string): Promise<ApiResponse<AnalyticsData>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/reports/analytics?${queryString}` : '/reports/analytics';
    
    return apiRequest<AnalyticsData>(url);
  },

  getFinancialReport: async (startDate?: string, endDate?: string): Promise<ApiResponse<FinancialReport>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/reports/financial?${queryString}` : '/reports/financial';
    
    return apiRequest<FinancialReport>(url);
  },

  getRecentExpenses: async (): Promise<ApiResponse<Expense[]>> => {
    return apiRequest<Expense[]>('/reports/expenses/recent');
  },
};

// Finance API methods
export const financeApi = {
  getProfitLossReport: async (startDate?: string, endDate?: string): Promise<ApiResponse<ProfitLossReport>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/finance/profit-loss?${queryString}` : '/finance/profit-loss';
    
    return apiRequest<ProfitLossReport>(url);
  },

  getROIAnalysis: async (period?: string): Promise<ApiResponse<{ period: string; analysis: ROIAnalysis[] }>> => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    
    const queryString = params.toString();
    const url = queryString ? `/finance/roi-analysis?${queryString}` : '/finance/roi-analysis';
    
    return apiRequest<{ period: string; analysis: ROIAnalysis[] }>(url);
  },
};
export interface LivestockExpense {
  id: number;
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
export interface CreateLivestockExpenseRequest {
  flock_id: number;
  livestock_id?: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}
export interface UpdateLivestockExpenseRequest {
  flock_id?: number;
  livestock_id?: number;
  description?: string;
  category?: string;
  amount?: number;
  date?: string;
  notes?: string;
}
export const livestockExpenseApi = {
  create: async (expenseData: CreateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => {
    return apiRequest<LivestockExpense>('/livestock-expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },
  
  getAll: async (): Promise<ApiResponse<LivestockExpense[]>> => {
    return apiRequest<LivestockExpense[]>('/livestock-expenses');
  },
  
  getById: async (id: number): Promise<ApiResponse<LivestockExpense>> => {
    return apiRequest<LivestockExpense>(`/livestock-expenses/${id}`);
  },

  update: async (id: number, expenseData: UpdateLivestockExpenseRequest): Promise<ApiResponse<LivestockExpense>> => {
    return apiRequest<LivestockExpense>(`/livestock-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/livestock-expenses/${id}`, {
      method: 'DELETE',
    });
  },
};
export interface FlockFinancialSummary {
  flock_id: number;
  flock_name: string;
  total_purchase_cost: number;
  total_expenses: number;
  total_sales: number;
  net_profit: number;
  roi_percentage: number;
  
  // Add all the missing fields your component is using:
  total_production_revenue?: number;
  total_sale_revenue?: number;
  total_medical_costs?: number;
  net_profit_loss?: number;
  total_animals?: number;
  sold_animals?: number;
  active_animals?: number;
  // Add any other fields your component references
}

export interface FinancialMetrics {
  total_flocks: number;
  total_investment: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  average_roi: number;
}
// Add these interfaces to your existing types
export interface Livestock {
  id: number;
  flock_id: number;
  name: string;
  type: string;
  breed: string;
  age: number;
  weight?: number;
  health_status: string;
  status: string;
  purchase_date?: string;
  purchase_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLivestockRequest {
  flock_id: number;
  name: string;
  type: string;
  breed: string;
  age: number;
  weight?: number;
  health_status: string;
  status: string;
  purchase_date?: string;
  purchase_cost?: number;
  notes?: string;
}

export interface UpdateLivestockRequest {
  flock_id?: number;
  name?: string;
  type?: string;
  breed?: string;
  age?: number;
  weight?: number;
  health_status?: string;
  status?: string;
  purchase_date?: string;
  purchase_cost?: number;
  notes?: string;
}
export interface AnimalSummary {
  total_animals: number;
  active_animals: number;
  sold_animals: number;
  total_investment: number;
  total_revenue: number;
  average_health_score: number;
}

// Add livestock API methods
export const livestockApi = {
  create: async (livestockData: CreateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>('/livestock', {
      method: 'POST',
      body: JSON.stringify(livestockData),
    });
  },
  
  getAll: async (): Promise<ApiResponse<Livestock[]>> => {
    return apiRequest<Livestock[]>('/livestock');
  },
  
  getById: async (id: number): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>(`/livestock/${id}`);
  },

  update: async (id: number, livestockData: UpdateLivestockRequest): Promise<ApiResponse<Livestock>> => {
    return apiRequest<Livestock>(`/livestock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(livestockData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/livestock/${id}`, {
      method: 'DELETE',
    });
  },

  getByFlock: async (flockId: number): Promise<ApiResponse<Livestock[]>> => {


    return apiRequest<Livestock[]>(`/livestock/flock/${flockId}`);
  },
};
// Add financial summary API methods
export const financialSummaryApi = {
  getFlockSummary: async (flockId?: number): Promise<ApiResponse<FlockFinancialSummary[]>> => {
    const url = flockId ? `/financial/summary?flockId=${flockId}` : '/financial/summary';
    return apiRequest<FlockFinancialSummary[]>(url);
  },

  getFlockMetrics: async (flockId: number): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/financial/flock-metrics/${flockId}`);
  },

  getOverallMetrics: async (): Promise<ApiResponse<FinancialMetrics>> => {
    return apiRequest<FinancialMetrics>('/financial/overall-metrics');
  },
  getAnimalSummary: async (): Promise<ApiResponse<AnimalSummary>> => {
    return apiRequest<AnimalSummary>('/financial/animal-summary');
  },
};
// Inventory API methods
export const inventoryApi = {
  getAll: async (category?: string, lowStock?: boolean): Promise<ApiResponse<InventoryItem[]>> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (lowStock) params.append('lowStock', 'true');
    
    const queryString = params.toString();
    const url = queryString ? `/inventory?${queryString}` : '/inventory';
    
    return apiRequest<InventoryItem[]>(url);
  },

  getById: async (id: number): Promise<ApiResponse<InventoryItem>> => {
    return apiRequest<InventoryItem>(`/inventory/${id}`);
  },

  create: async (itemData: CreateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    return apiRequest<InventoryItem>('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  update: async (id: number, itemData: UpdateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> => {
    return apiRequest<InventoryItem>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  delete: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  useItem: async (usageData: UseInventoryItemRequest): Promise<ApiResponse<{ remainingQuantity: number; message: string }>> => {
    return apiRequest<{ remainingQuantity: number; message: string }>('/inventory/use', {
      method: 'POST',
      body: JSON.stringify(usageData),
    });
  },

  getLowStock: async (): Promise<ApiResponse<InventoryItem[]>> => {
    return apiRequest<InventoryItem[]>('/inventory/low-stock');
  },
};
export interface UseInventoryItemRequest {
  itemId: number;
  quantityUsed: number;
  notes?: string;
}
// Netlify Functions base URL
const API_BASE_URL = '/.netlify/functions/api';

// API request helper
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

// Crop API methods
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

// Expense API methods
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

// Health check
export const healthCheck = async (): Promise<ApiResponse<{ status: string; message: string }>> => {
  return apiRequest<{ status: string; message: string }>('/health');
};