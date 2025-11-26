import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, 
  Tabs, Tab, Paper, Chip, Alert, CircularProgress, Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AttachMoney as MoneyIcon,
  Pets as AnimalsIcon,
  Groups as FlockIcon,
  Add as AddIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import { livestockApi, flockApi } from '../services/api';
import { salesApi, SaleRecord } from '../services/salesApi';
import { SaleRecordDialog } from './SaleRecordDialog';
import { SalesHistory } from './SalesHistory';

interface SalesStats {
  totalRevenue: number;
  totalSales: number;
  averageSalePrice: number;
  animalsSold: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChange: number;
}

export const SalesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageSalePrice: 0,
    animalsSold: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueChange: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSalesData();
  }, []);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const salesResponse = await salesApi.getAll();
      const salesData = salesResponse.data || [];
      
      setSales(salesData);
      calculateStats(salesData);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load sales data';
      setError(errorMessage);
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: SaleRecord[]) => {
    try {
      const totalRevenue = salesData.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
      const animalSales = salesData.filter(sale => sale.sale_type === 'animal');
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const thisMonthSales = salesData.filter(sale => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === thisMonth && 
               saleDate.getFullYear() === thisYear;
      });
      
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
      
      const lastMonthSales = salesData.filter(sale => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate.getMonth() === lastMonth && 
               saleDate.getFullYear() === lastMonthYear;
      });

      const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
      const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0);
      
      const revenueChange = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      setStats({
        totalRevenue,
        totalSales: salesData.length,
        averageSalePrice: animalSales.length > 0 ? totalRevenue / animalSales.length : 0,
        animalsSold: animalSales.length,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueChange
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  const handleSaleRecorded = () => {
    setSaleDialogOpen(false);
    setSuccessMessage('Sale recorded successfully!');
    loadSalesData();
  };

  const handleDeleteSale = async (saleId: number) => {
    try {
      await salesApi.delete(saleId);
      setSuccessMessage('Sale deleted successfully!');
      loadSalesData();
    } catch (err: any) {
      setError('Failed to delete sale: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Sales Management
          </Typography>
          <Typography color="text.secondary">
            Manage animal sales, track revenue, and analyze performance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSaleDialogOpen(true)}
          size="large"
        >
          Record Sale
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <MoneyIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₨{stats.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color={stats.revenueChange >= 0 ? 'success.main' : 'error.main'}>
                    {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange).toFixed(1)}% from last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AnimalsIcon color="secondary" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Animals Sold
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.animalsSold}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendIcon color="success" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Avg Sale Price
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₨{stats.averageSalePrice.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <FlockIcon color="info" />
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Sales
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalSales}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }} elevation={1}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Sales History" />
          <Tab label="Quick Sale" />
          <Tab label="Bulk Sales" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <SalesHistory 
          sales={sales} 
          onRefresh={loadSalesData}
          onDeleteSale={handleDeleteSale}
        />
      )}
      {activeTab === 1 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Quick Sale Feature
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Record individual animal sales quickly
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSaleDialogOpen(true)}
          >
            Record Quick Sale
          </Button>
        </Box>
      )}
      {activeTab === 2 && (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bulk Sales Feature
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Sell multiple animals or entire flocks at once
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FlockIcon />}
            onClick={() => {
              setSaleDialogOpen(true);
              // You can pass a prop to SaleRecordDialog to start in bulk mode
            }}
          >
            Start Bulk Sale
          </Button>
        </Box>
      )}

      {/* Sale Dialog */}
      <SaleRecordDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
        onSaleRecorded={handleSaleRecorded}
      />

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};