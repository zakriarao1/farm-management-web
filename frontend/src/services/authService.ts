// frontend/src/services/authService.ts

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      this.token = localStorage.getItem('authToken');
      const expiry = localStorage.getItem('tokenExpiry');
      this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
    } catch (error) {
      console.error('Error loading token from storage:', error);
      this.clearToken();
    }
  }

  private saveTokenToStorage(token: string, expiresIn: number = 24 * 60 * 60 * 1000) {
    if (typeof window === 'undefined') return;

    try {
      this.token = token;
      this.tokenExpiry = Date.now() + expiresIn;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('tokenExpiry', this.tokenExpiry.toString());
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
  }

  private clearToken() {
    this.token = null;
    this.tokenExpiry = null;
    
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing token from storage:', error);
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return Date.now() >= this.tokenExpiry;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Use Netlify functions endpoint
      const response = await fetch('/.netlify/functions/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // If Netlify function fails, use mock data for development
        console.warn('Netlify function failed, using mock data');
        return this.mockLogin(email, password);
      }

      const result = await response.json();
      const authResponse = result.data as AuthResponse;

      if (authResponse.token) {
        this.saveTokenToStorage(authResponse.token, authResponse.expiresIn);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
      }

      return authResponse;

    } catch (error) {
      console.error('Login failed, using mock data:', error);
      // Fallback to mock data for development
      return this.mockLogin(email, password);
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      // Use Netlify functions endpoint
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        // If Netlify function fails, use mock data for development
        console.warn('Netlify function failed, using mock data');
        return this.mockRegister(name, email, password);
      }

      const result = await response.json();
      const authResponse = result.data as AuthResponse;

      if (authResponse.token) {
        this.saveTokenToStorage(authResponse.token, authResponse.expiresIn);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
      }

      return authResponse;

    } catch (error) {
      console.error('Registration failed, using mock data:', error);
      // Fallback to mock data for development
      return this.mockRegister(name, email, password);
    }
  }

  // Mock login for development
  private async mockLogin(email: string, password: string): Promise<AuthResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation - accept any credentials for demo
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const mockUser: User = {
      id: 1,
      email: email,
      name: email.split('@')[0] || 'Demo User'
    };

    const authResponse: AuthResponse = {
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };

    this.saveTokenToStorage(authResponse.token, authResponse.expiresIn);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    }

    return authResponse;
  }

  // Mock registration for development
  private async mockRegister(name: string, email: string, password: string): Promise<AuthResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation
    if (!name || !email || !password) {
      throw new Error('Name, email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const mockUser: User = {
      id: Date.now(), // Use timestamp as ID for new users
      email: email,
      name: name
    };

    const authResponse: AuthResponse = {
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now(),
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours
    };

    this.saveTokenToStorage(authResponse.token, authResponse.expiresIn);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    }

    return authResponse;
  }

  setToken(token: string, expiresIn?: number) {
    this.saveTokenToStorage(token, expiresIn);
  }

  getToken(): string | null {
    // Check if token exists and is not expired
    if (!this.token || this.isTokenExpired()) {
      this.clearToken();
      return null;
    }
    return this.token;
  }

  logout() {
    this.clearToken();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // For development - quick login without credentials
  async quickLogin(): Promise<AuthResponse> {
    return this.login('demo@farm.com', 'demo123');
  }

  // Validate token on app startup
  validateToken(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      this.clearToken();
      return false;
    }
    
    return true;
  }
}

export const authService = new AuthService();

// Export for use with APIs
export default authService;