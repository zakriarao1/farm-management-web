// src/components/CropList.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Grid,
  ChipProps,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { cropApi } from '../services/api';
import type { Crop, CropStatus, StatusCounts } from '../types';

const transformCropData = (crops: any[]): Crop[] => {
  console.log('🔄 Transforming crops data:', crops);
  
  return crops.map(crop => {
    console.log('📊 Raw crop data:', crop);
    
    // Debug: Show all available properties
    console.log('🔍 Available crop properties:', Object.keys(crop));
    
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
  });
};
export const CropList: React.FC = () => {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CropStatus | 'ALL'>('ALL');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
  try {
    setLoading(true);
    const response = await cropApi.getAll();
    const transformedCrops = transformCropData(response.data || []);
    setCrops(transformedCrops);
  } catch (error) {
    console.error('Failed to load crops:', error);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this crop?')) {
      return;
    }

    try {
      await cropApi.delete(id);
      setCrops(crops.filter(crop => crop.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete crop');
    }
  };

  // Safe helper functions
  const getAreaUnit = (crop: Crop): string => {
    if (!crop.areaUnit) return 'units';
    if (typeof crop.areaUnit === 'string') {
      // Convert to readable format
      const unitMap: { [key: string]: string } = {
        'ACRES': 'acres',
        'HECTARES': 'hectares',
        'SQUARE_METERS': 'sq m',
        'MARLA': 'marla',
        'KANAL': 'kanal'
      };
      return unitMap[crop.areaUnit] || crop.areaUnit.toLowerCase();
    }
    return String(crop.areaUnit).toLowerCase();
  };

  const getYieldUnit = (crop: Crop): string => {
    if (!crop.yieldUnit) return 'units';
    if (typeof crop.yieldUnit === 'string') {
      // Convert to readable format
      const unitMap: { [key: string]: string } = {
        'TONS': 'tons',
        'KILOGRAMS': 'kg',
        'POUNDS': 'lbs',
        'BUSHELS': 'bushels',
        'MONS': 'mons'
      };
      return unitMap[crop.yieldUnit] || crop.yieldUnit.toLowerCase();
    }
    return String(crop.yieldUnit).toLowerCase();
  };

  const getStatusColor = (status: string): ChipProps['color'] => {
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Not set';
    try {
      // Handle both ISO string and date object
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

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || crop.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts: StatusCounts = crops.reduce((acc: StatusCounts, crop) => {
    if (crop.status) {
      acc[crop.status] = (acc[crop.status] || 0) + 1;
    }
    return acc;
  }, {} as StatusCounts);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" component="div">
          Crop Management
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

      {/* Search and Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: 1, minWidth: 200 }}
              placeholder="Search crops by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              variant="outlined"
            >
              Status: {statusFilter === 'ALL' ? 'All' : statusFilter.replace('_', ' ')}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
            >
              <MenuItem onClick={() => { setStatusFilter('ALL'); setFilterAnchor(null); }}>
                All ({crops.length})
              </MenuItem>
              {Object.entries(statusCounts).map(([status, count]) => (
                <MenuItem
                  key={status}
                  onClick={() => { setStatusFilter(status as CropStatus); setFilterAnchor(null); }}
                >
                  {status.replace('_', ' ')} ({count})
                </MenuItem>
              ))}
            </Menu>
            <Button variant="outlined" onClick={loadCrops}>
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Crops Grid */}
      <Grid container spacing={3}>
        {filteredCrops.map((crop) => (
          <Grid item xs={12} sm={6} md={4} key={crop.id}>
            <Card 
              sx={{ 
                height: '100%',
                transition: '0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="div" fontWeight="bold">
                    {crop.name || 'Unnamed Crop'}
                  </Typography>
                  <Chip
                    label={crop.status?.replace('_', ' ') || 'Unknown'}
                    color={getStatusColor(crop.status || '')}
                    size="small"
                  />
                </Box>

                {/* Crop Details */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Area: {crop.area || 0} {getAreaUnit(crop)}
                  {crop.yield > 0 && ` • Yield: ${crop.yield} ${getYieldUnit(crop)}`}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom component="div">
                    <strong>Planted:</strong> {formatDate(crop.plantingDate)}
                  </Typography>
                  {crop.harvestDate && (
                    <Typography variant="body2" gutterBottom component="div">
                      <strong>Harvested:</strong> {formatDate(crop.harvestDate)}
                    </Typography>
                  )}
                  <Typography variant="body2" gutterBottom component="div">
                    <strong>Expenses:</strong> Rs {(crop.totalExpenses || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between" mt={3}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/crops/${crop.id}`)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/crops/${crop.id}/edit`)}
                    color="secondary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(crop.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCrops.length === 0 && (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary" py={4} component="div">
              {crops.length === 0 
                ? "No crops found. Add your first crop to get started!"
                : "No crops match your search criteria."
              }
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CropList;