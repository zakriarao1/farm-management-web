import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Alert,
  FormControl, InputLabel, Select, Box, Typography,
  Stepper, Step, StepLabel, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { livestockApi, flockApi } from '../services/api';
import { salesApi } from '../services/salesApi';
import Grid from '@mui/material/Grid';

interface SaleRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSaleRecorded: () => void;
}

interface SaleItem {
  id: number;
  type: 'animal' | 'product';
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  livestockId?: number;
}

// Define proper sale data type that matches the API
interface SaleFormData {
  sale_date: string;
  customer_name: string;
  customer_contact: string;
  payment_method: string;
  notes: string;
}

export const SaleRecordDialog: React.FC<SaleRecordDialogProps> = ({
  open, onClose, onSaleRecorded
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [saleType, setSaleType] = useState<'individual' | 'bulk'>('individual');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleData, setSaleData] = useState<SaleFormData>({
    sale_date: new Date().toISOString().split('T')[0] || '',
    customer_name: '',
    customer_contact: '',
    payment_method: 'cash',
    notes: ''
  });
  const [livestock, setLivestock] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [selectedFlock, setSelectedFlock] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [livestockResponse, flocksResponse] = await Promise.all([
        livestockApi.getAll(),
        flockApi.getAll()
      ]);
      setLivestock(livestockResponse.data || []);
      setFlocks(flocksResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setSaleType('individual');
    setSaleItems([]);
    setSaleData({
      sale_date: new Date().toISOString().split('T')[0] || '',
      customer_name: '',
      customer_contact: '',
      payment_method: 'cash',
      notes: ''
    });
    setSelectedFlock('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addAnimalToSale = (animal: any) => {
    const newItem: SaleItem = {
      id: Date.now(),
      type: 'animal',
      description: `${animal.tag_number} - ${animal.breed} (${animal.animal_type})`,
      quantity: 1,
      unitPrice: 0,
      total: 0,
      livestockId: animal.id
    };
    setSaleItems([...saleItems, newItem]);
  };

  const addFlockToSale = () => {
    if (!selectedFlock) return;
    
    const flock = flocks.find(f => f.id === selectedFlock);
    const flockAnimals = livestock.filter(animal => 
      animal.flock_id === selectedFlock && 
      animal.status === 'HEALTHY' // Updated status
    );
    
    const flockItems: SaleItem[] = flockAnimals.map(animal => ({
      id: Date.now() + animal.id,
      type: 'animal',
      description: `${animal.tag_number} - ${animal.breed} (${animal.animal_type})`,
      quantity: 1,
      unitPrice: 0,
      total: 0,
      livestockId: animal.id
    }));
    
    setSaleItems([...saleItems, ...flockItems]);
    setSelectedFlock('');
  };

  const removeItem = (itemId: number) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId: number, field: keyof SaleItem, value: any) => {
    setSaleItems(saleItems.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (saleItems.length === 0) {
      setError('Please add at least one item to the sale');
      return;
    }

    if (!saleData.sale_date) {
      setError('Sale date is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Record each sale item
      for (const item of saleItems) {
        const saleRecordData = {
          livestock_id: item.livestockId,
          flock_id: undefined as number | undefined,
          sale_type: item.type,
          sale_date: saleData.sale_date,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_amount: item.total,
          customer_name: saleData.customer_name || undefined,
          customer_contact: saleData.customer_contact || undefined,
          payment_method: saleData.payment_method,
          notes: saleData.notes || undefined
        };

        await salesApi.recordSale(saleRecordData);
      }

      onSaleRecorded();
      handleClose();
    } catch (err) {
      setError('Failed to record sale. Please try again.');
      console.error('Error recording sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Select Animals', 'Set Prices', 'Customer Details'];
  const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);

  const handleSaleDataChange = (field: keyof SaleFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setSaleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Record New Sale
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sale Type</InputLabel>
                <Select
                  value={saleType}
                  label="Sale Type"
                  onChange={(e) => setSaleType(e.target.value as 'individual' | 'bulk')}
                >
                  <MenuItem value="individual">Individual Animals</MenuItem>
                  <MenuItem value="bulk">Bulk / Flock Sale</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {saleType === 'individual' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Select Animals</Typography>
                <Grid container spacing={1}>
                  {livestock
                    .filter(animal => animal.status === 'HEALTHY') // Updated status
                    .map(animal => (
                      <Grid item xs={12} sm={6} md={4} key={animal.id}>
                        <Card 
                          variant="outlined"
                          sx={{ 
                            cursor: 'pointer',
                            borderColor: saleItems.some(item => item.livestockId === animal.id) ? 'primary.main' : 'divider',
                            bgcolor: saleItems.some(item => item.livestockId === animal.id) ? 'primary.50' : 'background.paper'
                          }}
                          onClick={() => addAnimalToSale(animal)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {animal.tag_number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {animal.breed} • {animal.animal_type}
                            </Typography>
                            <Typography variant="caption">
                              Purchase: ₨{animal.purchase_price?.toLocaleString() || '0'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  }
                </Grid>
              </Grid>
            )}

            {saleType === 'bulk' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Select Flock</Typography>
                <Box display="flex" gap={2} alignItems="flex-start">
                  <FormControl fullWidth>
                    <InputLabel>Select Flock</InputLabel>
                    <Select
                      value={selectedFlock}
                      label="Select Flock"
                      onChange={(e) => setSelectedFlock(Number(e.target.value))}
                    >
                      {flocks.map(flock => (
                        <MenuItem key={flock.id} value={flock.id}>
                          {flock.name} - {livestock.filter(a => a.flock_id === flock.id && a.status === 'HEALTHY').length} animals
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={addFlockToSale}
                    disabled={!selectedFlock}
                  >
                    Add Flock
                  </Button>
                </Box>
              </Grid>
            )}

            {saleItems.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Selected Items ({saleItems.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {saleItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              size="small"
                              sx={{ width: 80 }}
                              inputProps={{ min: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                              size="small"
                              sx={{ width: 100 }}
                              InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography> }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            ₨{item.total.toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Typography variant="h6">
                    Total: ₨{totalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Set Sale Prices
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {saleItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            size="small"
                            sx={{ width: 100 }}
                            InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₨</Typography> }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          ₨{item.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Typography variant="h6" color="primary">
                  Grand Total: ₨{totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sale Date *"
                type="date"
                value={saleData.sale_date}
                onChange={handleSaleDataChange('sale_date')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method *</InputLabel>
                <Select
                  value={saleData.payment_method}
                  label="Payment Method *"
                  onChange={(e) => setSaleData({...saleData, payment_method: e.target.value})}
                  required
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="check">Check</MenuItem>
                  <MenuItem value="digital">Digital Payment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={saleData.customer_name}
                onChange={handleSaleDataChange('customer_name')}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Contact"
                value={saleData.customer_contact}
                onChange={handleSaleDataChange('customer_contact')}
                placeholder="Optional"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={saleData.notes}
                onChange={handleSaleDataChange('notes')}
                placeholder="Additional notes about the sale..."
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(activeStep - 1)} disabled={loading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={() => setActiveStep(activeStep + 1)}
            disabled={saleItems.length === 0}
          >
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading || saleItems.length === 0}
          >
            {loading ? 'Recording Sale...' : 'Complete Sale'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};