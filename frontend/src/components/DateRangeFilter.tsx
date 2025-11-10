// frontend/src/components/DateRangeFilter.tsx
import React from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface DateRangeFilterProps {
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange }) => {
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [preset, setPreset] = React.useState<string>('');

  const presets = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 3 months', value: '3m' },
    { label: 'Last 6 months', value: '6m' },
    { label: 'Year to date', value: 'ytd' },
    { label: 'Last year', value: 'ly' },
  ];

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();
    let start = new Date();

    switch (value) {
      case '7d':
        start.setDate(today.getDate() - 7);
        break;
      case '30d':
        start.setDate(today.getDate() - 30);
        break;
      case '3m':
        start.setMonth(today.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(today.getMonth() - 6);
        break;
      case 'ytd':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'ly':
        start = new Date(today.getFullYear() - 1, 0, 1);
        setEndDate(new Date(today.getFullYear() - 1, 11, 31));
        break;
      default:
        return;
    }

    if (value !== 'ly') {
      setEndDate(today);
    }
    setStartDate(start);
  };

  const handleApply = () => {
    onDateRangeChange(startDate, endDate);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setPreset('');
    onDateRangeChange(null, null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Date Range Filter
          </Typography>
          
          <Box display="flex" gap={2} sx={{ flexWrap: 'wrap', mb: 2 }}>
            <TextField
              select
              label="Quick Presets"
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">Custom Range</MenuItem>
              {presets.map((preset) => (
                <MenuItem key={preset.value} value={preset.value}>
                  {preset.label}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />

            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
            />
          </Box>

          <Box display="flex" gap={1}>
            <Button 
              variant="contained" 
              onClick={handleApply}
              disabled={!startDate || !endDate}
            >
              Apply Filter
            </Button>
            <Button variant="outlined" onClick={handleClear}>
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};