exports.handler = async function(event, context) {
  if (event.httpMethod === 'GET') {
    const { lat, lon } = event.queryStringParameters;
    
    const weatherData = {
      temperature: 72,
      condition: 'Sunny',
      humidity: 65,
      precipitation: 0,
      windSpeed: 12,
      forecast: [
        { 
          date: new Date().toISOString().split('T')[0], 
          maxTemp: 25, 
          minTemp: 15, 
          precipitation: 0, 
          condition: 'Sunny' 
        },
        { 
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
          maxTemp: 26, 
          minTemp: 16, 
          precipitation: 2, 
          condition: 'Rain' 
        }
      ]
    };
    
    // Return data nested under 'data' property like your other APIs
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        data: weatherData,  // ← This is the key fix!
        message: 'Weather data retrieved successfully'
      })
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};