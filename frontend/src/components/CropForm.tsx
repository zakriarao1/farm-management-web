// frontend/src/components/CropForm.tsx

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { cropApi } from '../services/api';
import type { CreateCropRequest } from '../types';

// Crop data with names only
const CROP_NAMES = [
  'Wheat',
  'Rice', 
  'Corn',
  'Cotton',
  'Sugarcane',
  'Potato',
  'Tomato',
  'Onion',
  'Barley',
  'Soybean',
  'Sunflower',
  'Canola',
  'Alfalfa',
  'Oats',
  'Millet',
  'Sorghum',
  'Peanuts',
  'Chickpeas',
  'Lentils',
  'Beans'
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

export const CropForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateCropRequest & {
    harvestDate?: string;
    yield?: number;
    marketPrice?: number;
  }>({
    name: '',
    plantingDate: new Date().toISOString().split('T')[0]!,
    area: 0,
    areaUnit: 'ACRES',
    yieldUnit: 'TONS',
    marketPrice: 0,
    totalExpenses: 0, // Will be calculated from expenses after creation
    status: 'PLANNED',
    notes: '',
    harvestDate: '',
    yield: 0,
  });

  const showYieldFields = formData.status === 'HARVESTED' || formData.status === 'SOLD';
  const showFinancialFields = formData.status === 'SOLD';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
    setLoading(true);
    setError('');

    try {
      // Create submission data - totalExpenses will be 0 initially
      const submissionData: CreateCropRequest = {
        name: formData.name,
        plantingDate: formData.plantingDate,
        area: formData.area,
        areaUnit: formData.areaUnit,
        yieldUnit: formData.yieldUnit,
        marketPrice: formData.marketPrice,
        totalExpenses: 0, // Always 0 for new crops
        status: formData.status,
        notes: formData.notes,
        // Only include harvest data if harvested/sold
        ...(showYieldFields && {
          harvestDate: formData.harvestDate,
          yield: formData.yield,
        }),
        // Reset financial fields if not sold
        ...(formData.status !== 'SOLD' && {
          marketPrice: 0,
        }),
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
                  {CROP_NAMES.map(crop => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  select
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
                  InputLabelProps={{
                    shrink: true,
                  }}
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
                      value={formData.harvestDate || ''}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Yield"
                      name="yield"
                      type="number"
                      value={formData.yield || 0}
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
                      Financial Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Market Price (PKR)"
                      name="marketPrice"
                      type="number"
                      value={formData.marketPrice || 0}
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
                      value={0}
                      disabled
                      helperText="Will be calculated from expenses"
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
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CropForm;