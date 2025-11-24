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
  Grid,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { cropApi } from '../services/api';
import type { UpdateCropRequest, AreaUnit, CropStatus } from '../types';

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

// Area units
const AREA_UNITS = [
  'ACRES',
  'HECTARES',
  'SQUARE_METERS',
  'MARLA',
  'KANAL'
];

// Yield units
const YIELD_UNITS = [
  'TONS',
  'KILOGRAMS',
  'POUNDS',
  'BUSHELS',
  'MONS'
];

// Helper function to map backend snake_case to frontend camelCase
const mapBackendToFrontend = (crop: any): UpdateCropRequest => {
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  return {
    name: crop.name || '',
    plantingDate: formatDateForInput(crop.planting_date || crop.plantingDate || ''),
    harvestDate: formatDateForInput(crop.harvest_date || crop.harvestDate || ''),
    area: crop.area || 0,
    areaUnit: (crop.area_unit || crop.areaUnit || 'ACRES') as AreaUnit,
    yield: crop.yield || 0,
    yieldUnit: crop.yield_unit || crop.yieldUnit || 'TONS',
    marketPrice: crop.market_price || crop.marketPrice || 0,
    totalExpenses: crop.total_expenses || crop.totalExpenses || 0,
    status: (crop.status || 'PLANNED') as CropStatus,
    notes: crop.notes || '',
  };
};

export const EditCropForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingCrop, setLoadingCrop] = useState(true);
  const [error, setError] = useState('');
  const [calculatedTotalExpenses, setCalculatedTotalExpenses] = useState(0);

  const [formData, setFormData] = useState<UpdateCropRequest>({
    name: '',
    plantingDate: '',
    harvestDate: '',
    area: 0,
    areaUnit: 'ACRES',
    yield: 0,
    yieldUnit: 'TONS',
    marketPrice: 0,
    totalExpenses: 0,
    status: 'PLANNED',
    notes: '',
  });

  const showYieldFields = formData.status === 'HARVESTED' || formData.status === 'SOLD';
  const showFinancialFields = formData.status === 'SOLD';

  // Load crop data and expenses when component mounts
  useEffect(() => {
    const loadCropData = async () => {
      if (!id) {
        setError('No crop ID provided');
        setLoadingCrop(false);
        return;
      }
      
      try {
        setLoadingCrop(true);
        setError('');
        
        // Load crop data
        const response = await cropApi.getById(parseInt(id));
        const crop = response.data;

        if (!crop) {
          throw new Error('No crop data received from server');
        }

        // Map backend data to frontend format
        const mappedData = mapBackendToFrontend(crop);
        setFormData(mappedData);

        // Load expenses for this crop and calculate total
        try {
          const expensesResponse = await cropApi.getExpenses(parseInt(id));
          const expensesData = expensesResponse.data || [];
          
          // Calculate total expenses
          const total = expensesData.reduce((sum: number, expense: any) => 
            sum + (parseFloat(expense.amount) || 0), 0
          );
          setCalculatedTotalExpenses(total);

        } catch (expenseError) {
          console.warn('Could not load expenses:', expenseError);
          setCalculatedTotalExpenses(mappedData.totalExpenses || 0);
        }

      } catch (err) {
        console.error('Failed to load crop:', err);
        setError(err instanceof Error ? err.message : 'Failed to load crop data');
      } finally {
        setLoadingCrop(false);
      }
    };

    loadCropData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric fields to numbers
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('area') || 
               name.includes('yield') || 
               name.includes('marketPrice')
        ? parseFloat(value) || 0
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
        harvestDate: formData.harvestDate ? formatDateForApi(formData.harvestDate) : undefined,
        // Ensure all numeric fields are numbers
        area: formData.area || 0,
        yield: formData.yield || 0,
        marketPrice: formData.marketPrice || 0,
        // Use calculated total expenses from expenses table
        totalExpenses: calculatedTotalExpenses,
        // Reset financial fields if not sold
        ...(formData.status !== 'SOLD' && {
          marketPrice: 0,
        }),
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
            <Grid container spacing={3}>
              
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
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
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
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
              </Grid>

              {/* Dates */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Dates
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Planting Date *"
                  name="plantingDate"
                  type="date"
                  value={formData.plantingDate}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Area Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Area Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Area *"
                  name="area"
                  type="number"
                  value={formData.area}
                  onChange={handleChange}
                  inputProps={{ 
                    min: "0",
                    step: "0.01"
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Area Unit *"
                  name="areaUnit"
                  value={formData.areaUnit}
                  onChange={handleChange}
                  select
                  required
                >
                  {AREA_UNITS.map(unit => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Yield Section (Only shown when harvested/sold) */}
              {showYieldFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Harvest Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Harvest Date"
                      name="harvestDate"
                      type="date"
                      value={formData.harvestDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Yield"
                      name="yield"
                      type="number"
                      value={formData.yield}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "0.01"
                      }}
                      helperText="Enter the yield after harvest"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Yield Unit"
                      name="yieldUnit"
                      value={formData.yieldUnit}
                      onChange={handleChange}
                      select
                    >
                      {YIELD_UNITS.map(unit => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              {/* Financial Information (Only shown when sold) */}
              {showFinancialFields && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom color="primary">
                      Financial Information (PKR)
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Market Price (PKR)"
                      name="marketPrice"
                      type="number"
                      value={formData.marketPrice}
                      onChange={handleChange}
                      inputProps={{ 
                        min: "0",
                        step: "0.01"
                      }}
                      helperText="Price per unit when sold"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Total Expenses (PKR)"
                      name="totalExpenses"
                      type="number"
                      value={calculatedTotalExpenses}
                      disabled
                      helperText="Auto-calculated from expenses table"
                    />
                  </Grid>
                </>
              )}

              {/* Additional Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Additional Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="Any additional notes about this crop..."
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditCropForm;