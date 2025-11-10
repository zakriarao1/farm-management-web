// frontend/src/components/EditCropForm.tsx 

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { cropApi } from '../services/api';
import type { UpdateCropRequest, AreaUnit, YieldUnit, CropStatus } from '../types';

// Extended Crop data with proper typing - using display names as values
const CROP_DATA = [
  {
    name: 'Wheat',
    types: ['Spring Wheat', 'Winter Wheat', 'Durum Wheat'],
    varieties: ['Hard Red Winter', 'Soft Red Winter', 'Hard White', 'Soft White', 'Durum']
  },
  {
    name: 'Rice',
    types: ['Basmati Rice', 'Jasmine Rice', 'Brown Rice', 'White Rice'],
    varieties: ['Long Grain', 'Medium Grain', 'Short Grain', 'Aromatic', 'Sticky']
  },
  {
    name: 'Corn',
    types: ['Sweet Corn', 'Field Corn', 'Popcorn'],
    varieties: ['Yellow Dent', 'White Dent', 'Flint Corn', 'Flour Corn', 'Sweet Corn']
  },
  {
    name: 'Cotton',
    types: ['Upland Cotton', 'Pima Cotton'],
    varieties: ['American Upland', 'Egyptian Cotton', 'Supima', 'Organic Cotton']
  },
  {
    name: 'Sugarcane',
    types: ['Chewing Cane', 'Crystal Cane', 'Syrup Cane'],
    varieties: ['Noble Cane', 'Commercial Hybrids', 'Traditional Varieties']
  },
  {
    name: 'Potato',
    types: ['Russet Potato', 'Red Potato', 'Sweet Potato'],
    varieties: ['Russet Burbank', 'Yukon Gold', 'Red Norland', 'Kenbec', 'Purple Majesty']
  },
  {
    name: 'Tomato',
    types: ['Cherry Tomato', 'Beefsteak Tomato', 'Roma Tomato'],
    varieties: ['Heirloom', 'Hybrid', 'Grape Tomato', 'Plum Tomato', 'Campari']
  },
  {
    name: 'Onion',
    types: ['Yellow Onion', 'Red Onion', 'White Onion', 'Sweet Onion'],
    varieties: ['Vidalia', 'Walla Walla', 'Texas Sweet', 'Spanish Yellow', 'Red Burgundy']
  }
] as const;

export const EditCropForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingCrop, setLoadingCrop] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<UpdateCropRequest>({
    name: '',
    type: '',
    variety: '',
    plantingDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    area: 0,
    areaUnit: 'ACRES' as AreaUnit,
    expectedYield: 0,
    actualYield: 0,
    yieldUnit: 'TONS' as YieldUnit,
    marketPrice: 0,
    totalExpenses: 0,
    status: 'PLANNED' as CropStatus,
    fieldLocation: '',
    notes: '',
  });

  const isMarketPriceRequired = formData.status === 'SOLD';
  const showActualYieldFields = formData.status === 'HARVESTED' || formData.status === 'SOLD';

  // Load crop data when component mounts
  useEffect(() => {
    const loadCrop = async () => {
      if (!id) return;
      
      try {
        setLoadingCrop(true);
        const response = await cropApi.getById(parseInt(id));
        const crop = response.data;
        
        console.log('Loaded crop data:', crop);

        // Format dates for date inputs (remove time part)
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          return dateString.split('T')[0];
        };

        setFormData({
          name: crop.name || '',
          type: crop.type || '',
          variety: crop.variety || '',
          plantingDate: formatDateForInput(crop.plantingDate),
          expectedHarvestDate: formatDateForInput(crop.expectedHarvestDate || ''),
          actualHarvestDate: formatDateForInput(crop.actualHarvestDate || ''),
          area: crop.area || 0,
          areaUnit: crop.areaUnit || 'ACRES',
          expectedYield: crop.expectedYield || 0,
          actualYield: crop.actualYield || 0,
          yieldUnit: crop.yieldUnit || 'TONS',
          marketPrice: crop.marketPrice || 0,
          totalExpenses: crop.totalExpenses || 0,
          status: crop.status || 'PLANNED',
          fieldLocation: crop.fieldLocation || '',
          notes: crop.notes || '',
        });

      } catch (err) {
        console.error('Failed to load crop:', err);
        setError('Failed to load crop data');
      } finally {
        setLoadingCrop(false);
      }
    };

    loadCrop();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to whole numbers
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('area') || 
               name.includes('Yield') || 
               name.includes('Price') || 
               name.includes('Expenses') 
        ? Math.floor(parseFloat(value) || 0) // Convert to whole number
        : value
    }));

    // Reset dependent fields when crop name changes
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        type: '',
        variety: ''
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        variety: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError('');

    try {
      // Format dates for API submission
      const formatDateForApi = (dateString: string) => {
        if (!dateString) return '';
        return `${dateString}T00:00:00.000Z`;
      };

      const submissionData: UpdateCropRequest = {
        ...formData,
        plantingDate: formatDateForApi(formData.plantingDate || ''),
        expectedHarvestDate: formData.expectedHarvestDate ? formatDateForApi(formData.expectedHarvestDate) : undefined,
        actualHarvestDate: formData.actualHarvestDate ? formatDateForApi(formData.actualHarvestDate) : undefined,
        // Ensure all numeric fields are whole numbers
        area: Math.floor(formData.area || 0),
        expectedYield: Math.floor(formData.expectedYield || 0),
        actualYield: Math.floor(formData.actualYield || 0),
        totalExpenses: Math.floor(formData.totalExpenses || 0),
        marketPrice: formData.status === 'SOLD' ? Math.floor(formData.marketPrice || 0) : 0,
      };

      console.log('Submitting data:', submissionData);

      await cropApi.update(parseInt(id), submissionData);
      navigate('/crops');
    } catch (err: unknown) {
      console.error('Failed to update crop:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update crop');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCropTypes = () => {
    if (!formData.name) return [];
    const crop = CROP_DATA.find(c => c.name === formData.name);
    return crop ? crop.types : [];
  };

  const getCropVarieties = () => {
    if (!formData.name || !formData.type) return [];
    const crop = CROP_DATA.find(c => c.name === formData.name);
    return crop ? crop.varieties : [];
  };

  if (loadingCrop) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading crop data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Edit Crop
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/crops')}
        >
          Back to Crops
        </Button>
      </Box>

      <Card>
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom color="primary">
                Basic Information
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Crop Name *"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  select
                  required
                  error={!formData.name}
                  helperText={!formData.name ? "Please select a crop" : ""}
                >
                  <MenuItem value="">Select Crop</MenuItem>
                  {CROP_DATA.map(crop => (
                    <MenuItem key={crop.name} value={crop.name}>
                      {crop.name}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Crop Type *"
                  name="type"
                  value={formData.type || ''}
                  onChange={handleChange}
                  select
                  required
                  disabled={!formData.name}
                  error={!formData.type}
                  helperText={!formData.type ? "Please select a type" : ""}
                >
                  <MenuItem value="">Select Type</MenuItem>
                  {getCropTypes().map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Variety *"
                  name="variety"
                  value={formData.variety || ''}
                  onChange={handleChange}
                  select
                  required
                  disabled={!formData.type}
                  error={!formData.variety}
                  helperText={!formData.variety ? "Please select a variety" : ""}
                >
                  <MenuItem value="">Select Variety</MenuItem>
                  {getCropVarieties().map(variety => (
                    <MenuItem key={variety} value={variety}>
                      {variety}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Status *"
                  name="status"
                  value={formData.status || 'PLANNED'}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="PLANNED">Planned</MenuItem>
                  <MenuItem value="PLANTED">Planted</MenuItem>
                  <MenuItem value="GROWING">Growing</MenuItem>
                  <MenuItem value="READY_FOR_HARVEST">Ready for Harvest</MenuItem>
                  <MenuItem value="HARVESTED">Harvested</MenuItem>
                  <MenuItem value="STOCKED">Stocked</MenuItem>
                  <MenuItem value="SOLD">Sold</MenuItem>
                  <MenuItem value="FAILED">Failed</MenuItem>
                </TextField>
              </Box>

              {/* Dates */}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Dates
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Planting Date *"
                  name="plantingDate"
                  type="date"
                  value={formData.plantingDate || ''}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Expected Harvest Date"
                  name="expectedHarvestDate"
                  type="date"
                  value={formData.expectedHarvestDate || ''}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Actual Yield Section (Only shown when harvested/sold) */}
              {showActualYieldFields && (
                <>
                  <Typography variant="h6" gutterBottom color="primary">
                    Harvest Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Actual Harvest Date"
                      name="actualHarvestDate"
                      type="date"
                      value={formData.actualHarvestDate || ''}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Actual Yield"
                      name="actualYield"
                      type="number"
                      value={formData.actualYield || 0}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "1" // Whole numbers only
                      }}
                      helperText="Enter the actual yield after harvest (whole number)"
                    />
                  </Box>
                </>
              )}

              {/* Area and Expected Yield */}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Area & Expected Yield
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Area *"
                  name="area"
                  type="number"
                  value={formData.area || 0}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1" // Whole numbers only
                  }}
                  required
                  helperText="Whole number only"
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Area Unit *"
                  name="areaUnit"
                  value={formData.areaUnit || 'ACRES'}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="ACRES">Acres</MenuItem>
                  <MenuItem value="HECTARES">Hectares</MenuItem>
                  <MenuItem value="SQUARE_METERS">Square Meters</MenuItem>
                  <MenuItem value="MARLA">Marla</MenuItem>
                  <MenuItem value="KANAL">Kanal</MenuItem>
                </TextField>
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Expected Yield *"
                  name="expectedYield"
                  type="number"
                  value={formData.expectedYield || 0}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1" // Whole numbers only
                  }}
                  required
                  helperText="Whole number only"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Yield Unit *"
                  name="yieldUnit"
                  value={formData.yieldUnit || 'TONS'}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="TONS">Tons</MenuItem>
                  <MenuItem value="KILOGRAMS">Kilograms</MenuItem>
                  <MenuItem value="POUNDS">Pounds</MenuItem>
                  <MenuItem value="BUSHELS">Bushels</MenuItem>
                  <MenuItem value="MONS">Mons</MenuItem>
                </TextField>
              </Box>

              {/* Financial Information */}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Financial Information (PKR)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Total Expenses (PKR)"
                  name="totalExpenses"
                  type="number"
                  value={formData.totalExpenses || 0}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1" // Whole numbers only
                  }}
                  helperText="Total expenses in PKR (whole number)"
                />
                
                {/* Market Price - Only show and require when status is SOLD */}
                {formData.status === 'SOLD' && (
                  <TextField
                    sx={{ flex: '1 1 300px' }}
                    label="Market Price per Unit (PKR) *"
                    name="marketPrice"
                    type="number"
                    value={formData.marketPrice || 0}
                    onChange={handleChange}
                    inputProps={{ 
                      min: "0",
                      step: "1" // Whole numbers only
                    }}
                    required={isMarketPriceRequired}
                    helperText={isMarketPriceRequired ? "Required when status is Sold (whole number)" : "Optional"}
                  />
                )}
              </Box>

              {/* Additional Information */}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Additional Information
              </Typography>
              
              <TextField
                label="Field Location"
                name="fieldLocation"
                value={formData.fieldLocation || ''}
                onChange={handleChange}
                placeholder="e.g., North Field, Plot A"
                fullWidth
              />

              <TextField
                label="Notes"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Any additional notes about this crop..."
                fullWidth
              />

              {/* Submit Buttons */}
              <Box display="flex" gap={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Updating Crop...' : 'Update Crop'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/crops')}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};