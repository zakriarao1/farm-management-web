// frontend/src/livestock/components/LivestockExpenseReports.tsx

import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Alert,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { financialSummaryApi, flockApi } from '../../services/api';
import { FlockFinancialSummary, Flock } from '../types';
import Grid from '@mui/material/Grid';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const LivestockExpenseReports: React.FC = () => {
  const [flockSummary, setFlockSummary] = useState<FlockFinancialSummary[]>([]);
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
      const [summaryResponse, flocksResponse] = await Promise.all([
        financialSummaryApi.getFlockSummary(selectedFlock === 'all' ? undefined : selectedFlock),
        flockApi.getAll()
      ]);
      setFlockSummary(summaryResponse.data || []);
      setFlocks(flocksResponse.data || []);
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fix: Properly type and calculate totalMetrics with safe number conversion
  const totalMetrics = React.useMemo(() => {
    const initialMetrics = {
      totalPurchase: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfit: 0
    };

    if (!flockSummary || flockSummary.length === 0) {
      return initialMetrics;
    }

    return flockSummary.reduce((acc, flock) => {
      // Safely convert all values to numbers
      const purchaseCost = Number(flock.total_purchase_cost) || 0;
      const saleRevenue = Number(flock.total_sale_revenue) || 0;
      const productionRevenue = Number(flock.total_production_revenue) || 0;
      const expenses = Number(flock.total_expenses) || 0;
      const medicalCosts = Number(flock.total_medical_costs) || 0;
      const netProfit = Number(flock.net_profit_loss) || 0;

      return {
        totalPurchase: acc.totalPurchase + purchaseCost,
        totalRevenue: acc.totalRevenue + saleRevenue + productionRevenue,
        totalExpenses: acc.totalExpenses + expenses + medicalCosts,
        totalProfit: acc.totalProfit + netProfit
      };
    }, initialMetrics);
  }, [flockSummary]);

  const getProfitLossColor = (profitLoss: number) => {
    if (profitLoss > 0) return 'success';
    if (profitLoss < 0) return 'error';
    return 'default';
  };

  // Fix: Updated to use Pakistani Rupee (Rs) sign
  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Rs 0.00';
    }
    return `Rs ${value.toFixed(2)}`;
  };

  // Fix: Prepare chart data safely
  const chartData = React.useMemo(() => {
    if (!flockSummary || flockSummary.length === 0) {
      return [];
    }

    return flockSummary.map(flock => ({
      name: flock.flock_name || 'Unknown Flock',
      purchaseCost: Number(flock.total_purchase_cost) || 0,
      saleRevenue: Number(flock.total_sale_revenue) || 0,
      expenses: (Number(flock.total_expenses) || 0) + (Number(flock.total_medical_costs) || 0),
      netProfit: Number(flock.net_profit_loss) || 0
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
<Grid size={{ xs: 12, md: 3}}>
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

<Grid size={{ xs: 12, md: 3}}>
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

<Grid size={{ xs: 12, md: 3}}>
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

<Grid size={{ xs: 12, md: 3}}>
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
<Grid size={{ xs: 12}}>
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
<Grid size={{ xs: 12}}>
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
                        <TableCell align="right">Production Revenue</TableCell>
                        <TableCell align="right">Total Expenses</TableCell>
                        <TableCell align="right">Net Profit/Loss</TableCell>
                        <TableCell align="right">ROI</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {flockSummary.map((flock) => {
                        // Safely calculate values for each row
                        const purchaseCost = Number(flock.total_purchase_cost) || 0;
                        const saleRevenue = Number(flock.total_sale_revenue) || 0;
                        const productionRevenue = Number(flock.total_production_revenue) || 0;
                        const expenses = (Number(flock.total_expenses) || 0) + (Number(flock.total_medical_costs) || 0);
                        const netProfit = Number(flock.net_profit_loss) || 0;
                        const roi = purchaseCost > 0 ? (netProfit / purchaseCost) * 100 : 0;

                        return (
                          <TableRow key={flock.flock_id}>
                            <TableCell component="th" scope="row">
                              <Typography fontWeight="bold">
                                {flock.flock_name || 'Unknown Flock'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {flock.active_animals || 0} active, {flock.sold_animals || 0} sold
                              </Typography>
                            </TableCell>
                            <TableCell align="right">{flock.total_animals || 0}</TableCell>
                            <TableCell align="right">
                              <Typography color="primary">
                                {formatCurrency(purchaseCost)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="success.main">
                                {formatCurrency(saleRevenue)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="success.main">
                                {formatCurrency(productionRevenue)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="error.main">
                                {formatCurrency(expenses)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={formatCurrency(netProfit)}
                                color={getProfitLossColor(netProfit)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography 
                                color={getProfitLossColor(netProfit)}
                                fontWeight="bold"
                              >
                                {purchaseCost > 0 ? `${roi.toFixed(1)}%` : 'N/A'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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