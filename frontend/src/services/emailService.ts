// frontend/src/services/emailService.ts 

import { type AnalyticsData } from './reportApi';

export interface EmailReportRequest {
  to: string[];
  subject: string;
  message: string;
  reportType: 'analytics' | 'financial' | 'performance';
  includeCharts: boolean;
  reportData: AnalyticsData;
}

export class EmailService {
  static async sendReport(emailRequest: EmailReportRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/email/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to send email report');
    }
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/email/test-connection');
      return await response.json();
    } catch (error) {
      console.error('Email connection test error:', error);
      return { success: false, message: 'Connection test failed' };
    }
  }
}
