import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Alert,
  MenuItem, FormControl, InputLabel, Select, Tab, Tabs,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Add, Pets } from '@mui/icons-material';
import { livestockApi, flockApi, financialSummaryApi } from '../../services/api';
import { 
  Livestock, 
  Flock, 
  AnimalFinancialSummary, 
  LivestockGender, 
  LivestockStatus,
  CreateLivestockRequest, 
  UpdateLivestockRequest,
  LivestockType
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

// Define form data type that matches your API types
interface LivestockFormData {
  tagId: string;
  type: LivestockType;
  breed: string;
  gender: LivestockGender;
  dateOfBirth?: string;
  purchaseDate: string;
  purchasePrice: number;
  weight: number;
  status: LivestockStatus;
  location: string;
  notes?: string;
  // Add flock_id for API submission
  flock_id?: number;
}

interface SaleFormData {
  sale_price: number;
  sale_date: string;
  sale_reason?: string;
}

export const LivestockManagement: React.FC = () => {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [animalFinancials, setAnimalFinancials] = useState<AnimalFinancialSummary[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Livestock | null>(null);
  const [sellingAnimal, setSellingAnimal] = useState<Livestock | null>(null);
  const [formData, setFormData] = useState<LivestockFormData>({
    tagId: '',
    type: 'CATTLE',
    breed: '',
    gender: 'MALE',
    dateOfBirth: '',
    purchaseDate: new Date().toISOString().split('T')[0]!,
    purchasePrice: 0,
    weight: 0,
    status: 'active',
    location: '',
    notes: '',
    flock_id: undefined
  });
  const [saleFormData, setSaleFormData] = useState<SaleFormData>({
    sale_price: 0,
    sale_date: new Date().toISOString().split('T')[0]!,
    sale_reason: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    try {
      const [livestockResponse, flocksResponse, financialResponse] = await Promise.all([
        livestockApi.getAll(),
        flockApi.getAll(),
        tabValue === 1 ? financialSummaryApi.getAnimalSummary() : Promise.resolve({ data: [] })
      ]);
      setLivestock(livestockResponse.data || []);
      setFlocks(flocksResponse.data || []);
      setAnimalFinancials(financialResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    }
  };

  const resetForm = () => {
    setFormData({
      tagId: '',
      type: 'CATTLE',
      breed: '',
      gender: 'MALE',
      dateOfBirth: '',
      purchaseDate: new Date().toISOString().split('T')[0]!,
      purchasePrice: 0,
      weight: 0,
      status: 'active',
      location: '',
      notes: '',
      flock_id: undefined
    });
    setEditingAnimal(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare the data with proper typing for API
      const submitData: CreateLivestockRequest | UpdateLivestockRequest = {
        tagId: formData.tagId,
        type: formData.type,
        breed: formData.breed,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice,
        weight: formData.weight,
        status: formData.status,
        location: formData.location,
        notes: formData.notes || undefined
      };

      // Add flock_id if selected
      if (formData.flock_id) {
        (submitData as any).flock_id = formData.flock_id;
      }

      if (editingAnimal) {
        await livestockApi.update(editingAnimal.id, submitData as UpdateLivestockRequest);
      } else {
        await livestockApi.create(submitData as CreateLivestockRequest);
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving animal:', error);
      setError('Failed to save animal');
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingAnimal) return;
    
    try {
      const saleData = {
        sale_price: saleFormData.sale_price,
        sale_date: saleFormData.sale_date,
        sale_reason: saleFormData.sale_reason || undefined
      };

      await livestockApi.recordSale(sellingAnimal.id, saleData);
      setSaleDialogOpen(false);
      setSellingAnimal(null);
      setSaleFormData({
        sale_price: 0,
        sale_date: new Date().toISOString().split('T')[0]!,
        sale_reason: ''
      });
      loadData();
    } catch (error) {
      console.error('Error recording sale:', error);
      setError('Failed to record sale');
    }
  };

  const getProfitLossColor = (profitLoss: number) => {
    if (profitLoss > 0) return 'success';
    if (profitLoss < 0) return 'error';
    return 'default';
  };

  // Type-safe comparison functions using enum values
  const isGender = (value: LivestockGender, compare: LivestockGender): boolean => {
    return value === compare;
  };

  const isStatus = (value: LivestockStatus, compare: LivestockStatus): boolean => {
    return value === compare;
  };

  // Helper functions for form handling
  const handleNumberInputChange = (field: keyof LivestockFormData, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleStringInputChange = (field: keyof LivestockFormData, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === 'gender' ? value as LivestockGender : 
                field === 'status' ? value as LivestockStatus :
                field === 'type' ? value as LivestockType : 
                value 
    }));
  };

  // Edit animal handler
  const handleEditAnimal = (animal: Livestock) => {
    setEditingAnimal(animal);
    setFormData({
      tagId: animal.tagId,
      type: animal.type,
      breed: animal.breed,
      gender: animal.gender,
      dateOfBirth: animal.dateOfBirth || '',
      purchaseDate: animal.purchaseDate,
      purchasePrice: animal.purchasePrice,
      weight: animal.weight,
      status: animal.status,
      location: animal.location,
      notes: animal.notes || '',
      flock_id: (animal as any).flock_id // Handle flock_id if it exists
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <Pets sx={{ mr: 1, verticalAlign: 'middle' }} />
          Livestock Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Add Animal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Animals" />
            <Tab label="Financial Summary" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tag ID</TableCell>
                    <TableCell>Species/Breed</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Purchase Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {livestock.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell>
                        <Typography fontWeight="bold">{animal.tagId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{animal.type}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {animal.breed}
                        </Typography>
                      </TableCell>
                      <TableCell>{animal.type}</TableCell>
                      <TableCell>
                        <Chip 
                          label={animal.gender} 
                          size="small" 
                          color={isGender(animal.gender, 'FEMALE') ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        {animal.purchasePrice ? `$${animal.purchasePrice.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={animal.status} 
                          size="small"
                          color={
                            isStatus(animal.status, 'active') ? 'success' :
                            isStatus(animal.status, 'sold') ? 'primary' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditAnimal(animal)}
                          >
                            Edit
                          </Button>
                          {isStatus(animal.status, 'active') && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => {
                                setSellingAnimal(animal);
                                setSaleDialogOpen(true);
                              }}
                            >
                              Record Sale
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Animal ID</TableCell>
                    <TableCell>Purchase Price</TableCell>
                    <TableCell>Sale Price</TableCell>
                    <TableCell>Total Expenses</TableCell>
                    <TableCell>Net Profit/Loss</TableCell>
                    <TableCell>ROI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {animalFinancials.map((financial) => (
                    <TableRow key={financial.animal_id}>
                      <TableCell>
                        <Typography fontWeight="bold">{financial.animal_identifier}</Typography>
                        <Chip 
                          label={financial.status} 
                          size="small"
                          color={isStatus(financial.status as LivestockStatus, 'active') ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>${financial.purchase_cost.toFixed(2)}</TableCell>
                      <TableCell>${financial.total_revenue.toFixed(2)}</TableCell>
                      <TableCell>${financial.total_expenses.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={`$${financial.net_profit.toFixed(2)}`}
                          color={getProfitLossColor(financial.net_profit)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          color={getProfitLossColor(financial.net_profit)}
                          fontWeight="bold"
                        >
                          {financial.purchase_cost > 0 
                            ? `${((financial.net_profit / financial.purchase_cost) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Add/Edit Animal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Tag ID"
                  value={formData.tagId}
                  onChange={(e) => handleStringInputChange('tagId', e.target.value)}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    label="Type"
                    onChange={(e) => handleStringInputChange('type', e.target.value)}
                  >
                    <MenuItem value="CATTLE">Cattle</MenuItem>
                    <MenuItem value="POULTRY">Poultry</MenuItem>
                    <MenuItem value="SHEEP">Sheep</MenuItem>
                    <MenuItem value="GOATS">Goats</MenuItem>
                    <MenuItem value="FISH">Fish</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Breed"
                  value={formData.breed}
                  onChange={(e) => handleStringInputChange('breed', e.target.value)}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.gender}
                    label="Gender"
                    onChange={(e) => handleStringInputChange('gender', e.target.value)}
                  >
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="CASTRATED">Castrated</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => handleStringInputChange('status', e.target.value)}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="sick">Sick</MenuItem>
                    <MenuItem value="pregnant">Pregnant</MenuItem>
                    <MenuItem value="calving">Calving</MenuItem>
                    <MenuItem value="milking">Milking</MenuItem>
                    <MenuItem value="ready_for_sale">Ready for Sale</MenuItem>
                    <MenuItem value="sold">Sold</MenuItem>
                    <MenuItem value="deceased">Deceased</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Flock</InputLabel>
                  <Select
                    value={formData.flock_id || ''}
                    label="Flock"
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      flock_id: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                  >
                    <MenuItem value="">No Flock</MenuItem>
                    {flocks.map((flock) => (
                      <MenuItem key={flock.id} value={flock.id}>
                        {flock.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => handleNumberInputChange('purchasePrice', e.target.value)}
                  InputProps={{ startAdornment: '$' }}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleNumberInputChange('weight', e.target.value)}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleStringInputChange('purchaseDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleStringInputChange('dateOfBirth', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12, sm: 6}}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleStringInputChange('location', e.target.value)}
                  required
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => handleStringInputChange('notes', e.target.value)}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingAnimal ? 'Update' : 'Create'} Animal
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={saleDialogOpen} onClose={() => setSaleDialogOpen(false)}>
        <DialogTitle>Record Sale - {sellingAnimal?.tagId}</DialogTitle>
        <form onSubmit={handleSaleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
<Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Sale Price"
                  type="number"
                  value={saleFormData.sale_price}
                  onChange={(e) => setSaleFormData({ 
                    ...saleFormData, 
                    sale_price: parseFloat(e.target.value) || 0 
                  })}
                  required
                  InputProps={{ startAdornment: '$' }}
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Sale Date"
                  type="date"
                  value={saleFormData.sale_date}
                  onChange={(e) => setSaleFormData({ 
                    ...saleFormData, 
                    sale_date: e.target.value 
                  })}
                  required
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
<Grid size={{ xs: 12}}>
                <TextField
                  fullWidth
                  label="Sale Reason"
                  value={saleFormData.sale_reason}
                  onChange={(e) => setSaleFormData({ 
                    ...saleFormData, 
                    sale_reason: e.target.value 
                  })}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaleDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Record Sale
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};