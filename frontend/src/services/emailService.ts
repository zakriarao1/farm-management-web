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
      // Use Netlify functions endpoint
      const response = await fetch('http://localhost:8888/.netlify/functions/email-send-report', {
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
      const response = await fetch('http://localhost:8888/.netlify/functions/email-test-connection');
      return await response.json();
    } catch (error) {
      console.error('Email connection test error:', error);
      return { 
        success: false, 
        message: 'Email service not available. This feature requires backend email configuration.' 
      };
    }
  }

  // Mock implementation for development
  static async sendReportMock(emailRequest: EmailReportRequest): Promise<{ success: boolean; message: string }> {
    console.log('📧 Mock email sent:', emailRequest);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Report sent successfully to ${emailRequest.to.join(', ')}`
    };
  }

  static async testConnectionMock(): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Email service is available (mock mode)'
    };
  }
}