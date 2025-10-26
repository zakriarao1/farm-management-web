// backend/src/controllers/WeatherController.ts

import { Request, Response } from 'express';
import { WeatherService } from '../services/WeatherService';

const weatherService = new WeatherService();

interface WeatherForCropsRequest {
  crops: Array<{
    cropId: string;
    cropName: string;
    lat: number;
    lon: number;
    cropType: string;
  }>;
}

export class WeatherController {
  async getWeatherData(req: Request, res: Response) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({ 
          error: 'Latitude and longitude are required',
          example: '/api/weather?lat=40.7128&lon=-74.0060'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude) || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        return res.status(400).json({ 
          error: 'Invalid coordinates provided',
          message: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }

      const [weatherData, alerts] = await Promise.all([
        weatherService.getWeatherForecast(latitude, longitude),
        weatherService.getWeatherAlerts(latitude, longitude)
      ]);

      return res.json({
        success: true,
        message: 'Weather data retrieved successfully',
        data: {
          coordinates: { lat: latitude, lon: longitude },
          current: weatherData,
          alerts,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ Get weather data error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch weather data',
        details: error.message 
      });
    }
  }

  async getWeatherRecommendations(req: Request, res: Response) {
    try {
      const { lat, lon, cropType } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({ 
          error: 'Latitude and longitude are required' 
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      const crop = cropType as string;

      const weatherData = await weatherService.getWeatherForecast(latitude, longitude);
      const recommendations = weatherService.generateRecommendations(weatherData, crop);

      return res.json({
        success: true,
        message: 'Weather recommendations generated successfully',
        data: {
          coordinates: { lat: latitude, lon: longitude },
          cropType: crop || 'General',
          recommendations,
          weather: weatherData,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('❌ Get weather recommendations error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to generate weather recommendations',
        details: error.message 
      });
    }
  }

  async getWeatherForCrops(req: Request<{}, {}, WeatherForCropsRequest>, res: Response) {
    try {
      const { crops } = req.body;

      if (!crops || !Array.isArray(crops) || crops.length === 0) {
        return res.status(400).json({ 
          error: 'Crops array with coordinates is required',
          message: 'Please provide an array of crops with lat, lon, and cropType'
        });
      }

      // Validate each crop object
      for (const crop of crops) {
        if (!crop.cropId || !crop.cropName || !crop.cropType || 
            typeof crop.lat !== 'number' || typeof crop.lon !== 'number') {
          return res.status(400).json({
            error: 'Invalid crop data',
            message: 'Each crop must have cropId, cropName, cropType, lat, and lon properties'
          });
        }

        // Validate coordinates
        if (crop.lat < -90 || crop.lat > 90 || crop.lon < -180 || crop.lon > 180) {
          return res.status(400).json({
            error: 'Invalid coordinates',
            message: `Invalid coordinates for crop ${crop.cropName}: lat=${crop.lat}, lon=${crop.lon}`
          });
        }
      }

      // Get weather data for all crops in parallel
      const weatherPromises = crops.map(async (crop) => {
        try {
          const weatherData = await weatherService.getWeatherForecast(crop.lat, crop.lon);
          const recommendations = weatherService.generateRecommendations(weatherData, crop.cropType);
          const alerts = await weatherService.getWeatherAlerts(crop.lat, crop.lon);
          
          return {
            cropId: crop.cropId,
            cropName: crop.cropName,
            cropType: crop.cropType,
            coordinates: { lat: crop.lat, lon: crop.lon },
            weather: weatherData,
            recommendations,
            alerts,
            success: true
          };
        } catch (error: any) {
          // Return error for this specific crop but don't fail the entire request
          return {
            cropId: crop.cropId,
            cropName: crop.cropName,
            cropType: crop.cropType,
            coordinates: { lat: crop.lat, lon: crop.lon },
            error: `Failed to fetch weather data: ${error.message}`,
            success: false
          };
        }
      });

      const cropWeatherData = await Promise.all(weatherPromises);

      // Count successful and failed requests
      const successfulRequests = cropWeatherData.filter(item => item.success).length;
      const failedRequests = cropWeatherData.filter(item => !item.success).length;

      return res.json({
        success: true,
        message: `Weather data for ${successfulRequests} crops retrieved successfully${failedRequests > 0 ? `, ${failedRequests} failed` : ''}`,
        data: {
          crops: cropWeatherData,
          summary: {
            total: crops.length,
            successful: successfulRequests,
            failed: failedRequests,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (error: any) {
      console.error('❌ Get weather for crops error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch weather data for crops',
        details: error.message 
      });
    }
  }
}