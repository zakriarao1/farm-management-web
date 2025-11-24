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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [cropsResponse, analyticsResponse, expensesResponse] = await Promise.all([
        cropApi.getAll(),
        reportApi.getAnalytics(),
        expenseApi.getRecent()
      ]);
      
      // Transform crop data to ensure proper types
      const transformedCrops = transformCropData(cropsResponse.data || []);
      console.log('Transformed crops:', transformedCrops); // Debug log
      
      setCrops(transformedCrops);
      setAnalytics(analyticsResponse.data as AnalyticsData);
      setRecentExpenses(expensesResponse.data || []);
      
    } catch (err) {
      console.error('Dashboard: Failed to load data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Safe helper functions - FIXED to handle both camelCase and snake_case
  const getAreaUnit = (crop: Crop): string => {
    // Use both camelCase and snake_case properties
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
    // Use both camelCase and snake_case properties
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

  // Calculate statistics
  const totalProjectedRevenue = analytics?.summary?.projected_revenue || 0;
  const totalExpenses = analytics?.summary?.total_expenses || 0;
  const netProjection = totalProjectedRevenue - totalExpenses;

  // Calculate status distribution from crops data
  const statusDistribution = crops.reduce((acc: Record<string, number>, crop) => {
    if (crop.status) {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
    }
    return acc;
  }, {});

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
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CropIcon color="primary" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {analytics?.summary?.total_crops || crops.length}
                </Typography>
                <Typography color="text.secondary">Total Crops</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Active Crops Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrendingIcon color="success" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {analytics?.summary?.active_crops || 
                    crops.filter(crop => 
                      crop.status && ['PLANTED', 'GROWING', 'READY_FOR_HARVEST'].includes(crop.status)
                    ).length
                  }
                </Typography>
                <Typography color="text.secondary">Active Crops</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FinanceIcon color="warning" />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Rs {(totalExpenses / 1000).toFixed(1)}k
                </Typography>
                <Typography color="text.secondary">Total Expenses</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Projected Net Card */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ChartIcon color="info" />
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  color={netProjection >= 0 ? 'success.main' : 'error.main'}
                >
                  Rs {(netProjection / 1000).toFixed(1)}k
                </Typography>
                <Typography color="text.secondary">Projected Net</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Expenses Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Expenses
          </Typography>
          {recentExpenses.slice(0, 5).map((expense: Expense) => (
            <Box key={expense.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="body2">
                {expense.description}
              </Typography>
              <Typography variant="body2" color="error">
                -Rs {Number(expense.amount).toLocaleString()}
              </Typography>
            </Box>
          ))}
          {recentExpenses.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={2}>
              No recent expenses
            </Typography>
          )}
          <Button onClick={() => navigate('/expenses')} sx={{ mt: 1 }}>
            View All Expenses
          </Button>
        </CardContent>
      </Card>

      {/* Crop Distribution */}
      {analytics?.cropDistribution && analytics.cropDistribution.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Crop Distribution
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(4, 1fr)' 
              },
              gap: 2 
            }}>
              {analytics.cropDistribution.map((crop) => (
                <Paper sx={{ p: 2, textAlign: 'center' }} key={crop.type}>
                  <Typography variant="h6" color="primary">
                    {crop.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {crop.type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {crop.total_area} acres
                  </Typography>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

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

      {/* Inventory Section */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Inventory Management
        </Typography>
        <InventoryManager />
      </Box>

      {/* Main Content Area */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { 
          xs: '1fr', 
          md: '2fr 1fr' 
        },
        gap: 3 
      }}>
        {/* Recent Crops Section - FIXED */}
        <Box>
          <Card sx={{ mb: 3 }}>
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
                    {/* FIXED: Show proper units and values */}
                    <Typography variant="body2" color="text.secondary">
                      Area: {crop.area.toFixed(2)} {getAreaUnit(crop)}
                      {crop.yield > 0 && ` • Yield: ${crop.yield.toFixed(2)} ${getYieldUnit(crop)}`}
                    </Typography>
                    {/* FIXED: Show planting date */}
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
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No crops yet. Add your first crop to get started!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar Section */}
        <Box>
          {/* Quick Actions Card */}
          <Card sx={{ mb: 3 }}>
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
          <Card>
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

      {/* Additional Features Section */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Farm Management Features
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)' 
              },
              gap: 2 
            }}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CropIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Crop Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor planting, growth, and harvest cycles
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <FinanceIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Expense Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track costs and optimize your budget
                </Typography>
              </Paper>
              
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <ChartIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Analytics & Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Make data-driven farming decisions
                </Typography>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
  
};
