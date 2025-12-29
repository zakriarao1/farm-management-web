// frontend/components/ReportsDashboard.tsx

import React, { useState, useEffect } from 'react';
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
import type { AnalyticsData as AnalyticsDataType } from '../types';

// Define a simpler interface for our component
interface SimplifiedAnalyticsData {
  summary?: {
    total_crops?: number;
    active_crops?: number;
    total_expenses?: number;
    projected_revenue?: number;
    [key: string]: any;
  };
  cropDistribution?: any[];
  statusDistribution?: any[];
  monthlyExpenses?: any[];
  topCropsByExpenses?: any[];
}

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
  
  const [analyticsData, setAnalyticsData] = useState<SimplifiedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await analyticsApi.getSummary();
      // setAnalyticsData(response.data);
      
      // Mock data for now
      const mockData: SimplifiedAnalyticsData = {
        summary: {
          total_crops: 12,
          active_crops: 8,
          total_expenses: 125000,
          projected_revenue: 287000,
        },
        cropDistribution: [
          { type: 'Wheat', count: 4, total_area: 20 },
          { type: 'Rice', count: 3, total_area: 15 },
          { type: 'Cotton', count: 2, total_area: 10 },
          { type: 'Sugarcane', count: 2, total_area: 8 },
          { type: 'Other', count: 1, total_area: 5 }
        ],
        statusDistribution: [
          { status: 'PLANTED', count: 3 },
          { status: 'GROWING', count: 5 },
          { status: 'READY_FOR_HARVEST', count: 2 },
          { status: 'HARVESTED', count: 2 }
        ],
        monthlyExpenses: [
          { month: 'Jan', total_expenses: 15000, expense_count: 8 },
          { month: 'Feb', total_expenses: 18000, expense_count: 10 },
          { month: 'Mar', total_expenses: 22000, expense_count: 12 },
          { month: 'Apr', total_expenses: 25000, expense_count: 15 },
          { month: 'May', total_expenses: 28000, expense_count: 18 },
          { month: 'Jun', total_expenses: 27000, expense_count: 16 }
        ],
        topCropsByExpenses: [
          { name: 'Wheat', type: 'Grain', total_expenses: 45000, expense_count: 25 },
          { name: 'Rice', type: 'Grain', total_expenses: 38000, expense_count: 22 },
          { name: 'Cotton', type: 'Cash Crop', total_expenses: 22000, expense_count: 15 },
          { name: 'Sugarcane', type: 'Cash Crop', total_expenses: 20000, expense_count: 12 }
        ]
      };
      
      setAnalyticsData(mockData);
      
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExportPDF = async () => {
    handleExportClose();
    try {
      console.log('Exporting to PDF...');
      alert('PDF export functionality will be implemented soon.');
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const handleExportCSV = () => {
    handleExportClose();
    try {
      console.log('Exporting to CSV...');
      alert('CSV export functionality will be implemented soon.');
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  const handleExportExcel = () => {
    handleExportClose();
    try {
      console.log('Exporting to Excel...');
      alert('Excel export functionality will be implemented soon.');
    } catch (err) {
      console.error('Excel export failed:', err);
    }
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    console.log('Date range changed:', { start, end });
  };

  // Simple DateRangeFilter component
  const DateRangeFilter: React.FC<{ onDateRangeChange: (start: Date | null, end: Date | null) => void }> = ({ onDateRangeChange }) => {
    return (
      <Box display="flex" gap={2} alignItems="center">
        <Typography variant="body2">Date Range:</Typography>
        <input 
          type="date" 
          onChange={(e) => onDateRangeChange(e.target.value ? new Date(e.target.value) : null, dateRange.end)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <Typography variant="body2">to</Typography>
        <input 
          type="date" 
          onChange={(e) => onDateRangeChange(dateRange.start, e.target.value ? new Date(e.target.value) : null)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
      </Box>
    );
  };

  // Simple ComparativeAnalysis component
  const ComparativeAnalysis: React.FC<{
    title: string;
    data: Array<{ metric: string; current: number; previous: number; unit: string; isCurrency?: boolean }>;
    currentPeriod: string;
    previousPeriod: string;
  }> = ({ title, data, currentPeriod, previousPeriod }) => {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {data.map((item, index) => {
            const change = item.current - item.previous;
            const changePercent = item.previous > 0 ? ((change / item.previous) * 100).toFixed(1) : '0.0';
            const isPositive = change >= 0;
            
            return (
              <Box key={index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                <Typography variant="body2" sx={{ flex: 2 }}>
                  {item.metric}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                  {item.isCurrency ? 'Rs ' : ''}{item.current.toLocaleString()} {item.unit}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                  {item.isCurrency ? 'Rs ' : ''}{item.previous.toLocaleString()} {item.unit}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1, 
                    textAlign: 'right',
                    color: isPositive ? 'success.main' : 'error.main'
                  }}
                >
                  {isPositive ? '+' : ''}{changePercent}%
                </Typography>
              </Box>
            );
          })}
          <Box display="flex" justifyContent="space-between" mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="text.secondary" sx={{ flex: 2 }}>
              Metric
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
              {currentPeriod}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
              {previousPeriod}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'right' }}>
              Change
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Mock comparative data
  const comparativeData = [
    { metric: 'Total Crops', current: 12, previous: 10, unit: '' },
    { metric: 'Active Crops', current: 8, previous: 7, unit: '' },
    { metric: 'Total Expenses', current: 125000, previous: 98000, unit: '', isCurrency: true },
    { metric: 'Projected Revenue', current: 287000, previous: 234000, unit: '', isCurrency: true },
    { metric: 'Average Yield', current: 4500, previous: 4200, unit: 'kg' },
    { metric: 'Expense per Crop', current: 10416, previous: 9800, unit: '', isCurrency: true },
    { metric: 'Revenue per Acre', current: 14350, previous: 13000, unit: '', isCurrency: true },
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
            onClick={loadAnalyticsData}
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
            currentPeriod="Current Period"
            previousPeriod="Previous Period"
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

        {/* FIXED: TabPanel for AnalyticsReport with proper data handling */}
        <TabPanel value={tabValue} index={0}>
          {analyticsData ? (
            <AnalyticsReport
              data={{
                summary: analyticsData.summary || {},
                cropDistribution: analyticsData.cropDistribution || [],
                statusDistribution: analyticsData.statusDistribution || [],
                monthlyExpenses: analyticsData.monthlyExpenses || [],
                topCropsByExpenses: analyticsData.topCropsByExpenses || []
              }}
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No analytics data available
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <FinancialReport />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CropPerformanceReport />
        </TabPanel>
      </Card>

      {/* Simple Email Report Dialog */}
      {emailDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1300,
          }}
          onClick={() => setEmailDialogOpen(false)}
        >
          <Card
            sx={{ 
              width: '400px', 
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This feature will be implemented soon. Report will be sent to your registered email.
              </Typography>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => {
                    alert('Email report functionality will be implemented soon.');
                    setEmailDialogOpen(false);
                  }}
                >
                  Send Report
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};