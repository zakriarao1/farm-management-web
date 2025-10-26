// backend/src/services/EmailService.ts

export interface EmailRequest {
  to: string[];
  subject: string;
  message: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType?: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

export class EmailService {
  private config: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: this.parseSecureFlag(process.env.SMTP_SECURE), // Fixed this line
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    };
  }

  // Add this helper method to properly parse the secure flag
  private parseSecureFlag(secureEnv: string | undefined): boolean {
    if (secureEnv === undefined) return false;
    return secureEnv.toLowerCase() === 'true';
  }

  async sendReport(emailRequest: EmailRequest): Promise<EmailResponse> {
    try {
      console.log('📧 Attempting to send email:', {
        to: emailRequest.to,
        subject: emailRequest.subject,
        hasAttachments: !!emailRequest.attachments
      });

      // Simulate email sending (replace with actual email service integration)
      // For development, we'll just log and return success
      await this.simulateEmailSending(emailRequest);

      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  private async simulateEmailSending(emailRequest: EmailRequest): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Email simulation completed:', {
      to: emailRequest.to,
      subject: emailRequest.subject,
      messageLength: emailRequest.message.length,
      attachmentCount: emailRequest.attachments?.length || 0
    });

    
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hasConfig = !!(this.config.auth.user && this.config.auth.pass);
return hasConfig;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  getConfigStatus(): { 
    isConfigured: boolean; 
    host: string; 
    port: number;
    user: string;
    hasPassword: boolean;
    secure: boolean;
  } {
    return {
      isConfigured: !!(this.config.auth.user && this.config.auth.pass),
      host: this.config.host,
      port: this.config.port,
      user: this.config.auth.user,
      hasPassword: !!this.config.auth.pass,
      secure: this.config.secure
    };
  }

  // Additional utility methods
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  formatEmailList(emails: string[]): string {
    return emails.filter(email => this.validateEmail(email)).join(', ');
  }

  // Method to send farm report
  async sendFarmReport(reportData: {
    farmName: string;
    period: string;
    summary: any;
    recipientEmails: string[];
  }): Promise<EmailResponse> {
    const emailRequest: EmailRequest = {
      to: reportData.recipientEmails,
      subject: `Farm Report - ${reportData.farmName} - ${reportData.period}`,
      message: this.generateFarmReportMessage(reportData),
      attachments: [
        {
          filename: `farm-report-${reportData.farmName}-${reportData.period}.json`,
          content: JSON.stringify(reportData.summary, null, 2)
        }
      ]
    };

    return this.sendReport(emailRequest);
  }

  private generateFarmReportMessage(reportData: {
    farmName: string;
    period: string;
    summary: any;
  }): string {
    return `
Farm Management System Report

Farm: ${reportData.farmName}
Period: ${reportData.period}
Generated: ${new Date().toLocaleDateString()}

Please find the detailed farm report attached.

This is an automated report from your Farm Management System.
    `.trim();
  }
}