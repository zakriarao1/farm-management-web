// backend/src/test-weather.ts
import { WeatherService } from './services/WeatherService';

async function testWeatherService() {
  const weatherService = new WeatherService();
  
  try {
    const weather = await weatherService.getWeatherForecast(40.7128, -74.0060);
    console.log('✅ Weather service test successful!');
    console.log('Temperature:', weather.temperature);
    console.log('Condition:', weather.condition);
    console.log('Forecast days:', weather.forecast.length);
  } catch (error) {
    console.error('❌ Weather service test failed:', error);
  }
}

testWeatherService();