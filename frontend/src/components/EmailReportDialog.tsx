// frontend/src/components/EmailReportDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Chip,
  Box,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material';
import { EmailService, type EmailReportRequest } from '../services/emailService';
import { type AnalyticsData } from '../services/reportApi';

interface EmailReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportData: AnalyticsData | null;
  reportType: 'analytics' | 'financial' | 'performance';
}

export const EmailReportDialog: React.FC<EmailReportDialogProps> = ({
  open,
  onClose,
  reportData,
  reportType,
}) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAddEmail = () => {
    if (currentEmail && validateEmail(currentEmail)) {
      setEmails([...emails, currentEmail]);
      setCurrentEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendReport = async () => {
    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    if (!reportData) {
      setError('No report data available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailRequest: EmailReportRequest = {
        to: emails,
        subject: `Farm ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        message: `Please find the attached ${reportType} report generated on ${new Date().toLocaleDateString()}.`,
        reportType,
        includeCharts,
        reportData,
      };

      await EmailService.sendReport(emailRequest);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setEmails([]);
      }, 2000);
    } catch (err) {
      setError('Failed to send email report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Email Report</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Report sent successfully!</Alert>}
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Send this report via email to stakeholders
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Email Address"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={handleAddEmail} disabled={!validateEmail(currentEmail)}>
                    Add
                  </Button>
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ mt: 1, minHeight: 40 }}>
            {emails.map((email) => (
              <Chip
                key={email}
                label={email}
                onDelete={() => handleRemoveEmail(email)}
                size="small"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
            />
          }
          label="Include charts and graphs in email"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSendReport} 
          variant="contained" 
          disabled={loading || emails.length === 0}
        >
          {loading ? 'Sending...' : 'Send Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailReportDialog;