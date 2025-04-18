import axios from 'axios';

/**
 * AuthService - Utility to manage authentication tokens across the application
 */
export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly USERNAME_KEY = 'username';

  /**
   * Set the authentication token and configure axios with it
   */
  public static setAuthToken(token: string): void {
    // Save token to localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    
    // Set token in axios default headers for all future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set the username in localStorage
   */
  public static setUsername(username: string): void {
    localStorage.setItem(this.USERNAME_KEY, username);
  }

  /**
   * Get the current authentication token
   */
  public static getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get the current username
   */
  public static getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  /**
   * Check if user is authenticated (has a token)
   */
  public static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Remove the auth token and clear axios headers
   */
  public static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    delete axios.defaults.headers.common['Authorization'];
  }

  /**
   * Initialize the auth state from localStorage (call this when the app starts)
   */
  public static initializeAuth(): void {
    const token = this.getAuthToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Parse and decode the JWT token (for debugging or accessing claims)
   */
  public static decodeToken(): any {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      // Split the token and get the payload section
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode the payload
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  }
} 