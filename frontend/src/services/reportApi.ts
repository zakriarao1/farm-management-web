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

export const reportApi = {
   getAnalytics: async (dateRange?: DateRangeParams): Promise<{ data: AnalyticsData }> => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString ? `/reports/analytics?${queryString}` : '/reports/analytics';
    
    return apiRequest(url);
  },

  getFinancialReport: async (startDate?: string, endDate?: string): Promise<{ data: FinancialReport }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiRequest(`/reports/financial?${params}`);
  },


  getCropPerformance: async (cropId: number, dateRange?: DateRangeParams) => {
    const params = new URLSearchParams();
    if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
    
    const queryString = params.toString();
    const url = queryString 
      ? `/reports/crop-performance/${cropId}?${queryString}`
      : `/reports/crop-performance/${cropId}`;
    
    return apiRequest(url);
  },
};
export type { AnalyticsData };

