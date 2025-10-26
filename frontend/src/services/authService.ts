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
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
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
      console.error('Login failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
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
      console.error('Registration failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
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
}

export const authService = new AuthService();
