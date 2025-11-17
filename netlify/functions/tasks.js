exports.handler = async function(event, context) {
  if (event.httpMethod === 'GET') {
    const { days } = event.queryStringParameters || {};
    
    // Return mock data or connect to your database
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: [
          {
            id: 1,
            title: 'Water tomatoes',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            priority: 'high'
          },
          {
            id: 2,
            title: 'Fertilize crops',
            dueDate: new Date(Date.now() + 172800000).toISOString(),
            priority: 'medium'
          }
        ]
      })
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};