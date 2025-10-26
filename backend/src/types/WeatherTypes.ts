// backend/src/types/WeatherTypes.ts

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: string;
  forecast: DailyForecast[];
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  condition: string;
}

export interface WeatherAlert {
  event: string;
  description: string;
  start: number;
  end: number;
  severity: string;
}

export interface WeatherRecommendation {
  type: 'IRRIGATION' | 'PROTECTION' | 'HARVEST' | 'PLANTING';
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}