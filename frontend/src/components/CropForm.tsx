// frontend/src/components/CropForm.tsx

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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { cropApi } from '../services/api';
import type { CreateCropRequest } from '../types';

// Crop data with names, types, and varieties
const CROP_DATA = {
  wheat: {
    types: ['Spring Wheat', 'Winter Wheat', 'Durum Wheat'],
    varieties: ['Hard Red Winter', 'Soft Red Winter', 'Hard White', 'Soft White', 'Durum']
  },
  rice: {
    types: ['Basmati Rice', 'Jasmine Rice', 'Brown Rice', 'White Rice'],
    varieties: ['Long Grain', 'Medium Grain', 'Short Grain', 'Aromatic', 'Sticky']
  },
  corn: {
    types: ['Sweet Corn', 'Field Corn', 'Popcorn'],
    varieties: ['Yellow Dent', 'White Dent', 'Flint Corn', 'Flour Corn', 'Sweet Corn']
  },
  cotton: {
    types: ['Upland Cotton', 'Pima Cotton'],
    varieties: ['American Upland', 'Egyptian Cotton', 'Supima', 'Organic Cotton']
  },
  sugarcane: {
    types: ['Chewing Cane', 'Crystal Cane', 'Syrup Cane'],
    varieties: ['Noble Cane', 'Commercial Hybrids', 'Traditional Varieties']
  },
  potato: {
    types: ['Russet Potato', 'Red Potato', 'Sweet Potato'],
    varieties: ['Russet Burbank', 'Yukon Gold', 'Red Norland', 'Kenbec', 'Purple Majesty']
  },
  tomato: {
    types: ['Cherry Tomato', 'Beefsteak Tomato', 'Roma Tomato'],
    varieties: ['Heirloom', 'Hybrid', 'Grape Tomato', 'Plum Tomato', 'Campari']
  },
  onion: {
    types: ['Yellow Onion', 'Red Onion', 'White Onion', 'Sweet Onion'],
    varieties: ['Vidalia', 'Walla Walla', 'Texas Sweet', 'Spanish Yellow', 'Red Burgundy']
  }
};

export const CropForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateCropRequest & {
    actualHarvestDate?: string;
    actualYield?: number;
  }>({
    name: '',
    type: '',
    variety: '',
    plantingDate: new Date().toISOString().split('T')[0]!,
    expectedHarvestDate: '',
    area: 0,
    areaUnit: 'ACRES',
    expectedYield: 0,
    yieldUnit: 'TONS',
    marketPrice: 0,
    totalExpenses: 0,
    status: 'PLANNED',
    fieldLocation: '',
    notes: '',
    actualHarvestDate: '',
    actualYield: 0,
  });

  const isMarketPriceRequired = formData.status === 'SOLD';
  const showActualYieldFields = formData.status === 'HARVESTED' || formData.status === 'SOLD';

  // Reset dependent fields when crop name changes
  useEffect(() => {
    if (formData.name) {
      setFormData(prev => ({
        ...prev,
        type: '', // Reset type
        variety: '' // Reset variety
      }));
    }
  }, [formData.name]);

  // Reset variety when crop type changes
  useEffect(() => {
    if (formData.type) {
      setFormData(prev => ({
        ...prev,
        variety: '' // Reset variety when type changes
      }));
    }
  }, [formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('area') || 
               name.includes('Yield') || 
               name.includes('Price') || 
               name.includes('Expenses') 
        ? parseFloat(value) || 0  // Use parseFloat for decimal values
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create submission data without the UI-only fields
      const submissionData: CreateCropRequest = {
        name: formData.name,
        type: formData.type,
        variety: formData.variety,
        plantingDate: formData.plantingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        area: formData.area,
        areaUnit: formData.areaUnit,
        expectedYield: formData.expectedYield,
        yieldUnit: formData.yieldUnit,
        marketPrice: formData.status === 'SOLD' ? formData.marketPrice : 0,
        totalExpenses: 0, // Expenses will be added separately
        status: formData.status,
        fieldLocation: formData.fieldLocation,
        notes: formData.notes,
      };
      
      await cropApi.create(submissionData);
      navigate('/crops');
    } catch (err: unknown) {
      console.error('Failed to create crop:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create crop');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCropTypes = () => {
    if (!formData.name) return [];
    const crop = CROP_DATA[formData.name as keyof typeof CROP_DATA];
    return crop ? crop.types : [];
  };

  const getCropVarieties = () => {
    if (!formData.name || !formData.type) return [];
    const crop = CROP_DATA[formData.name as keyof typeof CROP_DATA];
    return crop ? crop.varieties : [];
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          Add New Crop
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
                  value={formData.name}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="">Select Crop</MenuItem>
                  {Object.keys(CROP_DATA).map(crop => (
                    <MenuItem key={crop} value={crop}>
                      {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Crop Type *"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  select
                  required
                  disabled={!formData.name}
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
                  value={formData.variety}
                  onChange={handleChange}
                  select
                  required
                  disabled={!formData.type}
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
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  select
                  fullWidth
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
                  value={formData.plantingDate}
                  onChange={handleChange}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Expected Harvest Date"
                  name="expectedHarvestDate"
                  type="date"
                  value={formData.expectedHarvestDate}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
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
                      InputLabelProps={{
                        shrink: true,
                      }}
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
                        step: "1"
                      }}
                      helperText="Enter the actual yield after harvest"
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
                  value={formData.area}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1"
                  }}
                  required
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Area Unit *"
                  name="areaUnit"
                  value={formData.areaUnit}
                  onChange={handleChange}
                  select
                  fullWidth
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
                  value={formData.expectedYield}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1"
                  }}
                  required
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Yield Unit *"
                  name="yieldUnit"
                  value={formData.yieldUnit}
                  onChange={handleChange}
                  select
                  fullWidth
                  required
                >
                  <MenuItem value="TONS">Tons</MenuItem>
                  <MenuItem value="KILOGRAMS">Kilograms</MenuItem>
                  <MenuItem value="POUNDS">Pounds</MenuItem>
                  <MenuItem value="BUSHELS">Bushels</MenuItem>
                  <MenuItem value="MONS">Mons</MenuItem>
                </TextField>
              </Box>

              {/* Market Price - Only show and require when status is SOLD */}
              {formData.status === 'SOLD' && (
                <>
                  <Typography variant="h6" gutterBottom color="primary">
                    Sales Information
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Market Price per Unit ($) *"
                      name="marketPrice"
                      type="number"
                      value={formData.marketPrice}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "1"
                      }}
                      required={isMarketPriceRequired}
                      helperText={isMarketPriceRequired ? "Required when status is Sold" : "Optional"}
                    />
                  </Box>
                </>
              )}

              {/* Additional Information */}
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                Additional Information
              </Typography>
              
              <TextField
                label="Field Location"
                name="fieldLocation"
                value={formData.fieldLocation}
                onChange={handleChange}
                placeholder="e.g., North Field, Plot A"
              />

              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Any additional notes about this crop..."
              />

              {/* Submit Buttons */}
              <Box display="flex" gap={2} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Creating Crop...' : 'Create Crop'}
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

export default CropForm;