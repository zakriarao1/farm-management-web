// frontend/src/components/CropDetails.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  Alert,
  Grid,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { cropApi } from '../services/api';
import { ExpenseManager } from './ExpenseManager';
import type { Crop } from '../types';

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
      id={`crop-tabpanel-${index}`}
      aria-labelledby={`crop-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};
const transformCropData = (crop: any): Crop => {
  console.log('📊 Raw crop details:', crop);
  
  // Extract total expenses - check multiple possible locations
  let totalExpenses = 0;
  
  if (crop.total_expenses !== undefined) {
    totalExpenses = Number(crop.total_expenses);
    console.log(`💰 Found total_expenses: ${crop.total_expenses} -> ${totalExpenses}`);
  } else if (crop.totalExpenses !== undefined) {
    totalExpenses = Number(crop.totalExpenses);
    console.log(`💰 Found totalExpenses: ${crop.totalExpenses} -> ${totalExpenses}`);
  } else if (crop.totalExpensesValue !== undefined) {
    totalExpenses = Number(crop.totalExpensesValue);
    console.log(`💰 Found totalExpensesValue: ${crop.totalExpensesValue} -> ${totalExpenses}`);
  } else {
    console.warn('⚠️ No total expenses found for crop:', crop.id, crop.name);
  }
  
  return {
    id: crop.id,
    name: crop.name || 'Unnamed Crop',
    plantingDate: crop.plantingDate || crop.planting_date || '',
    harvestDate: crop.harvestDate || crop.harvest_date,
    area: Number(crop.area || crop.area_value || 0),
    areaUnit: (crop.areaUnit || crop.area_unit || 'UNITS') as any,
    yield: Number(crop.yield || crop.yield_value || 0),
    yieldUnit: (crop.yieldUnit || crop.yield_unit || 'UNITS') as any,
    totalExpenses: totalExpenses, // Use the extracted value
    marketPrice: Number(crop.marketPrice || crop.market_price || 0),
    status: crop.status || 'PLANNED',
    notes: crop.notes,
  };
};
// Safe helper functions
const getAreaUnit = (crop: Crop): string => {
  if (!crop.areaUnit) return 'units';
  if (typeof crop.areaUnit === 'string') {
    return crop.areaUnit.toLowerCase();
  }
  return String(crop.areaUnit).toLowerCase();
};

const getYieldUnit = (crop: Crop): string => {
  if (!crop.yieldUnit) return 'units';
  if (typeof crop.yieldUnit === 'string') {
    return crop.yieldUnit.toLowerCase();
  }
  return String(crop.yieldUnit).toLowerCase();
};

const getStatusText = (status: string): string => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
};

const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  const colors = {
    PLANNED: 'default' as const,
    PLANTED: 'primary' as const,
    GROWING: 'info' as const,
    READY_FOR_HARVEST: 'warning' as const,
    HARVESTED: 'success' as const,
    STOCKED: 'secondary' as const,
    SOLD: 'success' as const,
    FAILED: 'error' as const,
  };
  return colors[status as keyof typeof colors] || 'default';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Not set';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

export const CropDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const loadCrop = useCallback(async () => {
  if (!id) return;
  
  try {
    setLoading(true);
    const response = await cropApi.getById(parseInt(id));
    const transformedCrop = transformCropData(response.data);
    setCrop(transformedCrop);
  } catch (err) {
    console.error('Failed to load crop:', err);
    setError('Failed to load crop details');
  } finally {
    setLoading(false);
  }
}, [id]);

  useEffect(() => {
    loadCrop();
  }, [loadCrop]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography>Loading crop details...</Typography>
      </Box>
    );
  }

  if (error || !crop) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Crop not found'}</Alert>
        <Button onClick={() => navigate('/crops')} sx={{ mt: 2 }}>
          Back to Crops
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/crops')}
          >
            Back to Crops
          </Button>
          <Typography variant="h4" component="div" fontWeight="bold">
            {crop.name || 'Unnamed Crop'}
          </Typography>
          <Chip
            label={getStatusText(crop.status)}
            color={getStatusColor(crop.status)}
          />
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate(`/crops/${id}/edit`)}
        >
          Edit Crop
        </Button>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Expenses" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> {getStatusText(crop.status)}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Planted:</strong> {formatDate(crop.plantingDate)}
                  </Typography>
                  {crop.harvestDate && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Harvested:</strong> {formatDate(crop.harvestDate)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Area & Yield Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Area & Yield
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Area:</strong> {crop.area || 0} {getAreaUnit(crop)}
                  </Typography>
                  {crop.yield > 0 && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Yield:</strong> {crop.yield} {getYieldUnit(crop)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Financial Information */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Financial Information
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Total Expenses:</strong> Rs {(crop.totalExpenses || 0).toLocaleString()}
                  </Typography>
                  {crop.marketPrice > 0 && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Market Price:</strong> Rs {crop.marketPrice}/unit
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Notes */}
            {crop.notes && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Notes
                    </Typography>
                    <Typography variant="body2">
                      {crop.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Expenses Tab */}
        <TabPanel value={tabValue} index={1}>
          <ExpenseManager 
            cropId={crop.id} 
            cropName={crop.name || 'Unnamed Crop'}
            onExpensesUpdated={loadCrop}
          />
        </TabPanel>
      </Card>
    </Box>
  );
};