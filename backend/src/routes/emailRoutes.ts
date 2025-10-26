// backend/src/routes/emailRoutes.ts

import express from 'express';
import { EmailService, EmailRequest } from '../services/EmailService';

const router = express.Router();
const emailService = new EmailService();

router.post('/send-report', async (req, res) => {
  try {
    const emailRequest: EmailRequest = req.body;

    // Validate required fields
    if (!emailRequest.to || !Array.isArray(emailRequest.to) || emailRequest.to.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one recipient email is required' 
      });
    }

    if (!emailRequest.subject || !emailRequest.message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and message are required' 
      });
    }

    // Validate email format
    for (const email of emailRequest.to) {
      if (!emailService.validateEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid email format: ${email}` 
        });
      }
    }

    const result = await emailService.sendReport(emailRequest);
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Report sent successfully',
        data: {
          recipients: emailRequest.to,
          subject: emailRequest.subject,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: result.message || 'Failed to send email'
      });
    }
  } catch (error: any) {
    console.error('Email route error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Test email configuration endpoint
router.get('/test-connection', async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    return res.json({ 
      success: isConnected, 
      message: isConnected ? 'Email server connected' : 'Email server connection failed' 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: 'Email server test failed',
      error: error.message 
    });
  }
});

// Send crop report endpoint
router.post('/send-crop-report', async (req, res) => {
  try {
    const { cropId, recipientEmails, reportType = 'summary' } = req.body;

    // Validate required fields
    if (!cropId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Crop ID is required' 
      });
    }

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one recipient email is required' 
      });
    }

    // Validate email format
    for (const email of recipientEmails) {
      if (!emailService.validateEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid email format: ${email}` 
        });
      }
    }

    // Generate crop report data
    const cropReport = {
      cropId,
      reportType,
      generatedAt: new Date().toISOString(),
      summary: `Crop report for crop ID: ${cropId}`,
      data: {
        status: 'Active',
        plantingDate: '2024-01-15',
        expectedHarvest: '2024-06-15',
        expenses: 1500,
        revenue: 0
      }
    };

    // Use the service method that handles attachments properly
    const result = await emailService.sendFarmReport({
      farmName: `Crop ${cropId}`,
      period: new Date().toLocaleDateString(),
      summary: cropReport,
      recipientEmails
    });
    
    if (result.success) {
      return res.json({ 
        success: true, 
        message: 'Crop report sent successfully',
        data: {
          recipients: recipientEmails,
          cropId,
          reportType,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: result.message || 'Failed to send crop report'
      });
    }
  } catch (error: any) {
    console.error('Crop report email error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send crop report',
      error: error.message 
    });
  }
});

// Get email configuration status
router.get('/config-status', async (req, res) => {
  try {
    const config = emailService.getConfigStatus();
    return res.json({ 
      success: true, 
      data: config 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to get email configuration status',
      error: error.message 
    });
  }
});

export default router;