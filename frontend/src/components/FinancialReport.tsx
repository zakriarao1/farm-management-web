// frontend/components/FinancialReport.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  MoneyOff,
  Assessment,
  PieChart,
  BarChart,
  Download,
  Refresh,
} from '@mui/icons-material';
import { financeApi } from '../services/api';
import type { ProfitLossReport, ROIAnalysisResponse } from '../types';

interface FinancialSummaryCardProps {
  title: string;
  value: number;
  subText?: string;
  icon: React.ReactNode;
  color: 'success' | 'error' | 'primary' | 'warning' | 'info';
  trend?: number;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  title,
  value,
  subText,
  icon,
  color,
  trend,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>
          {formatCurrency(value)}
        </Typography>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" mt={1}>
            {trend >= 0 ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
            <Typography
              variant="caption"
              color={trend >= 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </Typography>
          </Box>
        )}
        {subText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {subText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

interface ExpenseBreakdownProps {
  roiByCrop: Array<{
    name: string;
    type: string;
    revenue: number;
    total_expenses: number;
    roi_percentage: number;
  }>;
}

const ExpenseBreakdown: React.FC<ExpenseBreakdownProps> = ({ roiByCrop }) => {
  const totalExpenses = roiByCrop.reduce((sum, crop) => sum + crop.total_expenses, 0);

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Expense Breakdown by Crop
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Crop</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Expenses</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell align="right">ROI</TableCell>
                <TableCell align="right">Expense %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roiByCrop.map((crop) => {
                const profit = crop.revenue - crop.total_expenses;
                const expensePercentage = totalExpenses > 0 
                  ? (crop.total_expenses / totalExpenses) * 100 
                  : 0;

                return (
                  <TableRow key={`${crop.name}-${crop.type}`}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {crop.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {crop.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        Rs {crop.revenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="error.main">
                        Rs {crop.total_expenses.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={profit >= 0 ? 'success.main' : 'error.main'}
                      >
                        Rs {profit.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${crop.roi_percentage >= 0 ? '+' : ''}${crop.roi_percentage.toFixed(1)}%`}
                        color={crop.roi_percentage >= 0 ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        <Box width="60px" mr={1}>
                          <LinearProgress
                            variant="determinate"
                            value={expensePercentage}
                            color="error"
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="caption">
                          {expensePercentage.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {roiByCrop.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No expense data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

interface ROIAnalysisChartProps {
  analysis: Array<{
    period: string;
    crop_count: number;
    total_revenue: number;
    total_expenses: number;
    avg_roi_percentage: number;
    avg_net_profit: number;
  }>;
}

const ROIAnalysisChart: React.FC<ROIAnalysisChartProps> = ({ analysis }) => {
  if (analysis.length === 0) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ROI Trend Analysis
          </Typography>
          <Typography color="text.secondary" textAlign="center" py={4}>
            No ROI trend data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const maxROI = Math.max(...analysis.map(a => Math.abs(a.avg_roi_percentage)));
  const maxProfit = Math.max(...analysis.map(a => Math.abs(a.avg_net_profit)));

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ROI Trend Analysis
        </Typography>
        <Grid container spacing={2}>
          {analysis.map((item) => {
            const roiBarWidth = Math.abs(item.avg_roi_percentage) / maxROI * 100;
            const profitBarWidth = Math.abs(item.avg_net_profit) / maxProfit * 100;

            return (
              <Grid item xs={12} key={item.period}>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="subtitle2">{item.period}</Typography>
                    <Box display="flex" gap={2}>
                      <Chip
                        label={`${item.crop_count} crops`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`ROI: ${item.avg_roi_percentage >= 0 ? '+' : ''}${item.avg_roi_percentage.toFixed(1)}%`}
                        color={item.avg_roi_percentage >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  
                  {/* ROI Bar */}
                  <Box mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      ROI: {item.avg_roi_percentage >= 0 ? '+' : ''}{item.avg_roi_percentage.toFixed(1)}%
                    </Typography>
                    <Box 
                      height={8} 
                      bgcolor={item.avg_roi_percentage >= 0 ? 'success.light' : 'error.light'}
                      width={`${roiBarWidth}%`}
                      borderRadius={4}
                      mt={0.5}
                    />
                  </Box>

                  {/* Profit Bar */}
                  <Box mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Profit: Rs {Math.round(item.avg_net_profit).toLocaleString()}
                    </Typography>
                    <Box 
                      height={8} 
                      bgcolor={item.avg_net_profit >= 0 ? 'primary.light' : 'warning.light'}
                      width={`${profitBarWidth}%`}
                      borderRadius={4}
                      mt={0.5}
                    />
                  </Box>

                  {/* Revenue & Expenses */}
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="caption">
                      Revenue: <strong>Rs {item.total_revenue.toLocaleString()}</strong>
                    </Typography>
                    <Typography variant="caption" color="error">
                      Expenses: Rs {item.total_expenses.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
              </Grid>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
};

export const FinancialReport: React.FC = () => {
  const [profitLossData, setProfitLossData] = useState<ProfitLossReport | null>(null);
  const [roiAnalysisData, setRoiAnalysisData] = useState<ROIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState({
    profitLoss: true,
    roiAnalysis: false,
  });
  const [error, setError] = useState<string | null>(null);

  const loadFinancialData = async () => {
    try {
      setLoading({ profitLoss: true, roiAnalysis: true });
      setError(null);

      // Load Profit/Loss Data
      const profitLossResponse = await financeApi.getProfitLossReport();
      if (profitLossResponse.data) {
        setProfitLossData(profitLossResponse.data);
      }

      // Load ROI Analysis Data
      const roiResponse = await financeApi.getROIAnalysis('monthly');
      if (roiResponse.data) {
        setRoiAnalysisData(roiResponse.data);
      }

    } catch (err: any) {
      console.error('Failed to load financial data:', err);
      setError(err.message || 'Failed to load financial data');
    } finally {
      setLoading({ profitLoss: false, roiAnalysis: false });
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleRefresh = () => {
    loadFinancialData();
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting financial report...');
    alert('Export functionality will be implemented soon');
  };

  if (loading.profitLoss && !profitLossData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading financial report...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!profitLossData) {
    return (
      <Box textAlign="center" py={4}>
        <MoneyOff sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Financial Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Financial reports require crops to be marked as "SOLD" with revenue data.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={handleRefresh}
          startIcon={<Refresh />}
        >
          Refresh Data
        </Button>
      </Box>
    );
  }

  const { summary, roiByCrop, timeframe } = profitLossData;

  return (
    <Box>
      {/* Header with Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Financial Report
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeframe.startDate 
              ? `Period: ${new Date(timeframe.startDate).toLocaleDateString()} - ${new Date(timeframe.endDate).toLocaleDateString()}`
              : 'All time data'
            }
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading.profitLoss || loading.roiAnalysis}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Financial Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Total Revenue"
            value={summary.totalRevenue}
            icon={<AttachMoney />}
            color="primary"
            trend={roiAnalysisData?.analysis?.[0]?.avg_roi_percentage}
            subText={`${summary.soldCropsCount} crops sold`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Total Expenses"
            value={summary.totalExpenses}
            icon={<MoneyOff />}
            color="error"
            subText={`${summary.expenseCount} expense records`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Net Profit"
            value={summary.netProfit}
            icon={<Assessment />}
            color={summary.netProfit >= 0 ? 'success' : 'error'}
            subText={summary.netProfit >= 0 ? 'Profitable' : 'Loss'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FinancialSummaryCard
            title="Return on Investment"
            value={summary.roi}
            icon={<TrendingUp />}
            color={summary.roi >= 0 ? 'success' : 'error'}
            subText="ROI Percentage"
          />
        </Grid>
      </Grid>

      {/* Profit/Loss Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Profit/Loss Breakdown
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" height={100}>
            <Box width="100%" maxWidth={400}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Revenue
                </Typography>
                <Typography variant="body2">
                  Rs {summary.totalRevenue.toLocaleString()}
                </Typography>
              </Box>
              <Box height={20} bgcolor="primary.main" borderRadius={10} mb={2} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Expenses
                </Typography>
                <Typography variant="body2" color="error.main">
                  Rs {summary.totalExpenses.toLocaleString()}
                </Typography>
              </Box>
              <Box height={20} bgcolor="error.main" borderRadius={10} mb={2} />
              
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Net Profit
                </Typography>
                <Typography 
                  variant="body2" 
                  color={summary.netProfit >= 0 ? 'success.main' : 'error.main'}
                >
                  Rs {summary.netProfit.toLocaleString()}
                </Typography>
              </Box>
              <Box 
                height={20} 
                bgcolor={summary.netProfit >= 0 ? 'success.main' : 'error.main'} 
                borderRadius={10} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Expense Breakdown by Crop */}
      {roiByCrop && roiByCrop.length > 0 && (
        <ExpenseBreakdown roiByCrop={roiByCrop} />
      )}

      {/* ROI Analysis Over Time */}
      {roiAnalysisData && roiAnalysisData.analysis && roiAnalysisData.analysis.length > 0 && (
        <ROIAnalysisChart analysis={roiAnalysisData.analysis} />
      )}

      {/* Loading State for ROI Analysis */}
      {loading.roiAnalysis && (
        <Box textAlign="center" py={4}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading ROI analysis...</Typography>
        </Box>
      )}

      {/* No Data Message */}
      {(!roiByCrop || roiByCrop.length === 0) && 
       (!roiAnalysisData || !roiAnalysisData.analysis || roiAnalysisData.analysis.length === 0) && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography textAlign="center" color="text.secondary" py={2}>
              No detailed financial data available. Start by marking crops as "SOLD" to track revenue.
            </Typography>
            <Box textAlign="center" mt={2}>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                startIcon={<Refresh />}
              >
                Check for New Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Footer Notes */}
      <Box mt={3}>
        <Typography variant="caption" color="text.secondary">
          Note: Financial data is calculated based on sold crops and recorded expenses. 
          ROI is calculated as (Net Profit / Total Expenses) × 100%.
        </Typography>
      </Box>
    </Box>
  );
};