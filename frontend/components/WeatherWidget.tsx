// frontend/components/WeatherWidget.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Button,
} from '@mui/material';
import {
  WbSunny as SunnyIcon,
  Cloud as CloudIcon,
  Umbrella as RainIcon,
  AcUnit as SnowIcon,
  Whatshot as HotIcon,
  WbTwilight as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { weatherApi } from '../src/services/api';
import type { WeatherData, WeatherRecommendation } from '../src/types';

const getDefaultWeatherData = (): WeatherData => ({
  temperature: 0,
  condition: 'Unknown',
  humidity: 0,
  precipitation: 0,
  windSpeed: 0,
  forecast: []
});

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData>(getDefaultWeatherData());
  const [recommendations, setRecommendations] = useState<WeatherRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Default coordinates for New York
  const defaultLat = 40.7128;
  const defaultLon = -74.0060;

  const getWeatherIcon = (condition: string | undefined | null) => {
    if (!condition || condition === 'undefined' || condition === 'null') {
      return <ClearIcon />;
    }
    
    try {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return <SunnyIcon color="warning" />;
      if (conditionLower.includes('cloud')) return <CloudIcon color="info" />;
      if (conditionLower.includes('rain')) return <RainIcon color="primary" />;
      if (conditionLower.includes('snow')) return <SnowIcon color="info" />;
      if (conditionLower.includes('hot') || conditionLower.includes('warm')) return <HotIcon color="error" />;
      return <ClearIcon />;
    } catch (err) {
      console.error('Error in getWeatherIcon:', err);
      return <ClearIcon />;
    }
  };

  const loadWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🌤️ Fetching weather data for:', defaultLat, defaultLon);
      
      const response = await weatherApi.getForecast(defaultLat, defaultLon);
      console.log('📦 Weather API Response:', response);
      
      if (response && response.data) {
        const weatherData = response.data;
        console.log('🔍 Weather condition:', weatherData.condition);
        
        const safeWeatherData: WeatherData = {
          temperature: typeof weatherData.temperature === 'number' ? weatherData.temperature : 0,
          condition: weatherData.condition && typeof weatherData.condition === 'string' ? weatherData.condition : 'Unknown',
          humidity: typeof weatherData.humidity === 'number' ? weatherData.humidity : 0,
          precipitation: typeof weatherData.precipitation === 'number' ? weatherData.precipitation : 0,
          windSpeed: typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : 0,
          forecast: Array.isArray(weatherData.forecast) ? weatherData.forecast : []
        };
        
        setWeather(safeWeatherData);
        
        // Get recommendations
        try {
          const recResponse = await weatherApi.getRecommendations(defaultLat, defaultLon, 'general');
          setRecommendations(recResponse?.data?.recommendations || []);
        } catch (recError) {
          console.warn('Could not load recommendations:', recError);
          setRecommendations([]);
        }
        
      } else {
        throw new Error('No weather data received from API');
      }
      
    } catch (error) {
      console.error('❌ Failed to load weather data:', error);
      
      // Provide more specific error messages with proper type checking
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('Latitude and longitude are required')) {
        setError('Weather service requires location coordinates. Using demo data.');
      } else if (errorMessage.includes('404')) {
        setError('Weather service unavailable. Using demo data.');
      } else {
        setError('Failed to load weather data. Using demo data.');
      }
      
      // Set fallback demo data
      setWeather({
        temperature: 22,
        condition: 'Sunny',
        humidity: 65,
        precipitation: 0,
        windSpeed: 12,
        forecast: [
          { date: new Date().toISOString().split('T')[0]!, maxTemp: 25, minTemp: 15, precipitation: 0, condition: 'Sunny' },
          { date: new Date(Date.now() + 86400000).toISOString().split('T')[0]!, maxTemp: 26, minTemp: 16, precipitation: 2, condition: 'Rain' }
        ]
      });
      setRecommendations([
        { type: 'IRRIGATION', message: 'Demo: Good weather for farming activities', priority: 'LOW' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [defaultLat, defaultLon]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  const getRecommendationColor = (priority: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'info';
    }
  };

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°C`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography ml={2}>Loading weather...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }} 
          action={
            <Button color="inherit" size="small" onClick={loadWeatherData}>
              <RefreshIcon sx={{ mr: 1 }} />
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Weather Overview
            </Typography>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={loadWeatherData}
              size="small"
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Box>
            {/* Current Weather */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ fontSize: 48, mr: 2 }}>
                {getWeatherIcon(weather.condition)}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  {formatTemperature(weather.temperature)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {weather.condition}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Humidity: ${weather.humidity}%`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Wind: ${weather.windSpeed} km/h`} 
                    size="small" 
                    variant="outlined"
                  />
                  {weather.precipitation > 0 && (
                    <Chip 
                      label={`Rain: ${weather.precipitation}mm`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Forecast */}
            {weather.forecast && weather.forecast.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  {weather.forecast.length}-Day Forecast
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, 
                  gap: 1 
                }}>
                  {weather.forecast.slice(0, 5).map((day, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                      <Typography variant="caption" display="block">
                        {day.date ? new Date(day.date).toLocaleDateString('en', { weekday: 'short' }) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatTemperature(day.maxTemp || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTemperature(day.minTemp || 0)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {(day.precipitation || 0) > 0 ? `${day.precipitation}mm` : 'Dry'}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Farming Recommendations
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recommendations.map((rec, index) => (
                    <Alert 
                      key={index}
                      severity={getRecommendationColor(rec.priority)}
                      sx={{ py: 0, '& .MuiAlert-message': { py: 1 } }}
                    >
                      <Typography variant="body2">
                        {rec.message}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary">
              Location: {defaultLat.toFixed(4)}, {defaultLon.toFixed(4)}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
