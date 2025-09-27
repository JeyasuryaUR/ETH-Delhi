interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  wallet_address: string;
  ens_name: string | null;
  ens_namehash: string | null;
  ens_resolver: string | null;
  ens_registered: boolean;
  ens_verified: boolean;
  ens_verified_at: string | null;
  rating_cached: number;
  rating_type_cached: string;
  rating_cached_updated_at: string | null;
  created_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

interface CreateUserData {
  username: string;
  email: string;
  display_name: string;
  wallet_address: string;
  ens_name?: string;
  ens_namehash?: string;
  ens_resolver?: string;
  ens_registered?: boolean;
  ens_verified?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const authService = {
  // Check if user exists by wallet address
  async getUserByWallet(walletAddress: string): Promise<{ exists: boolean; user?: User }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/wallet/${walletAddress}`);
      const data: ApiResponse<User> = await response.json();
      
      if (data.success && data.data) {
        return { exists: true, user: data.data };
      } else if (response.status === 404) {
        return { exists: false };
      } else {
        throw new Error(data.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: ApiResponse<User> = await response.json();

      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Handle complete authentication flow
  async handleAuthFlow(email: string, displayName: string, walletAddress: string) {
    try {
      // First, check if user exists
      const { exists, user } = await this.getUserByWallet(walletAddress);
      
      if (exists && user) {
        // User exists, return user data
        return {
          needsRegistration: false,
          user
        };
      } else {
        // User doesn't exist, needs ENS registration
        return {
          needsRegistration: true,
          tempUserData: {
            email,
            displayName,
            walletAddress
          }
        };
      }
    } catch (error) {
      console.error('Auth flow error:', error);
      throw error;
    }
  }
};

export type { User, CreateUserData, ApiResponse };