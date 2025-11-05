// Netlify functions auth middleware
const jwt = require('jsonwebtoken');

exports.authenticate = (handler) => {
  return async (event, context) => {
    const authHeader = event.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Access token required' })
      };
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      context.user = decoded;
      return handler(event, context);
    } catch (error) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid or expired token' })
      };
    }
  };
};

exports.optionalAuth = (handler) => {
  return async (event, context) => {
    const authHeader = event.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        context.user = decoded;
      } catch (error) {
        // Continue without user for optional auth
      }
    }
    return handler(event, context);
  };
};