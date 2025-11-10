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
      console.log('🔄 Loading crop details for ID:', id);
      const response = await cropApi.getById(parseInt(id));
      console.log('✅ Crop details loaded:', response.data);
      setCrop(response.data);
    } catch (err) {
      console.error('❌ Failed to load crop:', err);
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

  // Debug: Log the crop data to see what's missing
  console.log('📊 Current crop data:', crop);
  console.log('🔍 Crop areaUnit:', crop.areaUnit);
  console.log('🔍 Crop yieldUnit:', crop.yieldUnit);

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
            <Tab label="Growth Timeline" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Basic Information</Typography>
                <Typography><strong>Type:</strong> {crop.type || 'Not specified'}</Typography>
                <Typography><strong>Variety:</strong> {crop.variety || 'Not specified'}</Typography>
                <Typography><strong>Field Location:</strong> {crop.fieldLocation || 'Not specified'}</Typography>
              </CardContent>
            </Card>

            <Card>
  <CardContent>
    <Typography variant="h6" gutterBottom>Area & Yield</Typography>
    <Typography><strong>Area:</strong> {crop.area || 0} {getAreaUnit(crop)}</Typography>
    <Typography><strong>Expected Yield:</strong> {crop.expectedYield || 0} {getYieldUnit(crop)}</Typography>
    
    {/* ADD THESE NEW LINES FOR ACTUAL YIELD */}
    {crop.actualYield && (
      <Typography><strong>Actual Yield:</strong> {crop.actualYield} {getYieldUnit(crop)}</Typography>
    )}
    {crop.actualHarvestDate && (
      <Typography><strong>Actual Harvest Date:</strong> {new Date(crop.actualHarvestDate).toLocaleDateString()}</Typography>
    )}
    
    <Typography><strong>Total Expenses:</strong> ${(crop.totalExpenses || 0).toLocaleString()}</Typography>
  </CardContent>
</Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Dates</Typography>
                <Typography><strong>Planted:</strong> {crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : 'Not set'}</Typography>
                <Typography><strong>Expected Harvest:</strong> {crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toLocaleDateString() : 'Not set'}</Typography>
              </CardContent>
            </Card>

            {crop.notes && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography>{crop.notes}</Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* Expenses Tab */}
        <TabPanel value={tabValue} index={1}>
          <ExpenseManager 
            cropId={crop.id} 
            cropName={crop.name || 'Unnamed Crop'}
            onExpensesUpdated={loadCrop}
          />
        </TabPanel>

        {/* Growth Timeline Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Growth Timeline
          </Typography>
          <Typography color="text.secondary">
            Growth timeline feature will be implemented here.
          </Typography>
          {/* You can add a timeline component here later */}
        </TabPanel>
      </Card>
    </Box>
  );
};