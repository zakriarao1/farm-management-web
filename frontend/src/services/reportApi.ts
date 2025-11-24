// frontend/src/services/reportApi.ts

import { apiRequest } from './api';
import { type AnalyticsData } from '../types';

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
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

// Define the API response type
interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const reportApi = {
  getAnalytics: async (dateRange?: DateRangeParams): Promise<ApiResponse<AnalyticsData>> => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/reports-analytics?${queryString}` : '/reports-analytics';
      
      console.log('Fetching analytics from:', url);
      const response = await apiRequest<AnalyticsData>(url);
      console.log('Analytics response:', response);
      return response;
    } catch (error) {
      console.error('Analytics API failed, returning fallback data:', error);
      // Return fallback data with proper type
      return {
        data: {
          summary: {
            total_crops: 0,
            active_crops: 0,
            total_expenses: 0,
            projected_revenue: 0
          },
          cropDistribution: [],
          statusDistribution: [],
          monthlyExpenses: [],
          topCropsByExpenses: []
        }
      };
    }
  },

  getFinancialReport: async (startDate?: string, endDate?: string): Promise<ApiResponse<FinancialReport>> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiRequest<FinancialReport>(`/reports-financial?${params}`);
      return response;
    } catch (error) {
      console.error('Financial report API failed:', error);
      // Return fallback data instead of throwing
      return {
        data: {
          summary: {
            total_projected_revenue: 0,
            total_expenses: 0,
            total_projected_profit: 0,
            total_crops: 0
          },
          crops: []
        }
      };
    }
  },

  getCropPerformance: async (cropId: number, dateRange?: DateRangeParams): Promise<ApiResponse<any>> => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/reports/crop-performance/${cropId}?${queryString}`
        : `/reports/crop-performance/${cropId}`;
      
      return await apiRequest<any>(url);
    } catch (error) {
      console.error('Crop performance API failed:', error);
      return {
        data: {}
      };
    }
  },
};

export type { AnalyticsData };