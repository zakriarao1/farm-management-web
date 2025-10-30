javascript
const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message: 'API is working!',
      path: event.path,
      method: event.httpMethod,
      timestamp: new Date().toISOString()
    })
  };
};

module.exports = { handler };