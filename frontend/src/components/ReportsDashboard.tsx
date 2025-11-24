// frontend/components/ReportsDashboard.tsx

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  AccountBalance as FinanceIcon,
  TrendingUp as PerformanceIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { AnalyticsReport } from './AnalyticsReport';
import { FinancialReport } from './FinancialReport';
import { CropPerformanceReport } from './CropPerformanceReport';
import { EmailReportDialog } from './EmailReportDialog';
import { DateRangeFilter } from './DateRangeFilter';
import { ComparativeAnalysis } from './ComparativeAnalysis';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { exportToPDF, exportToCSV, exportToExcel } from '../utils/exportUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const ReportsDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  
  const { data: analyticsData, loading, error, refreshData } = useRealTimeData(60000); // Update every minute

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportReport = async () => {
    try {
      await exportToPDF('reports-content', `farm-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = async () => {
    handleExportClose();
    await handleExportReport();
  };

  const handleExportCSV = () => {
    handleExportClose();
    if (analyticsData) {
      exportToCSV(analyticsData, `farm-report-${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const handleExportExcel = () => {
    handleExportClose();
    if (analyticsData) {
      exportToExcel(analyticsData, `farm-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    // Here you would typically refetch data with the new date range
    console.log('Date range changed:', { start, end });
  };

  // Mock comparative data - replace with actual data from your API
  const comparativeData = [
    { metric: 'Total Crops', current: 45, previous: 38, unit: '' },
    { metric: 'Active Crops', current: 32, previous: 28, unit: '' },
    { metric: 'Total Expenses', current: 12500, previous: 9800, unit: 'Rs', isCurrency: true },
    { metric: 'Projected Revenue', current: 28700, previous: 23400, unit: 'Rs', isCurrency: true },
    { metric: 'Average Yield', current: 4500, previous: 4200, unit: 'kg' },
    { metric: 'Expense per Crop', current: 278, previous: 258, unit: 'Rs', isCurrency: true },
    { metric: 'Revenue per Acre', current: 2733, previous: 2550, unit: 'Rs', isCurrency: true },
  ];

  if (loading && !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading farm reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Farm Reports & Analytics
        </Typography>
        
        <Box display="flex" gap={2} sx={{ flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <Button
            variant="outlined"
            onClick={refreshData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

          {/* Email Report Button */}
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => setEmailDialogOpen(true)}
            disabled={!analyticsData}
          >
            Email Report
          </Button>

          {/* Export Dropdown Button */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleExportClick}
            disabled={!analyticsData}
          >
            Export
          </Button>

          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
            <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
            <MenuItem onClick={handleExportExcel}>Export as Excel</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Box sx={{ mb: 3 }}>
        <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
      </Box>

      {/* Quick Stats Overview */}
      {analyticsData?.summary && (
        <Box 
          display="flex" 
          gap={3} 
          sx={{ mb: 4, flexWrap: 'wrap' }}
        >
          {/* Total Crops Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AnalyticsIcon color="primary" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsData.summary.total_crops || 0}
                  </Typography>
                  <Typography color="text.secondary">Total Crops</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Active Crops Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PerformanceIcon color="success" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsData.summary.active_crops || 0}
                  </Typography>
                  <Typography color="text.secondary">Active Crops</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FinanceIcon color="warning" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Rs {((analyticsData.summary.total_expenses || 0) / 1000).toFixed(1)}k
                  </Typography>
                  <Typography color="text.secondary">Total Expenses</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Projected Revenue Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FinanceIcon color="info" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Rs {((analyticsData.summary.projected_revenue || 0) / 1000).toFixed(1)}k
                  </Typography>
                  <Typography color="text.secondary">Projected Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Comparative Analysis */}
      {analyticsData && (
        <Box sx={{ mb: 3 }}>
          <ComparativeAnalysis
            title="Performance Comparison"
            data={comparativeData}
            currentPeriod="Current Month"
            previousPeriod="Previous Month"
          />
        </Box>
      )}

      {/* Reports Tabs */}
      <Card id="reports-content">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<AnalyticsIcon />} label="Farm Analytics" />
            <Tab icon={<FinanceIcon />} label="Financial Report" />
            <Tab icon={<PerformanceIcon />} label="Crop Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <AnalyticsReport data={analyticsData} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <FinancialReport />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CropPerformanceReport />
        </TabPanel>
      </Card>

      {/* Email Report Dialog */}
      <EmailReportDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        reportData={analyticsData}
        reportType="analytics"
      />
    </Box>
  );
};