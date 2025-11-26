// frontend/src/components/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Paper,
  ChipProps,
} from '@mui/material';
import {
  Agriculture as CropIcon,
  Add as AddIcon,
  TrendingUp as TrendingIcon,
  AccountBalance as FinanceIcon,
  PieChart as ChartIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cropApi, expenseApi } from '../services/api';
import type { Crop, Expense } from '../types';
import { TaskDashboard } from './TaskDashboard';
import { InventoryManager } from './InventoryManager';
import { WeatherWidget } from './WeatherWidget';

// Temporary report API - we'll implement this properly later
const reportApi = {
  getAnalytics: async () => {
    return { data: { summary: {}, cropDistribution: [] } };
  },
  getFinancialReport: async () => {
    return { data: { crops: [], summary: {} } };
  },
};

interface AnalyticsData {
  summary: {
    total_crops?: number;
    active_crops?: number;
    total_expenses?: number;
    projected_revenue?: number;
  };
  cropDistribution: Array<{
    type: string;
    count: number;
    total_area: number;
  }>;
}

// Data transformation function
const transformCropData = (crops: any[]): Crop[] => {
  return crops.map(crop => ({
    id: crop.id,
    name: crop.name || 'Unnamed Crop',
    // Handle both camelCase and snake_case date fields
    plantingDate: crop.plantingDate || crop.planting_date || '',
    harvestDate: crop.harvestDate || crop.harvest_date,
    // Convert area to number and handle both field names
    area: Number(crop.area || crop.area_value || 0),
    // Handle both camelCase and snake_case unit fields
    areaUnit: (crop.areaUnit || crop.area_unit || 'UNITS') as any,
    // Convert yield to number and handle both field names
    yield: Number(crop.yield || crop.yield_value || 0),
    // Handle both camelCase and snake_case unit fields
    yieldUnit: (crop.yieldUnit || crop.yield_unit || 'UNITS') as any,
    // Convert expenses to number and handle both field names
    totalExpenses: Number(crop.totalExpenses || crop.total_expenses || 0),
    marketPrice: Number(crop.marketPrice || crop.market_price || 0),
    status: crop.status || 'PLANNED',
    notes: crop.notes,
    // Keep original API fields for reference
    planting_date: crop.planting_date,
    harvest_date: crop.harvest_date,
    area_value: crop.area_value,
    yield_value: crop.yield_value,
    total_expenses: crop.total_expenses,
    area_unit: crop.area_unit,
    yield_unit: crop.yield_unit,
    market_price: crop.market_price,
  }));
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [cropsResponse, analyticsResponse, expensesResponse, allExpensesResponse] = await Promise.all([
        cropApi.getAll(),
        reportApi.getAnalytics(),
        expenseApi.getRecent(),
        expenseApi.getAll() // Get all expenses for total calculation
      ]);
      
      // Transform crop data to ensure proper types
      const transformedCrops = transformCropData(cropsResponse.data || []);
      console.log('Transformed crops:', transformedCrops);
      console.log('All expenses:', allExpensesResponse.data);
      
      setCrops(transformedCrops);
      setAnalytics(analyticsResponse.data as AnalyticsData);
      setRecentExpenses(expensesResponse.data || []);
      setAllExpenses(allExpensesResponse.data || []);
      
    } catch (err) {
      console.error('Dashboard: Failed to load data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Safe helper functions
  const getAreaUnit = (crop: Crop): string => {
    const unit = crop.areaUnit || crop.area_unit;
    if (!unit) return 'units';
    if (typeof unit === 'string') {
      const unitMap: { [key: string]: string } = {
        'ACRES': 'acres',
        'HECTARES': 'hectares',
        'SQUARE_METERS': 'sq m',
        'MARLA': 'marla',
        'KANAL': 'kanal',
        'UNITS': 'units'
      };
      return unitMap[unit] || unit.toLowerCase();
    }
    return String(unit).toLowerCase();
  };

  const getYieldUnit = (crop: Crop): string => {
    const unit = crop.yieldUnit || crop.yield_unit;
    if (!unit) return 'units';
    if (typeof unit === 'string') {
      const unitMap: { [key: string]: string } = {
        'TONS': 'tons',
        'KILOGRAMS': 'kg',
        'POUNDS': 'lbs',
        'BUSHELS': 'bushels',
        'MONS': 'mons',
        'UNITS': 'units'
      };
      return unitMap[unit] || unit.toLowerCase();
    }
    return String(unit).toLowerCase();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusText = (status: string): string => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  };

  const getChipColor = (status: string): ChipProps['color'] => {
    const colors: Record<string, ChipProps['color']> = {
      PLANNED: 'default',
      PLANTED: 'primary',
      GROWING: 'info',
      READY_FOR_HARVEST: 'warning',
      HARVESTED: 'success',
      STOCKED: 'secondary',
      SOLD: 'success',
      FAILED: 'error',
    };
    
    return colors[status] || 'default';
  };

  // FIXED: Calculate statistics from actual data
  const calculateFinancials = () => {
    // Calculate total expenses from all expenses data
    const totalExpensesFromExpenses = allExpenses.reduce((sum, expense) => 
      sum + (Number(expense.amount) || 0), 0
    );

    // Also sum expenses from crops (if available)
    const totalExpensesFromCrops = crops.reduce((sum, crop) => 
      sum + (Number(crop.totalExpenses) || 0), 0
    );

    // Use the larger of the two expense totals
    const totalExpenses = Math.max(totalExpensesFromExpenses, totalExpensesFromExpenses);

    // Calculate projected revenue from crops
    const totalProjectedRevenue = crops.reduce((sum, crop) => {
      const yieldValue = Number(crop.yield) || 0;
      const marketPrice = Number(crop.marketPrice) || 0;
      return sum + (yieldValue * marketPrice);
    }, 0);

    const netProjection = totalProjectedRevenue - totalExpenses;

    console.log('Financial Calculations:', {
      totalExpensesFromExpenses,
      totalExpensesFromCrops,
      totalExpenses,
      totalProjectedRevenue,
      netProjection
    });

    return {
      totalExpenses,
      totalProjectedRevenue,
      netProjection
    };
  };

  const { totalExpenses, totalProjectedRevenue, netProjection } = calculateFinancials();

  // Calculate active crops
  const activeCropsCount = crops.filter(crop => 
    crop.status && ['PLANTED', 'GROWING', 'READY_FOR_HARVEST'].includes(crop.status)
  ).length;

  // Calculate status distribution from crops data
  const statusDistribution = crops.reduce((acc: Record<string, number>, crop) => {
    if (crop.status) {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
    }
    return acc;
  }, {});

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `Rs ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `Rs ${(amount / 1000).toFixed(1)}k`;
    } else {
      return `Rs ${amount.toFixed(0)}`;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={loadDashboardData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2
      }}>
        <Typography variant="h4" fontWeight="bold">
          Farm Management Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/crops/new')}
          size="large"
        >
          Add New Crop
        </Button>
      </Box>

      {/* Stats Cards Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        },
        gap: 3,
        mb: 4 
      }}>
        {/* Total Crops Card */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CropIcon color="primary" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {crops.length}
                </Typography>
                <Typography color="text.secondary">Total Crops</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Active Crops Card */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingIcon color="success" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {activeCropsCount}
                </Typography>
                <Typography color="text.secondary">Active Crops</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FinanceIcon color="warning" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatCurrency(totalExpenses)}
                </Typography>
                <Typography color="text.secondary">Total Expenses</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Projected Net Card */}
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ChartIcon color={netProjection >= 0 ? 'success' : 'error'} />
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  color={netProjection >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(netProjection)}
                </Typography>
                <Typography color="text.secondary">Projected Net</Typography>
                {totalProjectedRevenue > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Revenue: {formatCurrency(totalProjectedRevenue)}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Expenses Card */}
      <Card sx={{ mb: 3 }} elevation={1}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Expenses
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {formatCurrency(totalExpenses)}
            </Typography>
          </Box>
          {recentExpenses.slice(0, 5).map((expense: Expense) => (
            <Box key={expense.id} sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' }
            }}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {expense.description}
                </Typography>
                {expense.date && (
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(expense.date)}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="error.main" fontWeight="bold">
                -Rs {Number(expense.amount).toLocaleString()}
              </Typography>
            </Box>
          ))}
          {recentExpenses.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No recent expenses recorded
            </Typography>
          )}
          <Button 
            onClick={() => navigate('/expenses')} 
            sx={{ mt: 2 }}
            variant="outlined"
            fullWidth
          >
            View All Expenses
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '2fr 1fr' 
        },
        gap: 3 
      }}>
        {/* Recent Crops Section */}
        <Box>
          <Card sx={{ mb: 3 }} elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Crops ({crops.length})
              </Typography>
              {crops.slice(0, 5).map((crop) => (
                <Box
                  key={crop.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {crop.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Area: {crop.area.toFixed(2)} {getAreaUnit(crop)}
                      {crop.yield > 0 && ` • Yield: ${crop.yield.toFixed(2)} ${getYieldUnit(crop)}`}
                    </Typography>
                    {crop.plantingDate && crop.plantingDate !== 'Not set' && (
                      <Typography variant="caption" color="text.secondary">
                        Planted: {formatDate(crop.plantingDate)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Rs {crop.totalExpenses.toLocaleString()}
                    </Typography>
                    <Chip
                      label={getStatusText(crop.status)}
                      color={getChipColor(crop.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
              {crops.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CropIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No crops yet
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={() => navigate('/crops/new')}
                    size="small"
                  >
                    Add Your First Crop
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar Section */}
        <Box>
          {/* Quick Actions Card */}
          <Card sx={{ mb: 3 }} elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="contained" onClick={() => navigate('/crops')}>
                  View All Crops
                </Button>
                <Button variant="outlined" onClick={() => navigate('/crops/new')}>
                  Add New Crop
                </Button>
                <Button variant="outlined" onClick={() => navigate('/expenses')}>
                  Manage Expenses
                </Button>
                <Button variant="outlined" onClick={() => navigate('/reports')}>
                  View Reports
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Status Distribution Card */}
          <Card elevation={1}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Crop Status
              </Typography>
              {Object.entries(statusDistribution).map(([status, count]) => (
                <Box
                  key={status}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                  }}
                >
                  <Typography variant="body2">
                    {getStatusText(status)}
                  </Typography>
                  <Chip
                    label={count.toString()}
                    color={getChipColor(status)}
                    size="small"
                  />
                </Box>
              ))}
              {Object.keys(statusDistribution).length === 0 && (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No status data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Operations Section */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Farm Operations
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 3 
        }}>
          <TaskDashboard />
          <WeatherWidget />
        </Box>
      </Box>
    </Box>
  );
};