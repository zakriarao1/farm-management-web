// backend/src/routes/weather.ts

import express, { Router } from 'express';
const router = express.Router();

// GET /api/weather
router.get('/', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Fixed mock data that matches frontend types
    const mockWeatherData = {
      temperature: 22,
      condition: 'Clear',
      humidity: 65,
      precipitation: 0, // Added missing field
      windSpeed: 12,
      forecast: [
        { 
          date: new Date().toISOString().split('T')[0], 
          maxTemp: 25, 
          minTemp: 15, 
          precipitation: 0, 
          condition: 'Clear' 
        },
        { 
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          maxTemp: 26, 
          minTemp: 16, 
          precipitation: 2, 
          condition: 'Rain' 
        },
        { 
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0], 
          maxTemp: 24, 
          minTemp: 14, 
          precipitation: 0, 
          condition: 'Clouds' 
        },
        { 
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0], 
          maxTemp: 28, 
          minTemp: 18, 
          precipitation: 0, 
          condition: 'Clear' 
        },
        { 
          date: new Date(Date.now() + 345600000).toISOString().split('T')[0], 
          maxTemp: 23, 
          minTemp: 13, 
          precipitation: 5, 
          condition: 'Rain' 
        }
      ]
    };
    
    res.json({ 
      data: mockWeatherData, 
      message: 'Weather data retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// GET /api/weather/recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const { lat, lon, cropType } = req.query;
    
    // Mock recommendations based on crop type
    const recommendations = {
      recommendations: [
        'Ideal planting conditions detected',
        'Moderate watering recommended',
        'Watch for temperature fluctuations overnight'
      ],
      alerts: [],
      cropSpecificTips: `Best practices for ${cropType || 'your crops'}`
    };
    
    res.json({ 
      data: recommendations, 
      message: 'Weather recommendations generated' 
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate weather recommendations' });
  }
});

export default router;