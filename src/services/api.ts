import axios, {AxiosInstance, AxiosResponse} from 'axios';
import storageService from './storage';
import {
  User,
  NetWorth,
  RealEstate,
  RetirementGoals,
  Budget,
  ApiResponse,
} from '../types';

// Configure base URL - update this to match your backend URL
// For local development (if backend is running on your machine):
const API_BASE_URL = 'http://127.0.0.1:3000';

// For production (if you have a deployed backend):
// const API_BASE_URL = 'https://your-domain.com';

// For iOS Simulator connecting to local backend:
// const API_BASE_URL = 'http://127.0.0.1:3000';

// For physical device connecting to local network:
// const API_BASE_URL = 'http://192.168.1.100:3000'; // Replace with your computer's IP

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async config => {
        const token = await storageService.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor to handle auth errors
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          await storageService.removeItem('authToken');
          await storageService.removeItem('user');
          // You might want to navigate to login screen here
        }
        return Promise.reject(error);
      },
    );
  }

  // Test connection to backend
  async testConnection(): Promise<{success: boolean; message: string}> {
    try {
      console.log('🔍 Testing connection to:', this.api.defaults.baseURL);
      const response = await this.api.get('/');
      console.log('✅ Backend connection successful:', response.status);
      return {
        success: true,
        message: `Connected to backend (Status: ${response.status})`,
      };
    } catch (error: any) {
      console.error('❌ Backend connection failed:', error.message);
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  // Authentication Methods
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{user?: User; token: string}>> {
    try {
      console.log(
        '🔐 Attempting login to:',
        `${this.api.defaults.baseURL}/auth/login`,
      );
      console.log('📧 Email:', email);
      console.log('🔑 Password length:', password.length);

      const response: AxiosResponse<any> = await this.api.post('/auth/login', {
        email,
        password,
      });

      // Accept response with just a token
      const {token} = response.data;
      if (token) {
        await storageService.setItem('authToken', token);
        // Optionally fetch user profile after login
        let user: User | undefined;
        try {
          const profileResp = await this.getUserProfile();
          if (profileResp.success && profileResp.data) {
            user = profileResp.data;
            await storageService.setItem('user', JSON.stringify(user));
          }
        } catch (e) {
          console.warn('User profile fetch failed after login:', e);
        }
        return {success: true, data: {token, user}};
      }
      return {success: false, error: 'No token returned'};
    } catch (error: any) {
      console.error('❌ Login failed - Full error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Login failed - check your backend connection',
      };
    }
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<{user: User; token: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{user: User; token: string}>> =
        await this.api.post('/auth/register', userData);

      if (response.data.success && response.data.data) {
        await storageService.setItem('authToken', response.data.data.token);
        await storageService.setItem(
          'user',
          JSON.stringify(response.data.data.user),
        );
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await storageService.removeItem('authToken');
      await storageService.removeItem('user');
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> =
        await this.api.post('/auth/forgot-password', {email});
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset failed',
      };
    }
  }

  // Net Worth Methods
  async getNetWorthEntries(): Promise<ApiResponse<NetWorth[]>> {
    try {
      const response: AxiosResponse<ApiResponse<NetWorth[]>> =
        await this.api.get('/entries');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to fetch net worth entries',
      };
    }
  }

  async addNetWorthEntry(
    entry: Omit<NetWorth, '_id' | 'user'>,
  ): Promise<ApiResponse<NetWorth>> {
    try {
      const response: AxiosResponse<ApiResponse<NetWorth>> =
        await this.api.post('/entries', entry);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add net worth entry',
      };
    }
  }

  async updateNetWorthEntry(
    entryId: string,
    entry: Partial<NetWorth>,
  ): Promise<ApiResponse<NetWorth>> {
    try {
      const response: AxiosResponse<ApiResponse<NetWorth>> = await this.api.put(
        `/entries/${entryId}`,
        entry,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to update net worth entry',
      };
    }
  }

  async deleteNetWorthEntry(
    entryId: string,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> =
        await this.api.delete(`/entries/${entryId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to delete net worth entry',
      };
    }
  }

  // Real Estate Methods
  async getRealEstateProperties(): Promise<ApiResponse<RealEstate[]>> {
    try {
      const response: AxiosResponse<ApiResponse<RealEstate[]>> =
        await this.api.get('/realestate');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          'Failed to fetch real estate properties',
      };
    }
  }

  async addRealEstateProperty(
    property: Omit<RealEstate, '_id' | 'userId'>,
  ): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<ApiResponse<RealEstate>> =
        await this.api.post('/realestate', property);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to add real estate property',
      };
    }
  }

  async updateRealEstateProperty(
    propertyId: string,
    property: Partial<RealEstate>,
  ): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<ApiResponse<RealEstate>> =
        await this.api.put(`/realestate/${propertyId}`, property);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          'Failed to update real estate property',
      };
    }
  }

  async deleteRealEstateProperty(
    propertyId: string,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> =
        await this.api.delete(`/realestate/${propertyId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          'Failed to delete real estate property',
      };
    }
  }

  // Retirement Methods
  async getRetirementGoals(): Promise<ApiResponse<RetirementGoals>> {
    try {
      const response: AxiosResponse<ApiResponse<RetirementGoals>> =
        await this.api.get('/retirement');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to fetch retirement goals',
      };
    }
  }

  async updateRetirementGoals(
    goals: Partial<RetirementGoals>,
  ): Promise<ApiResponse<RetirementGoals>> {
    try {
      const response: AxiosResponse<ApiResponse<RetirementGoals>> =
        await this.api.put('/retirement', goals);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to update retirement goals',
      };
    }
  }

  // Budgeting Methods
  async getBudgets(month?: string): Promise<ApiResponse<Budget[]>> {
    try {
      const params = month ? {month} : {};
      const response: AxiosResponse<ApiResponse<Budget[]>> = await this.api.get(
        '/budgeting',
        {params},
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch budgets',
      };
    }
  }

  async addBudget(
    budget: Omit<Budget, '_id' | 'userId'>,
  ): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.post(
        '/budgeting',
        budget,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add budget',
      };
    }
  }

  async updateBudget(
    budgetId: string,
    budget: Partial<Budget>,
  ): Promise<ApiResponse<Budget>> {
    try {
      const response: AxiosResponse<ApiResponse<Budget>> = await this.api.put(
        `/budgeting/${budgetId}`,
        budget,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update budget',
      };
    }
  }

  async deleteBudget(
    budgetId: string,
  ): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> =
        await this.api.delete(`/budgeting/${budgetId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete budget',
      };
    }
  }

  // User Profile Methods
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get(
        '/auth/profile',
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user profile',
      };
    }
  }

  async updateUserProfile(
    profileData: Partial<User>,
  ): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.put(
        '/auth/profile',
        profileData,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update user profile',
      };
    }
  }

  // Import/Export Methods
  async importData(file: FormData): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> =
        await this.api.post('/import', file, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to import data',
      };
    }
  }

  async exportData(): Promise<ApiResponse<{downloadUrl: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{downloadUrl: string}>> =
        await this.api.get('/export');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to export data',
      };
    }
  }
}

export const apiService = new ApiService();
