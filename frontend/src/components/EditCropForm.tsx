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

// Crop data with proper typing
interface CropType {
  name: string;
}

const CROP_DATA: CropType[] = [
  { name: 'Wheat' },
  { name: 'Rice' },
  { name: 'Corn' },
  { name: 'Cotton' },
  { name: 'Sugarcane' },
  { name: 'Potato' },
  { name: 'Tomato' },
  { name: 'Onion' },
  { name: 'Barley' },
  { name: 'Soybean' },
  { name: 'Sunflower' },
  { name: 'Canola' },
  { name: 'Alfalfa' },
  { name: 'Oats' },
  { name: 'Millet' },
  { name: 'Sorghum' },
  { name: 'Peanuts' },
  { name: 'Chickpeas' },
  { name: 'Lentils' },
  { name: 'Beans' }
];

// Helper function to map backend snake_case to frontend camelCase
const mapBackendToFrontend = (crop: any): UpdateCropRequest => {
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  return {
    name: crop.name || '',
    type: crop.type || '',
    variety: crop.variety || '',
    plantingDate: formatDateForInput(crop.planting_date || crop.plantingDate || ''),
    expectedHarvestDate: formatDateForInput(crop.expected_harvest_date || crop.expectedHarvestDate || ''),
    actualHarvestDate: formatDateForInput(crop.actual_harvest_date || crop.actualHarvestDate || ''),
    area: crop.area || 0,
    areaUnit: (crop.area_unit || crop.areaUnit || 'ACRES') as AreaUnit,
    expectedYield: crop.expected_yield || crop.expectedYield || 0,
    actualYield: crop.actual_yield || crop.actualYield || 0,
    yieldUnit: (crop.yield_unit || crop.yieldUnit || 'TONS') as YieldUnit,
    marketPrice: crop.market_price || crop.marketPrice || 0,
    totalExpenses: crop.total_expenses || crop.totalExpenses || 0,
    status: (crop.status || 'PLANNED') as CropStatus,
    fieldLocation: crop.field_location || crop.fieldLocation || '',
    notes: crop.notes || '',
  };
};

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
    areaUnit: 'ACRES',
    expectedYield: 0,
    actualYield: 0,
    yieldUnit: 'TONS',
    marketPrice: 0,
    totalExpenses: 0,
    status: 'PLANNED',
    fieldLocation: '',
    notes: '',
  });

  const showActualYieldFields = formData.status === 'HARVESTED' || formData.status === 'SOLD';
  const showFinancialSection = formData.status === 'SOLD';

  // Load crop data when component mounts
  useEffect(() => {
    const loadCrop = async () => {
      if (!id) {
        setError('No crop ID provided');
        setLoadingCrop(false);
        return;
      }
      
      try {
        setLoadingCrop(true);
        setError('');
        
        const response = await cropApi.getById(parseInt(id));
        const crop = response.data;

        if (!crop) {
          throw new Error('No crop data received from server');
        }

        // Map backend data to frontend format
        const mappedData = mapBackendToFrontend(crop);
        
        // Load expenses for this crop to calculate total expenses
        try {
          const expensesResponse = await cropApi.getExpenses(parseInt(id));
          const expenses = expensesResponse.data || [];
          const totalExpenses = expenses.reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0);
          
          // Update the form data with calculated total expenses
          mappedData.totalExpenses = totalExpenses;
        } catch (expenseError) {
          console.warn('Could not load expenses, using existing total:', expenseError);
          // Keep the existing totalExpenses value if expenses can't be loaded
        }

        setFormData(mappedData);

      } catch (err) {
        console.error('Failed to load crop:', err);
        setError(err instanceof Error ? err.message : 'Failed to load crop data');
      } finally {
        setLoadingCrop(false);
      }
    };

    loadCrop();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Skip readonly fields (totalExpenses is readonly)
    if (name === 'totalExpenses') {
      return;
    }
    
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
        // Don't update totalExpenses as it's calculated from expenses
        totalExpenses: formData.totalExpenses,
        marketPrice: formData.status === 'SOLD' ? Math.floor(formData.marketPrice || 0) : 0,
      };

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

  // Get all available crop names for the dropdown
  const getAvailableCropNames = (): string[] => {
    return CROP_DATA.map(crop => crop.name);
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
                  value={formData.name}
                  onChange={handleChange}
                  select
                  required
                >
                  <MenuItem value="">Select Crop</MenuItem>
                  {getAvailableCropNames().map(cropName => (
                    <MenuItem key={cropName} value={cropName}>
                      {cropName}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Crop Type (Optional)"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="e.g., Spring Wheat, Basmati Rice"
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Variety (Optional)"
                  name="variety"
                  value={formData.variety}
                  onChange={handleChange}
                  placeholder="e.g., Hard Red Winter, Long Grain"
                  fullWidth
                />
                
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Status *"
                  name="status"
                  value={formData.status}
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
                  value={formData.plantingDate}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  sx={{ flex: '1 1 300px' }}
                  label="Expected Harvest Date"
                  name="expectedHarvestDate"
                  type="date"
                  value={formData.expectedHarvestDate}
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
                      value={formData.actualHarvestDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Actual Yield"
                      name="actualYield"
                      type="number"
                      value={formData.actualYield}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "1"
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
                  value={formData.area}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1"
                  }}
                  required
                  helperText="Whole number only"
                />
                <TextField
                  sx={{ flex: '1 1 200px' }}
                  label="Area Unit *"
                  name="areaUnit"
                  value={formData.areaUnit}
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
                  value={formData.expectedYield}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "1"
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
                  value={formData.yieldUnit}
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

              {/* Financial Information - Only shown when status is SOLD */}
              {showFinancialSection && (
                <>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                    Financial Information (PKR)
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Total Expenses (PKR)"
                      name="totalExpenses"
                      type="number"
                      value={formData.totalExpenses}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "1",
                        readOnly: true
                      }}
                      helperText="Auto-calculated from expenses section"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                    />
                    
                    <TextField
                      sx={{ flex: '1 1 300px' }}
                      label="Market Price per Unit (PKR) *"
                      name="marketPrice"
                      type="number"
                      value={formData.marketPrice}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "1"
                      }}
                      required
                      helperText="Enter market price when crop is sold"
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
                fullWidth
              />

              <TextField
                label="Notes"
                name="notes"
                value={formData.notes}
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