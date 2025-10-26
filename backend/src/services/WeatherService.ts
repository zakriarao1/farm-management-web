// backend/src/services/WeatherService.ts

import { WeatherData, DailyForecast, WeatherAlert, WeatherRecommendation } from '../types/WeatherTypes';

// Define interfaces for the OpenWeather API response structure
interface OpenWeatherForecastResponse {
  list: Array<{
    dt_txt: string;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    wind: {
      speed: number;
    };
    rain?: {
      '3h': number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
  }>;
}

interface OpenWeatherOneCallResponse {
  alerts?: Array<{
    event: string;
    description: string;
    start: number;
    end: number;
    tags: string[];
  }>;
}

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'your-api-key-here';
  }

  async getWeatherForecast(lat: number, lon: number): Promise<WeatherData> {
    try {
      console.log(`🌤️ Fetching weather for coordinates: ${lat}, ${lon}`);
      
      const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data = await response.json() as OpenWeatherForecastResponse;

      // Validate data structure
      if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
        throw new Error('Invalid weather data received from API');
      }

      // Process current weather (first item in the list)
      const current = data.list[0];
      const forecast: DailyForecast[] = data.list.slice(0, 8).map((item) => ({
        date: item.dt_txt,
        maxTemp: item.main.temp_max,
        minTemp: item.main.temp_min,
        precipitation: item.rain ? item.rain['3h'] || 0 : 0,
        condition: item.weather[0]?.main || 'Unknown'
      }));

      return {
        temperature: current?.main?.temp || 0,
        humidity: current?.main?.humidity || 0,
        precipitation: current?.rain ? current.rain['3h'] || 0 : 0,
        windSpeed: current?.wind?.speed || 0,
        condition: current?.weather?.[0]?.main || 'Unknown',
        forecast
      };
    } catch (error: any) {
      console.error('❌ Weather API error:', error.message);
      
      // Return mock data for development if API fails
      return this.getMockWeatherData();
    }
  }

  async getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
    try {
      const url = `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=current,minutely,hourly&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather alerts API responded with status: ${response.status}`);
      }

      const data = await response.json() as OpenWeatherOneCallResponse;

      return data.alerts?.map((alert) => ({
        event: alert.event,
        description: alert.description,
        start: alert.start,
        end: alert.end,
        severity: alert.tags?.[0] || 'Moderate'
      })) || [];
    } catch (error) {
      console.error('Weather alerts error:', error);
      return [];
    }
  }

  generateRecommendations(weather: WeatherData, cropType?: string): WeatherRecommendation[] {
    const recommendations: WeatherRecommendation[] = [];

    // Precipitation-based recommendations
    if (weather.precipitation > 10) {
      recommendations.push({
        type: 'IRRIGATION',
        message: 'Heavy rain expected - consider delaying irrigation',
        priority: 'HIGH'
      });
    } else if (weather.precipitation < 2 && weather.temperature > 25) {
      recommendations.push({
        type: 'IRRIGATION',
        message: 'Dry conditions with high temperatures - ensure adequate irrigation',
        priority: 'HIGH'
      });
    }

    // Temperature-based recommendations
    if (weather.temperature < 5) {
      recommendations.push({
        type: 'PROTECTION',
        message: 'Low temperatures expected - protect sensitive crops from frost',
        priority: 'HIGH'
      });
    } else if (weather.temperature > 35) {
      recommendations.push({
        type: 'PROTECTION',
        message: 'Extreme heat warning - provide shade and increase watering',
        priority: 'HIGH'
      });
    }

    // Wind-based recommendations
    if (weather.windSpeed > 20) {
      recommendations.push({
        type: 'PROTECTION',
        message: 'High winds expected - secure equipment and protect young plants',
        priority: 'MEDIUM'
      });
    }

    // Crop-specific recommendations
    if (cropType) {
      const lowerCropType = cropType.toLowerCase();
      
      if (lowerCropType.includes('rice') && weather.precipitation < 5) {
        recommendations.push({
          type: 'IRRIGATION',
          message: 'Rice crops need consistent water - ensure proper irrigation',
          priority: 'HIGH'
        });
      }

      if (lowerCropType.includes('wheat') && weather.temperature > 30) {
        recommendations.push({
          type: 'PROTECTION',
          message: 'High temperatures may stress wheat crops - monitor soil moisture',
          priority: 'MEDIUM'
        });
      }

      if (lowerCropType.includes('tomato') && weather.temperature < 10) {
        recommendations.push({
          type: 'PROTECTION',
          message: 'Tomatoes are sensitive to cold - provide frost protection',
          priority: 'HIGH'
        });
      }
    }

    // Optimal planting conditions
    if (weather.temperature > 15 && weather.temperature < 25 && weather.precipitation < 5) {
      recommendations.push({
        type: 'PLANTING',
        message: 'Optimal planting conditions - good temperature and minimal rain',
        priority: 'LOW'
      });
    }

    return recommendations;
  }

  // Mock data for development when API is unavailable
  private getMockWeatherData(): WeatherData {
    console.log('📋 Using mock weather data for development');
    
    const baseDate = new Date();
    const forecast: DailyForecast[] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]!,
        maxTemp: 25 + Math.random() * 10,
        minTemp: 15 + Math.random() * 5,
        precipitation: Math.random() * 15,
        condition: ['Clear', 'Clouds', 'Rain', 'Clear'][i % 4] || 'Clear'
      });
    }

    return {
      temperature: 22.5,
      humidity: 65,
      precipitation: 2.5,
      windSpeed: 12,
      condition: 'Clear',
      forecast
    };
  }

  // Additional utility methods
  async getHistoricalWeather(lat: number, lon: number, days: number = 7): Promise<any> {
    try {
      // This would typically call a historical weather API
      // For now, return mock historical data
      const historicalData = [];
      const baseDate = new Date();
      
      for (let i = days; i > 0; i--) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() - i);
        
        historicalData.push({
          date: date.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          temperature: 20 + Math.random() * 10,
          precipitation: Math.random() * 20,
          condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)] || 'Clear'
        });
      }
      
      return historicalData;
    } catch (error) {
      console.error('Historical weather error:', error);
      return [];
    }
  }

  // Method to check if weather conditions are suitable for specific farming activities
  isSuitableForActivity(activity: string, weather: WeatherData): boolean {
    switch (activity.toLowerCase()) {
      case 'planting':
        return weather.temperature >= 10 && 
               weather.temperature <= 30 && 
               weather.precipitation < 10;
      
      case 'harvesting':
        return weather.precipitation < 5 && 
               weather.windSpeed < 25;
      
      case 'spraying':
        return weather.windSpeed < 15 && 
               weather.precipitation < 2;
      
      case 'irrigation':
        return weather.precipitation < 3;
      
      default:
        return true;
    }
  }

  // Method to calculate growing degree days (GDD)
  calculateGDD(baseTemp: number, maxTemp: number, minTemp: number): number {
    const avgTemp = (maxTemp + minTemp) / 2;
    const gdd = Math.max(avgTemp - baseTemp, 0);
    return Math.round(gdd * 100) / 100; // Round to 2 decimal places
  }
}