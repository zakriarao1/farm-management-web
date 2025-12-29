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
  Grid,
  Chip,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  AccountBalance as FinanceIcon,
  TrendingUp as PerformanceIcon,
  LocalShipping as HarvestIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { AnalyticsReport } from './AnalyticsReport';
import { FinancialReport } from './FinancialReport';
import { CropPerformanceReport } from './CropPerformanceReport';
import {  financeApi } from '../services/api'; // Import both APIs
import {  reportApi } from '../services/reportApi'; // Import both APIs

import type { 
  AnalyticsData as AnalyticsDataType,
  ProfitLossReport,
  ROIAnalysisResponse,
  ProfitLossSummary,
  ROIAnalysis
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
  const [profitLossData, setProfitLossData] = useState<ProfitLossReport | null>(null);
  const [roiAnalysisData, setRoiAnalysisData] = useState<ROIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState({
    analytics: true,
    financial: false,
    roi: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load real analytics data from API
  const loadAnalyticsData = async () => {
    try {
      setLoading(prev => ({ ...prev, analytics: true }));
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
        harvestedCrops: response.data.summary?.total_harvested_crops,
        totalExpenses: response.data.summary?.total_expenses,
        cropDistributionCount: response.data.cropDistribution?.length || 0
      });
      
      // Ensure all data exists (it should from your reportApi fallback)
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
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Load profit/loss data
  const loadProfitLossData = async () => {
    try {
      setLoading(prev => ({ ...prev, financial: true }));
      
      const dateRangeParams = {
        startDate: dateRange.start ? dateRange.start.toISOString().split('T')[0] : undefined,
        endDate: dateRange.end ? dateRange.end.toISOString().split('T')[0] : undefined
      };
      
      const response = await financeApi.getProfitLossReport(
        dateRangeParams.startDate,
        dateRangeParams.endDate
      );
      
      if (response.data) {
        setProfitLossData(response.data);
        console.log('💰 Profit/Loss data loaded:', response.data.summary);
      }
      
    } catch (err: any) {
      console.error('❌ Failed to load profit/loss data:', err);
      // Don't set error here - it's okay if financial data isn't available
    } finally {
      setLoading(prev => ({ ...prev, financial: false }));
    }
  };

  // Load ROI analysis data
  const loadRoiAnalysisData = async () => {
    try {
      setLoading(prev => ({ ...prev, roi: true }));
      
      const response = await financeApi.getROIAnalysis('monthly');
      
      if (response.data) {
        setRoiAnalysisData(response.data);
        console.log('📈 ROI analysis data loaded:', response.data.analysis?.length || 0, 'periods');
      }
      
    } catch (err: any) {
      console.error('❌ Failed to load ROI analysis:', err);
    } finally {
      setLoading(prev => ({ ...prev, roi: false }));
    }
  };

  // Load all data on component mount
  useEffect(() => {
    loadAnalyticsData();
    loadProfitLossData();
    loadRoiAnalysisData();
  }, []);

  // Refresh data when date range changes
  useEffect(() => {
    if (!loading.analytics) {
      loadAnalyticsData();
      loadProfitLossData();
    }
  }, [dateRange]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load financial data when switching to financial tab
    if (newValue === 1 && !profitLossData) {
      loadProfitLossData();
      loadRoiAnalysisData();
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

  // Simple ROI Card Component
  const ROICard: React.FC<{ data: ROIAnalysis }> = ({ data }) => {
    const roiColor = data.avg_roi_percentage >= 0 ? 'success.main' : 'error.main';
    const profitColor = data.avg_net_profit >= 0 ? 'success.main' : 'error.main';
    
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {data.period}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.crop_count} crops
          </Typography>
          <Box mt={1}>
            <Typography variant="body2">
              Revenue: <strong style={{ color: '#1976d2' }}>Rs {data.total_revenue.toLocaleString()}</strong>
            </Typography>
            <Typography variant="body2">
              Expenses: <strong>Rs {data.total_expenses.toLocaleString()}</strong>
            </Typography>
          </Box>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                ROI
              </Typography>
              <Typography variant="h6" color={roiColor}>
                {data.avg_roi_percentage >= 0 ? '+' : ''}{data.avg_roi_percentage.toFixed(1)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Avg Profit
              </Typography>
              <Typography variant="h6" color={profitColor}>
                Rs {Math.round(data.avg_net_profit).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Simple Profit/Loss Summary Component
  const ProfitLossSummaryCard: React.FC<{ summary: ProfitLossSummary }> = ({ summary }) => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profit & Loss Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="h5" color="primary">
                  Rs {summary.totalRevenue.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Total Expenses
                </Typography>
                <Typography variant="h5" color="error">
                  Rs {summary.totalExpenses.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  Net Profit
                </Typography>
                <Typography 
                  variant="h5" 
                  color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  Rs {summary.netProfit.toLocaleString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">
                  ROI
                </Typography>
                <Typography 
                  variant="h5" 
                  color={summary.roi >= 0 ? 'success.main' : 'error.main'}
                >
                  {summary.roi >= 0 ? '+' : ''}{summary.roi.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box mt={2} display="flex" justifyContent="center" gap={3}>
            <Chip 
              label={`${summary.soldCropsCount} crops sold`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip 
              label={`${summary.expenseCount} expenses`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading.analytics && !analyticsData) {
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
            onClick={() => {
              loadAnalyticsData();
              if (tabValue === 1) {
                loadProfitLossData();
                loadRoiAnalysisData();
              }
            }}
            disabled={loading.analytics || loading.financial}
            startIcon={loading.analytics || loading.financial ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            {loading.analytics || loading.financial ? 'Refreshing...' : 'Refresh'}
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

      {/* Quick Stats Overview - SHOWING ONLY REAL DATA */}
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
                  <Typography variant="caption" color="text.secondary">
                    All time records
                  </Typography>
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
                  <Typography variant="caption" color="text.secondary">
                    Currently growing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Harvested Crops Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <HarvestIcon color="warning" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analyticsData.summary.total_harvested_crops || 0}
                  </Typography>
                  <Typography color="text.secondary">Harvested</Typography>
                  {analyticsData.summary.total_sold_crops && analyticsData.summary.total_sold_crops > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {analyticsData.summary.total_sold_crops} sold
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Total Expenses Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FinanceIcon color="error" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Rs {((analyticsData.summary.total_expenses || 0) / 1000).toFixed(1)}k
                  </Typography>
                  <Typography color="text.secondary">Total Expenses</Typography>
                  <Typography variant="caption" color="text.secondary">
                    All expenses recorded
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Average Expense per Crop Card */}
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FinanceIcon color="info" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Rs {Math.round(analyticsData.summary.average_expense_per_crop || 0).toLocaleString()}
                  </Typography>
                  <Typography color="text.secondary">Avg Expense/Crop</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on {analyticsData.summary.total_crops || 0} crops
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
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

        {/* Analytics Report Tab */}
        <TabPanel value={tabValue} index={0}>
          {analyticsData ? (
            <AnalyticsReport
              data={analyticsData}
              crops={[]}
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Loading real-time analytics data...
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Financial Report Tab - WITH PROFIT/LOSS DATA */}
        <TabPanel value={tabValue} index={1}>
          {loading.financial ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading financial data...</Typography>
            </Box>
          ) : profitLossData ? (
            <Box>
              {/* Profit/Loss Summary */}
              <ProfitLossSummaryCard summary={profitLossData.summary} />
              
              {/* ROI by Crop */}
              {profitLossData.roiByCrop && profitLossData.roiByCrop.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ROI by Crop
                    </Typography>
                    <Grid container spacing={2}>
                      {profitLossData.roiByCrop.map((crop, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {crop.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {crop.type}
                              </Typography>
                              <Box mt={1}>
                                <Typography variant="body2">
                                  Revenue: <strong>Rs {crop.revenue.toLocaleString()}</strong>
                                </Typography>
                                <Typography variant="body2">
                                  Expenses: <strong>Rs {crop.total_expenses.toLocaleString()}</strong>
                                </Typography>
                              </Box>
                              <Box mt={2}>
                                <Chip
                                  label={`ROI: ${crop.roi_percentage >= 0 ? '+' : ''}${crop.roi_percentage.toFixed(1)}%`}
                                  color={crop.roi_percentage >= 0 ? 'success' : 'error'}
                                  size="small"
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              {/* ROI Analysis Over Time */}
              {roiAnalysisData && roiAnalysisData.analysis && roiAnalysisData.analysis.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ROI Analysis - {roiAnalysisData.period}
                    </Typography>
                    <Grid container spacing={2}>
                      {roiAnalysisData.analysis.map((analysis, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <ROICard data={analysis} />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
              
              {/* Timeframe Info */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Report Period
                  </Typography>
                  <Typography variant="body2">
                    {profitLossData.timeframe.startDate ? 
                      `From ${new Date(profitLossData.timeframe.startDate).toLocaleDateString()} to ${new Date(profitLossData.timeframe.endDate).toLocaleDateString()}` :
                      'All time data'
                    }
                  </Typography>
                </CardContent>
              </Card>
              
              {/* No Financial Data Message */}
              {(!profitLossData.roiByCrop || profitLossData.roiByCrop.length === 0) && 
               (!roiAnalysisData || !roiAnalysisData.analysis || roiAnalysisData.analysis.length === 0) && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography textAlign="center" color="text.secondary" py={2}>
                      No detailed financial data available. Start by marking crops as "SOLD" to track revenue.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <MoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Financial Data Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Financial reports require crops to be marked as "SOLD" with revenue data.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={loadProfitLossData}
                sx={{ mt: 2 }}
                startIcon={<RefreshIcon />}
              >
                Try Loading Again
              </Button>
            </Box>
          )}
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