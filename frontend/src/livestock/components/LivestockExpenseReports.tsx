// frontend/src/livestock/components/LivestockExpenseReports.tsx

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { financialSummaryApi, flockApi } from '../services/api';
import { Flock } from '../types';

// Define the interface locally if not in types.ts
interface FlockFinancialData {
  id: number;
  name: string;
  animal_type: string;
  total_animals: number;
  active_animals: number;
  sold_animals: number;
  deceased_animals: number;
  livestock_investment: number;
  sales_revenue: number;
  total_expenses: number;
  net_profit: number;
  roi_percentage: number;
}

// Type guard to check if data matches our expected structure
function isFlockFinancialData(data: any): data is FlockFinancialData {
  return (
    data &&
    typeof data.id === 'number' &&
    typeof data.name === 'string' &&
    'livestock_investment' in data
  );
}

// Helper function to transform API response to our expected format
function transformFinancialData(apiData: any[]): FlockFinancialData[] {
  if (!apiData || !Array.isArray(apiData)) {
    return [];
  }

  return apiData.map(item => ({
    id: item.id || 0,
    name: item.name || 'Unknown Flock',
    animal_type: item.animal_type || 'Unknown Type',
    total_animals: Number(item.total_animals) || 0,
    active_animals: Number(item.active_animals) || 0,
    sold_animals: Number(item.sold_animals) || 0,
    deceased_animals: Number(item.deceased_animals) || 0,
    livestock_investment: Number(item.livestock_investment) || 0,
    sales_revenue: Number(item.sales_revenue) || 0,
    total_expenses: Number(item.total_expenses) || 0,
    net_profit: Number(item.net_profit) || 0,
    roi_percentage: Number(item.roi_percentage) || 0
  }));
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const LivestockExpenseReports: React.FC = () => {
  const [flockSummary, setFlockSummary] = useState<FlockFinancialData[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [selectedFlock, setSelectedFlock] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedFlock]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Loading financial data...');
      
      const [summaryResponse, flocksResponse] = await Promise.all([
        financialSummaryApi.getFlockSummary(selectedFlock === 'all' ? undefined : selectedFlock),
        flockApi.getAll()
      ]);
      
      console.log('📊 Raw API response:', summaryResponse);
      
      // Transform the API data to match our expected structure
      const financialData = transformFinancialData(summaryResponse.data);
      setFlockSummary(financialData);
      setFlocks(flocksResponse.data || []);
      
      console.log('✅ Processed financial data:', financialData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports';
      setError(errorMessage);
      console.error('❌ Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total metrics
  const totalMetrics = React.useMemo(() => {
    if (!flockSummary || flockSummary.length === 0) {
      return {
        totalPurchase: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0
      };
    }

    return flockSummary.reduce((acc, flock) => {
      const purchaseCost = flock.livestock_investment;
      const saleRevenue = flock.sales_revenue;
      const expenses = flock.total_expenses;
      const netProfit = flock.net_profit;

      return {
        totalPurchase: acc.totalPurchase + purchaseCost,
        totalRevenue: acc.totalRevenue + saleRevenue,
        totalExpenses: acc.totalExpenses + expenses,
        totalProfit: acc.totalProfit + netProfit
      };
    }, {
      totalPurchase: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfit: 0
    });
  }, [flockSummary]);

  const getProfitLossColor = (profitLoss: number) => {
    if (profitLoss > 0) return 'success';
    if (profitLoss < 0) return 'error';
    return 'default';
  };

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Rs 0.00';
    }
    return `Rs ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!flockSummary || flockSummary.length === 0) {
      return [];
    }

    return flockSummary.map(flock => ({
      name: flock.name,
      purchaseCost: flock.livestock_investment,
      saleRevenue: flock.sales_revenue,
      expenses: flock.total_expenses,
      netProfit: flock.net_profit
    }));
  }, [flockSummary]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Livestock Financial Reports
        </Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Flock</InputLabel>
          <Select
            value={selectedFlock}
            label="Filter by Flock"
            onChange={(e) => setSelectedFlock(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All Flocks</MenuItem>
            {flocks.map((flock) => (
              <MenuItem key={flock.id} value={flock.id}>
                {flock.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {flockSummary.length === 0 && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No financial data available for the selected period.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Investment
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {formatCurrency(totalMetrics.totalPurchase)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {formatCurrency(totalMetrics.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" component="div" color="error.main">
                {formatCurrency(totalMetrics.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Profit/Loss
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={getProfitLossColor(totalMetrics.totalProfit)}
              >
                {formatCurrency(totalMetrics.totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Flock Performance Chart */}
        {chartData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Flock Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Amount']} 
                    />
                    <Legend />
                    <Bar dataKey="purchaseCost" fill="#8884d8" name="Purchase Cost" />
                    <Bar dataKey="saleRevenue" fill="#82ca9d" name="Sale Revenue" />
                    <Bar dataKey="expenses" fill="#ff8042" name="Expenses" />
                    <Bar dataKey="netProfit" fill="#ffc658" name="Net Profit/Loss" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Flock Financial Summary Table */}
        {flockSummary.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Flock Financial Summary
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Flock Name</TableCell>
                        <TableCell align="right">Animals</TableCell>
                        <TableCell align="right">Purchase Cost</TableCell>
                        <TableCell align="right">Sale Revenue</TableCell>
                        <TableCell align="right">Total Expenses</TableCell>
                        <TableCell align="right">Net Profit/Loss</TableCell>
                        <TableCell align="right">ROI</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flockSummary.map((flock) => (
                        <TableRow key={flock.id}>
                          <TableCell component="th" scope="row">
                            <Typography fontWeight="bold">
                              {flock.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {flock.active_animals} active, {flock.sold_animals} sold
                              {flock.animal_type && ` • ${flock.animal_type}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{flock.total_animals}</TableCell>
                          <TableCell align="right">
                            <Typography color="primary">
                              {formatCurrency(flock.livestock_investment)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="success.main">
                              {formatCurrency(flock.sales_revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error.main">
                              {formatCurrency(flock.total_expenses)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={formatCurrency(flock.net_profit)}
                              color={getProfitLossColor(flock.net_profit)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={getProfitLossColor(flock.net_profit)}
                              fontWeight="bold"
                            >
                              {flock.roi_percentage !== 0 ? `${flock.roi_percentage}%` : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};