// netlify/functions/auth-register.js
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
    const { name, email, password } = JSON.parse(event.body);

    // Basic validation
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Name, email and password are required',
          data: null 
        })
      };
    }

    // Name validation
    if (name.length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Name must be at least 2 characters',
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

    // Password validation
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

    // Check if email already exists (in a real app, check database)
    const existingUsers = ['admin@farm.com', 'user@farm.com', 'demo@farm.com'];
    if (existingUsers.includes(email)) {
      return {
        statusCode: 409,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Email already registered',
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
      name: name.trim()
    };

    const authResponse = {
      user: userResponse,
      token: token,
      expiresIn: expiresIn
    };

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Registration successful',
        data: authResponse 
      })
    };

  } catch (error) {
    console.error('Registration error:', error);
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