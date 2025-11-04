// frontend/src/livestock/components/SalesRecordingForm.tsx

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Alert
} from '@mui/material';
import { salesApi } from '../services/api';
import Grid from '@mui/material/Grid';

interface SalesRecordingFormProps {
  open: boolean;
  onClose: () => void;
  onSaleRecorded: () => void;
  livestock?: any[];
  flocks?: any[];
}

export const SalesRecordingForm: React.FC<SalesRecordingFormProps> = ({
  open, onClose, onSaleRecorded, livestock, flocks
}) => {
  const [formData, setFormData] = useState({
    sale_type: 'animal' as 'animal' | 'product' | 'other',
    livestock_id: undefined as number | undefined,
    flock_id: undefined as number | undefined,
    sale_date: new Date().toISOString().split('T')[0],
    description: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    customer_name: '',
    customer_contact: '',
    payment_method: 'cash' as string,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update total amount when quantity or unit price changes
  React.useEffect(() => {
    const total = formData.quantity * formData.unit_price;
    setFormData(prev => ({ ...prev, total_amount: total }));
  }, [formData.quantity, formData.unit_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.sale_date || !formData.description || !formData.quantity || !formData.unit_price || !formData.payment_method) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // For animal sales, validate that an animal is selected
    if (formData.sale_type === 'animal' && !formData.livestock_id) {
      setError('Please select an animal for animal sales');
      setLoading(false);
      return;
    }

    try {
      // Prepare the data in the exact format expected by the API
      const saleData = {
        sale_type: formData.sale_type,
        livestock_id: formData.livestock_id,
        flock_id: formData.flock_id,
        sale_date: formData.sale_date,
        description: formData.description,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: formData.total_amount,
        customer_name: formData.customer_name || undefined,
        customer_contact: formData.customer_contact || undefined,
        payment_method: formData.payment_method,
        notes: formData.notes || undefined
      };

      await salesApi.recordSale(saleData);

      onSaleRecorded();
      onClose();
      
      // Reset form
      setFormData({
        sale_type: 'animal',
        livestock_id: undefined,
        flock_id: undefined,
        sale_date: new Date().toISOString().split('T')[0],
        description: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        customer_name: '',
        customer_contact: '',
        payment_method: 'cash',
        notes: ''
      });
    } catch (err) {
      setError('Failed to record sale. Please try again.');
      console.error('Error recording sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    
    if (field === 'livestock_id' || field === 'flock_id') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value ? parseInt(value) : undefined 
      }));
    } else if (field === 'quantity' || field === 'unit_price') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: parseFloat(value) || 0 
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Record Sale</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            {/* Sale Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Sale Type *"
                value={formData.sale_type}
                onChange={handleInputChange('sale_type')}
                required
              >
                <MenuItem value="animal">Animal Sale</MenuItem>
                <MenuItem value="product">Product Sale</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            
            {/* Sale Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sale Date *"
                type="date"
                value={formData.sale_date}
                onChange={handleInputChange('sale_date')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Animal Selection */}
            {formData.sale_type === 'animal' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Animal *"
                  value={formData.livestock_id || ''}
                  onChange={handleInputChange('livestock_id')}
                  required={formData.sale_type === 'animal'}
                >
                  <MenuItem value="">Select Animal</MenuItem>
                  {livestock?.map(animal => (
                    <MenuItem key={animal.id} value={animal.id}>
                      {animal.tag_id} - {animal.breed}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Flock Selection */}
            {formData.sale_type === 'product' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Select Flock"
                  value={formData.flock_id || ''}
                  onChange={handleInputChange('flock_id')}
                >
                  <MenuItem value="">Select Flock</MenuItem>
                  {flocks?.map(flock => (
                    <MenuItem key={flock.id} value={flock.id}>
                      {flock.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                value={formData.description}
                onChange={handleInputChange('description')}
                required
                placeholder="Describe the sale (e.g., 'Sale of breeding bull', 'Milk production sale')"
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity *"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                required
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Grid>

            {/* Unit Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit Price *"
                type="number"
                value={formData.unit_price}
                onChange={handleInputChange('unit_price')}
                InputProps={{ startAdornment: '$' }}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Total Amount */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount"
                value={formData.total_amount.toFixed(2)}
                InputProps={{ 
                  startAdornment: '$',
                  readOnly: true 
                }}
                variant="filled"
                helperText="Calculated automatically from quantity × unit price"
              />
            </Grid>

            {/* Customer Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.customer_name}
                onChange={handleInputChange('customer_name')}
                placeholder="Optional"
              />
            </Grid>

            {/* Customer Contact */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Contact"
                value={formData.customer_contact}
                onChange={handleInputChange('customer_contact')}
                placeholder="Optional"
              />
            </Grid>

            {/* Payment Method */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Payment Method *"
                value={formData.payment_method}
                onChange={handleInputChange('payment_method')}
                required
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="digital">Digital Payment</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Additional notes about the sale..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Recording...' : 'Record Sale'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};