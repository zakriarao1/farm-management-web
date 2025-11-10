// netlify/functions/auth-login.js
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // Basic validation
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Email and password are required',
          data: null 
        })
      };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Please enter a valid email address',
          data: null 
        })
      };
    }

    // Password length validation
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Password must be at least 6 characters',
          data: null 
        })
      };
    }

    // Demo users for testing
    const demoUsers = {
      'admin@farm.com': { password: 'admin123', name: 'Farm Admin' },
      'user@farm.com': { password: 'user123', name: 'Farm User' },
      'demo@farm.com': { password: 'demo123', name: 'Demo User' }
    };

    // Check credentials
    const user = demoUsers[email];
    if (!user || user.password !== password) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid email or password',
          data: null 
        })
      };
    }

    // Generate mock JWT token
    const token = `farm_jwt_${uuidv4()}`;
    const expiresIn = 24 * 60 * 60 * 1000; // 24 hours

    const userResponse = {
      id: Date.now(),
      email: email,
      name: user.name
    };

    const authResponse = {
      user: userResponse,
      token: token,
      expiresIn: expiresIn
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Login successful',
        data: authResponse 
      })
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        data: null 
      })
    };
  }
};