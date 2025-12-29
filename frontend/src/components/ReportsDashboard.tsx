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
import { reportApi } from '../services/reportApi'; // Use your existing reportApi
import type { 
  AnalyticsData as AnalyticsDataType,
  AnalyticsSummary,
  CropDistribution,
  StatusDistribution,
  MonthlyExpense,
  TopCropByExpense
} from '../types';

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
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load real data from API
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching real analytics data from reportApi...');
      
      // Convert dateRange to string format for API
      const dateRangeParams = {
        startDate: dateRange.start ? dateRange.start.toISOString().split('T')[0] : undefined,
        endDate: dateRange.end ? dateRange.end.toISOString().split('T')[0] : undefined
      };
      
      const response = await reportApi.getAnalytics(dateRangeParams);
      
      if (!response.data) {
        throw new Error('No data received from analytics API');
      }
      
      console.log('✅ Real analytics data loaded:', {
        totalCrops: response.data.summary?.total_crops,
        activeCrops: response.data.summary?.active_crops,
        totalExpenses: response.data.summary?.total_expenses,
        cropDistributionCount: response.data.cropDistribution?.length || 0
      });
      
      // Ensure cropDistribution exists (it should from your reportApi fallback)
      const safeData: AnalyticsDataType = {
        summary: response.data.summary || {},
        cropDistribution: response.data.cropDistribution || [],
        statusDistribution: response.data.statusDistribution || [],
        monthlyExpenses: response.data.monthlyExpenses || [],
        topCropsByExpenses: response.data.topCropsByExpenses || []
      };
      
      setAnalyticsData(safeData);
      
    } catch (err: any) {
      console.error('❌ Failed to load analytics data:', err);
      setError(err.message || 'Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when dateRange changes
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Refresh data when date range changes
  useEffect(() => {
    if (!loading) {
      loadAnalyticsData();
    }
  }, [dateRange]);

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

  // Generate comparative data from real analytics
  const getComparativeData = () => {
    if (!analyticsData?.summary) return [];
    
    const summary = analyticsData.summary;
    
    return [
      { 
        metric: 'Total Crops', 
        current: summary.total_crops || 0, 
        previous: Math.max(0, (summary.total_crops || 0) - 2), // Placeholder
        unit: '' 
      },
      { 
        metric: 'Active Crops', 
        current: summary.active_crops || 0, 
        previous: Math.max(0, (summary.active_crops || 0) - 1), 
        unit: '' 
      },
      { 
        metric: 'Total Expenses', 
        current: summary.total_expenses || 0, 
        previous: Math.max(0, (summary.total_expenses || 0) * 0.8), // Placeholder
        unit: '', 
        isCurrency: true 
      },
      { 
        metric: 'Projected Revenue', 
        current: summary.projected_revenue || 0, 
        previous: Math.max(0, (summary.projected_revenue || 0) * 0.85), // Placeholder
        unit: '', 
        isCurrency: true 
      },
      { 
        metric: 'Avg Actual Yield', 
        current: summary.avg_actual_yield || 0, 
        previous: Math.max(0, (summary.avg_actual_yield || 0) * 0.95), // Placeholder
        unit: 'kg' 
      },
    ];
  };

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

      {/* Comparative Analysis - Show only if we have data */}
      {analyticsData && getComparativeData().length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ComparativeAnalysis
            title="Performance Overview"
            data={getComparativeData()}
            currentPeriod="Current"
            previousPeriod="Previous"
          />
        </Box>
      )}

      {/* Debug Info - Show what data we're getting */}
      {process.env.NODE_ENV === 'development' && analyticsData && (
        <Card sx={{ mb: 2, backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">
              <strong>Debug:</strong> {analyticsData.cropDistribution.length} crops, 
              {analyticsData.statusDistribution?.length || 0} statuses, 
              {analyticsData.monthlyExpenses?.length || 0} months
            </Typography>
          </CardContent>
        </Card>
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

        {/* Analytics Report Tab */}
        <TabPanel value={tabValue} index={0}>
          {analyticsData ? (
            <AnalyticsReport
              data={analyticsData}
              crops={[]} // You might want to fetch real crops data here
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Loading real-time analytics data...
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Financial Report Tab */}
        <TabPanel value={tabValue} index={1}>
          <FinancialReport />
        </TabPanel>

        {/* Crop Performance Tab */}
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