// frontend/src/components/CropPerformanceReport.tsx

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
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocalFlorist,
  CalendarToday,
  BarChart as BarChartIcon,
  TableChart,
  Download,
  Refresh,
  Info,
  Agriculture,
  ShowChart,
  Timeline,
  Assessment,
  AttachMoney,
  MoneyOff,
} from '@mui/icons-material';
import { cropApi, expenseApi } from '../services/api';
import type { Crop, Expense } from '../types';

interface PerformanceMetricCardProps {
  title: string;
  value: string | number;
  subText?: string;
  icon: React.ReactNode;
  color: 'success' | 'error' | 'primary' | 'warning' | 'info';
  trend?: number;
  unit?: string;
}

const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  subText,
  icon,
  color,
  trend,
  unit,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <Typography component="span" variant="h6" color="text.secondary"> {unit}</Typography>}
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

interface CropPerformanceData {
  id: number;
  name: string;
  type: string;
  plantingDate: string;
  harvestDate?: string;
  area: number;
  areaUnit: string;
  yield: number;
  yieldUnit: string;
  status: string;
  totalExpenses: number;
  revenue?: number;
  profit?: number;
  roi?: number;
  daysToHarvest?: number;
  costPerUnit?: number;
  yieldPerArea?: number;
  expenses: Expense[];
}

interface GrowthStage {
  stage: string;
  startDate: string;
  endDate: string;
  duration: number;
  expenses: number;
  tasks: number;
}

interface PerformanceViewProps {
  crop: CropPerformanceData;
}

const PerformanceView: React.FC<PerformanceViewProps> = ({ crop }) => {
  const [view, setView] = useState<'overview' | 'timeline' | 'expenses'>('overview');

  const calculateGrowthStages = (): GrowthStage[] => {
    const stages: GrowthStage[] = [];
    const plantingDate = new Date(crop.plantingDate);
    
    // Seedling Stage (0-30 days)
    stages.push({
      stage: 'Seedling',
      startDate: crop.plantingDate,
      endDate: new Date(plantingDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 30,
      expenses: crop.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= plantingDate && 
               expenseDate <= new Date(plantingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      }).reduce((sum, e) => sum + e.amount, 0),
      tasks: 0,
    });

    // Vegetative Stage (31-90 days)
    stages.push({
      stage: 'Vegetative',
      startDate: new Date(plantingDate.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(plantingDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 60,
      expenses: crop.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= new Date(plantingDate.getTime() + 31 * 24 * 60 * 60 * 1000) &&
               expenseDate <= new Date(plantingDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      }).reduce((sum, e) => sum + e.amount, 0),
      tasks: 0,
    });

    // Flowering/Fruiting Stage (91-150 days)
    stages.push({
      stage: 'Flowering/Fruiting',
      startDate: new Date(plantingDate.getTime() + 91 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(plantingDate.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 60,
      expenses: crop.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= new Date(plantingDate.getTime() + 91 * 24 * 60 * 60 * 1000) &&
               expenseDate <= new Date(plantingDate.getTime() + 150 * 24 * 60 * 60 * 1000);
      }).reduce((sum, e) => sum + e.amount, 0),
      tasks: 0,
    });

    // Maturation Stage (if harvested)
    if (crop.harvestDate) {
      const harvestDate = new Date(crop.harvestDate);
      stages.push({
        stage: 'Maturation',
        startDate: new Date(plantingDate.getTime() + 151 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: crop.harvestDate,
        duration: Math.round((harvestDate.getTime() - plantingDate.getTime() - 150 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)),
        expenses: crop.expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= new Date(plantingDate.getTime() + 151 * 24 * 60 * 60 * 1000) &&
                 expenseDate <= harvestDate;
        }).reduce((sum, e) => sum + e.amount, 0),
        tasks: 0,
      });
    }

    return stages;
  };

  const growthStages = calculateGrowthStages();
  const totalExpenses = crop.expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgDailyExpense = totalExpenses / crop.expenses.length || 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">{crop.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {crop.type} • {crop.area} {crop.areaUnit} • Planted: {new Date(crop.plantingDate).toLocaleDateString()}
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="overview">
              <ShowChart fontSize="small" />
            </ToggleButton>
            <ToggleButton value="timeline">
              <Timeline fontSize="small" />
            </ToggleButton>
            <ToggleButton value="expenses">
              <BarChartIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {view === 'overview' && (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">Yield</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {crop.yield} {crop.yieldUnit}
                  </Typography>
                  {crop.yieldPerArea && (
                    <Typography variant="caption" color="text.secondary">
                      {crop.yieldPerArea.toFixed(1)}/{crop.areaUnit}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                  <Typography variant="body1" fontWeight="bold" color="error.main">
                    Rs {totalExpenses.toLocaleString()}
                  </Typography>
                  {crop.costPerUnit && (
                    <Typography variant="caption" color="text.secondary">
                      Rs {crop.costPerUnit.toFixed(2)}/{crop.yieldUnit}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">Profit</Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    color={crop.profit && crop.profit >= 0 ? 'success.main' : 'error.main'}
                  >
                    {crop.profit ? `Rs ${crop.profit.toLocaleString()}` : 'N/A'}
                  </Typography>
                  {crop.roi !== undefined && (
                    <Chip
                      label={`${crop.roi >= 0 ? '+' : ''}${crop.roi.toFixed(1)}% ROI`}
                      color={crop.roi >= 0 ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {crop.daysToHarvest || 'Ongoing'} days
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: Rs {avgDailyExpense.toFixed(2)}/day
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {view === 'timeline' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Growth Timeline</Typography>
            {growthStages.map((stage, index) => (
              <Box key={stage.stage} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight="medium">
                    {stage.stage}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stage.duration} days
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(stage.startDate).toLocaleDateString()} - {new Date(stage.endDate).toLocaleDateString()}
                  </Typography>
                  <Chip
                    label={`Rs ${stage.expenses.toLocaleString()}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(index + 1) * 25}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            ))}
          </Box>
        )}

        {view === 'expenses' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Expense Breakdown</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {crop.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {expense.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main">
                          Rs {expense.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {crop.expenses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary" py={2}>
                          No expenses recorded
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {crop.expenses.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Total: Rs {totalExpenses.toLocaleString()} • Average: Rs {(totalExpenses / crop.expenses.length).toFixed(2)} per expense
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

interface ComparisonChartProps {
  crops: CropPerformanceData[];
  metric: 'yield' | 'cost' | 'profit' | 'roi';
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ crops, metric }) => {
  const getMetricValue = (crop: CropPerformanceData) => {
    switch (metric) {
      case 'yield': return crop.yield;
      case 'cost': return crop.totalExpenses;
      case 'profit': return crop.profit || 0;
      case 'roi': return crop.roi || 0;
      default: return 0;
    }
  };

  const getMetricColor = (value: number) => {
    if (metric === 'profit' || metric === 'roi') {
      return value >= 0 ? 'success.main' : 'error.main';
    }
    return 'primary.main';
  };

  const getMetricLabel = () => {
    switch (metric) {
      case 'yield': return 'Yield';
      case 'cost': return 'Cost';
      case 'profit': return 'Profit';
      case 'roi': return 'ROI';
    }
  };

  const maxValue = Math.max(...crops.map(crop => Math.abs(getMetricValue(crop))), 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          {getMetricLabel()} Comparison
        </Typography>
        <Box mt={2}>
          {crops.map((crop) => {
            const value = getMetricValue(crop);
            const percentage = (Math.abs(value) / maxValue) * 100;
            
            return (
              <Box key={crop.id} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight="medium">
                    {crop.name}
                  </Typography>
                  <Typography variant="body2" color={getMetricColor(value)}>
                    {metric === 'roi' 
                      ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
                      : `Rs ${value.toLocaleString()}`
                    }
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getMetricColor(value),
                    },
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {crop.type} • {crop.area} {crop.areaUnit}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {crop.yield} {crop.yieldUnit}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export const CropPerformanceReport: React.FC = () => {
  const [crops, setCrops] = useState<CropPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('yield');
  const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');
  const [comparisonMetric, setComparisonMetric] = useState<'yield' | 'cost' | 'profit' | 'roi'>('yield');
  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);

  const loadCropPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all crops
      const cropsResponse = await cropApi.getAll();
      if (!cropsResponse.data) throw new Error('No crops data');

      // Transform and enrich crop data
      const performanceData: CropPerformanceData[] = await Promise.all(
        cropsResponse.data.map(async (crop: Crop) => {
          // Load expenses for this crop
          const expensesResponse = await expenseApi.getByCropId(crop.id);
          const expenses = expensesResponse.data || [];

          const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
          
          // Get crop type - using a default if not available
          const cropType = 'crop_type' in crop ? (crop as any).crop_type : 
                          'type' in crop ? (crop as any).type : 
                          'Unknown';

          // Calculate derived metrics
          const daysToHarvest = crop.harvestDate 
            ? Math.round((new Date(crop.harvestDate).getTime() - new Date(crop.plantingDate).getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

          const costPerUnit = crop.yield > 0 ? totalExpenses / crop.yield : undefined;
          const yieldPerArea = crop.area > 0 ? crop.yield / crop.area : undefined;

          // Calculate profit and ROI if crop is sold
          let revenue = 0;
          let profit = undefined;
          let roi = undefined;
          
          if (crop.status === 'SOLD' && crop.marketPrice && crop.yield) {
            revenue = crop.marketPrice * crop.yield;
            profit = revenue - totalExpenses;
            roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
          }

          return {
            id: crop.id,
            name: crop.name,
            type: cropType,
            plantingDate: crop.plantingDate,
            harvestDate: crop.harvestDate,
            area: crop.area,
            areaUnit: crop.areaUnit,
            yield: crop.yield,
            yieldUnit: crop.yieldUnit,
            status: crop.status,
            totalExpenses,
            revenue,
            profit,
            roi,
            daysToHarvest,
            costPerUnit,
            yieldPerArea,
            expenses,
          };
        })
      );

      setCrops(performanceData);
    } catch (err: any) {
      console.error('Failed to load crop performance data:', err);
      setError(err.message || 'Failed to load crop performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCropPerformanceData();
  }, []);

  const filteredCrops = crops.filter(crop => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'harvested') return crop.status === 'HARVESTED' || crop.status === 'SOLD';
    if (filterStatus === 'active') return !['HARVESTED', 'SOLD', 'FAILED'].includes(crop.status);
    return crop.status === filterStatus;
  });

  const sortedCrops = [...filteredCrops].sort((a, b) => {
    switch (sortBy) {
      case 'yield': return b.yield - a.yield;
      case 'cost': return b.totalExpenses - a.totalExpenses;
      case 'profit': return (b.profit || 0) - (a.profit || 0);
      case 'roi': return (b.roi || 0) - (a.roi || 0);
      case 'area': return b.area - a.area;
      default: return 0;
    }
  });

  const selectedCrop = selectedCropId 
    ? crops.find(crop => crop.id === selectedCropId)
    : sortedCrops[0];

  // Calculate summary metrics
  const totalYield = crops.reduce((sum, crop) => sum + crop.yield, 0);
  const totalExpenses = crops.reduce((sum, crop) => sum + crop.totalExpenses, 0);
  const totalProfit = crops.reduce((sum, crop) => sum + (crop.profit || 0), 0);
  const cropsWithArea = crops.filter(c => c.area > 0);
  const avgYieldPerArea = cropsWithArea.length > 0 
    ? cropsWithArea.reduce((sum, crop) => sum + (crop.yield / crop.area), 0) / cropsWithArea.length 
    : 0;
  const harvestedCrops = crops.filter(c => ['HARVESTED', 'SOLD'].includes(c.status)).length;
  const activeCrops = crops.filter(c => !['HARVESTED', 'SOLD', 'FAILED'].includes(c.status)).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading crop performance data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={loadCropPerformanceData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (crops.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Agriculture sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Crop Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Add crops and record expenses to see performance analytics.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={loadCropPerformanceData}
          startIcon={<Refresh />}
        >
          Refresh Data
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Crop Performance Analytics
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {crops.length} total crops • {harvestedCrops} harvested • {activeCrops} active
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={loadCropPerformanceData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Download />}
            onClick={() => alert('Export functionality coming soon')}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Performance Overview Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <PerformanceMetricCard
            title="Total Yield"
            value={totalYield}
            unit="units"
            icon={<LocalFlorist />}
            color="success"
            subText={`Across ${crops.length} crops`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PerformanceMetricCard
            title="Total Investment"
            value={totalExpenses}
            unit="Rs"
            icon={<MoneyOff />}
            color="warning"
            subText={`Avg: Rs ${Math.round(totalExpenses / crops.length).toLocaleString()}/crop`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PerformanceMetricCard
            title="Net Profit"
            value={totalProfit}
            unit="Rs"
            icon={<TrendingUp />}
            color={totalProfit >= 0 ? 'success' : 'error'}
            subText={`${crops.filter(c => c.profit && c.profit > 0).length} profitable crops`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <PerformanceMetricCard
            title="Yield Efficiency"
            value={avgYieldPerArea.toFixed(1)}
            unit={`/${crops[0]?.areaUnit || 'unit'}`}
            icon={<ShowChart />}
            color="info"
            subText="Average yield per area unit"
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Crops</MenuItem>
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="harvested">Harvested/Sold</MenuItem>
                  <MenuItem value="PLANTED">Planted</MenuItem>
                  <MenuItem value="GROWING">Growing</MenuItem>
                  <MenuItem value="HARVESTED">Harvested</MenuItem>
                  <MenuItem value="SOLD">Sold</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="yield">Yield (High to Low)</MenuItem>
                  <MenuItem value="cost">Cost (High to Low)</MenuItem>
                  <MenuItem value="profit">Profit (High to Low)</MenuItem>
                  <MenuItem value="roi">ROI (High to Low)</MenuItem>
                  <MenuItem value="area">Area (High to Low)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="list">Detailed View</ToggleButton>
                  <ToggleButton value="comparison">Comparison</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'list' ? (
        <Grid container spacing={3}>
          {/* Crop Selector */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Select Crop
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {sortedCrops.map((crop) => (
                    <Card
                      key={crop.id}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        borderColor: selectedCropId === crop.id ? 'primary.main' : 'divider',
                        backgroundColor: selectedCropId === crop.id ? 'primary.50' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => setSelectedCropId(crop.id)}
                    >
                      <CardContent sx={{ py: 1, px: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {crop.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {crop.type}
                            </Typography>
                          </Box>
                          <Chip
                            label={crop.status}
                            size="small"
                            color={
                              crop.status === 'SOLD' ? 'success' :
                              crop.status === 'HARVESTED' ? 'warning' :
                              crop.status === 'FAILED' ? 'error' : 'default'
                            }
                          />
                        </Box>
                        <Box display="flex" justifyContent="space-between" mt={0.5}>
                          <Typography variant="caption">
                            {crop.yield} {crop.yieldUnit}
                          </Typography>
                          <Typography variant="caption" color="error">
                            Rs {crop.totalExpenses.toLocaleString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Details */}
          <Grid item xs={12} md={8}>
            {selectedCrop ? (
              <PerformanceView crop={selectedCrop} />
            ) : (
              <Card>
                <CardContent>
                  <Typography textAlign="center" color="text.secondary" py={4}>
                    Select a crop to view performance details
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {/* Comparison Controls */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="subtitle1">Compare by:</Typography>
                  <ToggleButtonGroup
                    value={comparisonMetric}
                    exclusive
                    onChange={(_, newMetric) => newMetric && setComparisonMetric(newMetric)}
                    size="small"
                  >
                    <ToggleButton value="yield">Yield</ToggleButton>
                    <ToggleButton value="cost">Cost</ToggleButton>
                    <ToggleButton value="profit">Profit</ToggleButton>
                    <ToggleButton value="roi">ROI</ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title="Comparison shows relative performance across selected crops">
                    <IconButton size="small">
                      <Info fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Comparison Chart */}
          <Grid item xs={12}>
            <ComparisonChart 
              crops={sortedCrops.slice(0, 10)} // Show top 10 for clarity
              metric={comparisonMetric}
            />
          </Grid>

          {/* Comparison Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Performance Summary
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Crop</TableCell>
                        <TableCell align="right">Yield</TableCell>
                        <TableCell align="right">Area</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">Profit</TableCell>
                        <TableCell align="right">ROI</TableCell>
                        <TableCell align="right">Cost/Unit</TableCell>
                        <TableCell align="right">Yield/Area</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedCrops.map((crop) => (
                        <TableRow key={crop.id}>
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
                            {crop.yield} {crop.yieldUnit}
                          </TableCell>
                          <TableCell align="right">
                            {crop.area} {crop.areaUnit}
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error.main">
                              Rs {crop.totalExpenses.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={crop.profit && crop.profit >= 0 ? 'success.main' : 'error.main'}
                            >
                              {crop.profit ? `Rs ${crop.profit.toLocaleString()}` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {crop.roi !== undefined ? (
                              <Chip
                                label={`${crop.roi >= 0 ? '+' : ''}${crop.roi.toFixed(1)}%`}
                                color={crop.roi >= 0 ? 'success' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {crop.costPerUnit ? (
                              `Rs ${crop.costPerUnit.toFixed(2)}/${crop.yieldUnit}`
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {crop.yieldPerArea ? (
                              `${crop.yieldPerArea.toFixed(1)}/${crop.areaUnit}`
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Insights */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Top Performers
              </Typography>
              {sortedCrops.slice(0, 3).map((crop, index) => (
                <Box key={crop.id} display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    color={index === 0 ? 'success' : index === 1 ? 'warning' : 'info'}
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2">
                    {crop.name} - {crop.yield} {crop.yieldUnit} 
                    {crop.profit && ` • Rs ${crop.profit.toLocaleString()} profit`}
                  </Typography>
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Key Metrics
              </Typography>
              <Typography variant="body2">
                • Average cost per crop: Rs {Math.round(totalExpenses / crops.length).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                • Harvest rate: {Math.round((harvestedCrops / crops.length) * 100)}% of crops
              </Typography>
              <Typography variant="body2">
                • Profit margin: {totalExpenses > 0 ? Math.round((totalProfit / totalExpenses) * 100) : 0}%
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};