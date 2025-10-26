// frontend/src/components/CropLlist.tsx

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
import { cropApi } from '../src/services/api';
import type { Crop, CropStatus, StatusCounts } from '../src/types';

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
      setCrops(response.data || []);
    } catch (error) {
      console.error('Failed to load crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCrops();
      return;
    }

    try {
      const response = await cropApi.search(searchQuery);
      setCrops(response.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to client-side search if API fails
      const filtered = crops.filter(crop => 
        crop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setCrops(filtered);
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

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         crop.type?.toLowerCase().includes(searchQuery.toLowerCase());
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
              placeholder="Search crops by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
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
              Clear
            </Button>
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Crops Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)' 
        },
        gap: 3 
      }}>
        {filteredCrops.map((crop) => (
          <Card 
            key={crop.id}
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

              <Typography color="text.secondary" gutterBottom component="div">
                {crop.type || 'No type'}
                {crop.variety && ` • ${crop.variety}`}
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom component="div">
                  <strong>Planted:</strong> {crop.plantingDate ? new Date(crop.plantingDate).toLocaleDateString() : 'Not set'}
                </Typography>
                <Typography variant="body2" gutterBottom component="div">
                  <strong>Area:</strong> {crop.area || 0} {getAreaUnit(crop)}
                </Typography>
                <Typography variant="body2" gutterBottom component="div">
                  <strong>Expected Yield:</strong> {crop.expectedYield || 0} {getYieldUnit(crop)}
                </Typography>
                <Typography variant="body2" gutterBottom component="div">
                  <strong>Expenses:</strong> ${(crop.totalExpenses || 0).toLocaleString()}
                </Typography>
                {(crop.marketPrice || 0) > 0 && (
                  <Typography variant="body2" gutterBottom component="div">
                    <strong>Market Price:</strong> ${crop.marketPrice}/unit
                  </Typography>
                )}
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
        ))}
      </Box>

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