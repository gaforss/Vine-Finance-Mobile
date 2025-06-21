import axios, {AxiosInstance, AxiosResponse} from 'axios';
import storageService from './storage';
import {
  User,
  NetWorth,
  RealEstate,
  RetirementGoals,
  Expense,
  SavingsGoal,
  ApiResponse,
  Unit,
  ShortTermIncome,
  Document,
  Vacancy,
} from '../types';

// Configure base URL - update this to match your backend URL
// For local development (if backend is running on your machine):
const API_BASE_URL = 'http://192.168.4.27:3000';

// For production (if you have a deployed backend):
// const API_BASE_URL = 'https://your-domain.com';

// For iOS Simulator connecting to local backend:
// const API_BASE_URL = 'http://127.0.0.1:3000';

// For physical device connecting to local network:
// const API_BASE_URL = 'http://192.168.1.100:3000'; // Replace with your computer's IP

// Add Account type if not already present
export interface Account {
  _id: string;
  name: string;
  category: string;
  amount: number;
}

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
      const response: AxiosResponse<any> = await this.api.get('/entries');
      // If response is an array, wrap it
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
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
  async getRealEstateProperties(): Promise<{ success: boolean, data: RealEstate[] }> {
    try {
      const response = await this.api.get('/realestate/list');
      // If backend returns an array, wrap it in { success, data }
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      // If backend returns { success, data }, just return it
      if (response.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      // Fallback: return empty array
      return { success: false, data: [] };
    } catch (error: any) {
      return {
        success: false,
        data: [],
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

  // Expense Methods
  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    try {
      const response: AxiosResponse<Expense[]> = await this.api.get('/budgeting/expenses');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch expenses' };
    }
  }

  async addExpense(expense: Omit<Expense, '_id' | 'user'>): Promise<ApiResponse<Expense>> {
    try {
      const response: AxiosResponse<Expense> = await this.api.post('/budgeting/expenses', expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add expense' };
    }
  }

  async updateExpense(expenseId: string, expense: Partial<Expense>): Promise<ApiResponse<Expense>> {
    try {
      const response: AxiosResponse<Expense> = await this.api.put(`/budgeting/expenses/${expenseId}`, expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update expense' };
    }
  }

  async deleteExpense(expenseId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<{message: string}> = await this.api.delete(`/budgeting/expenses/${expenseId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete expense' };
    }
  }

  // Savings Goal Methods
  async getSavingsGoals(): Promise<ApiResponse<SavingsGoal[]>> {
    try {
      const response: AxiosResponse<SavingsGoal[]> = await this.api.get('/budgeting/goals');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch savings goals' };
    }
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, '_id' | 'user'>): Promise<ApiResponse<SavingsGoal>> {
    try {
      const response: AxiosResponse<SavingsGoal> = await this.api.post('/budgeting/goals', goal);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add savings goal' };
    }
  }

  async updateSavingsGoal(goalId: string, goal: Partial<SavingsGoal>): Promise<ApiResponse<SavingsGoal>> {
    try {
      const response: AxiosResponse<SavingsGoal> = await this.api.put(`/budgeting/goals/${goalId}`, goal);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update savings goal' };
    }
  }

  async deleteSavingsGoal(goalId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<{message: string}> = await this.api.delete(`/budgeting/goals/${goalId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete savings goal' };
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

  // Account Methods
  async getAccounts(): Promise<ApiResponse<Record<string, Account[]>>> {
    try {
      const response: AxiosResponse<Record<string, Account[]>> = await this.api.get('/plaid/accounts');
      return { success: true, data: response.data };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch accounts',
      };
    }
  }

  async deleteAccount(accountId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response: AxiosResponse<ApiResponse<{message: string}>> = await this.api.delete(`/accounts/${accountId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete account',
      };
    }
  }

  // Transaction Methods
  async getTransactions(accountId: string): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔍 Fetching transactions for account:', accountId);
      // Call the correct backend endpoint for Plaid-linked accounts
      const response = await this.api.get(`/plaid/transactions/${accountId}`);
      console.log('✅ Transactions response:', response.data);
      // The backend returns an array directly, not wrapped in { success, data }
      if (Array.isArray(response.data)) {
        return { success: true, data: response.data };
      }
      // If backend returns an object, try to extract data
      if (response.data && Array.isArray(response.data.data)) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: 'Unexpected response format' };
    } catch (error: any) {
      console.error('❌ Transactions fetch error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch transactions',
      };
    }
  }

  // Plaid Link Token
  async createPlaidLinkToken(): Promise<ApiResponse<{link_token: string}>> {
    try {
      const response = await this.api.post('/plaid/create_link_token');
      if (response.data && response.data.link_token) {
        return { success: true, data: { link_token: response.data.link_token } };
      }
      return { success: false, error: 'No link token returned' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create Plaid link token' };
    }
  }

  // Add Manual Account
  async addManualAccount(account: { name: string; type: string; amount: number }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/accounts', account);
      if (response.data && (response.data.success || response.data._id)) {
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Failed to add account' };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to add account' };
    }
  }

  // ===================== Real Estate: Units =====================
  async addUnit(propertyId: string, unit: Omit<Unit, '_id'>): Promise<ApiResponse<Unit>> {
    try {
      const response = await this.api.post(`/realestate/${propertyId}/units`, unit);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add unit' };
    }
  }
  async updateUnit(propertyId: string, unitId: string, unit: Partial<Unit>): Promise<ApiResponse<Unit>> {
    try {
      const response = await this.api.put(`/realestate/${propertyId}/units/${unitId}`, unit);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update unit' };
    }
  }
  async deleteUnit(propertyId: string, unitId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await this.api.delete(`/realestate/${propertyId}/units/${unitId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete unit' };
    }
  }

  // ===================== Real Estate: Rent Management =====================
  async updateRentCollection(propertyId: string, month: string, data: { amount: number; collected: boolean }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/realestate/rent/collect/${propertyId}/${month}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update rent collection' };
    }
  }
  async addRentPayment(propertyId: string, data: { startDate: string; endDate: string; amount: number }): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(`/realestate/rent/pay/${propertyId}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add rent payment' };
    }
  }
  async getTotalUnpaidRent(): Promise<ApiResponse<{ totalUnpaidRent: number }>> {
    try {
      const response = await this.api.get('/realestate/totalUnpaidRent');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch total unpaid rent' };
    }
  }
  async getTotalRentCollected(): Promise<ApiResponse<{ totalRentCollected: number; totalRentExpected: number }>> {
    try {
      const response = await this.api.get('/realestate/totalRentCollected');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch total rent collected' };
    }
  }
  async getTotalRentPaid(): Promise<ApiResponse<{ totalRentPaid: number }>> {
    try {
      const response = await this.api.get('/realestate/totalRentPaid');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch total rent paid' };
    }
  }
  async getTotalOverdueRent(): Promise<ApiResponse<{ totalOverdueRent: number }>> {
    try {
      const response = await this.api.get('/realestate/totalOverdueRent');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch total overdue rent' };
    }
  }
  async getUpcomingRent(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.api.get('/realestate/rent/upcoming');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch upcoming rent' };
    }
  }
  async getCashFlow(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/realestate/cashFlow');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch cash flow' };
    }
  }

  // ===================== Real Estate: Short-Term Income =====================
  async addShortTermIncome(propertyId: string, data: Omit<ShortTermIncome, '_id'>): Promise<ApiResponse<ShortTermIncome>> {
    try {
      const response = await this.api.post(`/realestate/income/short-term/add/${propertyId}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add short-term income' };
    }
  }
  async updateShortTermIncome(propertyId: string, incomeId: string, data: Partial<ShortTermIncome>): Promise<ApiResponse<ShortTermIncome>> {
    try {
      const response = await this.api.put(`/realestate/income/short-term/update/${propertyId}/${incomeId}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update short-term income' };
    }
  }
  async deleteShortTermIncome(propertyId: string, incomeId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await this.api.delete(`/realestate/income/short-term/delete/${propertyId}/${incomeId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete short-term income' };
    }
  }

  // ===================== Real Estate: Expenses (per property) =====================
  async addPropertyExpense(propertyId: string, expense: Omit<Expense, '_id' | 'user'>): Promise<ApiResponse<Expense>> {
    try {
      const response = await this.api.post(`/realestate/expense/add/${propertyId}`, expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add expense' };
    }
  }
  async listPropertyExpenses(propertyId: string): Promise<ApiResponse<Expense[]>> {
    try {
      const response = await this.api.get(`/realestate/expense/list/${propertyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch expenses' };
    }
  }
  async updatePropertyExpense(propertyId: string, expenseId: string, expense: Partial<Expense>): Promise<ApiResponse<Expense>> {
    try {
      const response = await this.api.put(`/realestate/expense/update/${propertyId}/${expenseId}`, expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update expense' };
    }
  }
  async deletePropertyExpense(propertyId: string, expenseId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await this.api.delete(`/realestate/expense/delete/${propertyId}/${expenseId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete expense' };
    }
  }

  // ===================== Real Estate: Document Management =====================
  async listDocuments(propertyId: string): Promise<ApiResponse<Document[]>> {
    try {
      const response = await this.api.get(`/realestate/${propertyId}/documents`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch documents' };
    }
  }
  async uploadDocument(propertyId: string, file: any): Promise<ApiResponse<Document>> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      const response = await this.api.post(`/realestate/${propertyId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to upload document' };
    }
  }
  async renameDocument(propertyId: string, docId: string, name: string): Promise<ApiResponse<Document>> {
    try {
      const response = await this.api.put(`/realestate/${propertyId}/documents/${docId}`, { name });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to rename document' };
    }
  }
  async deleteDocument(propertyId: string, docId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await this.api.delete(`/realestate/${propertyId}/documents/${docId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete document' };
    }
  }
  async exportDocuments(): Promise<ApiResponse<Blob>> {
    try {
      const response = await this.api.get('/realestate/exportDocuments', { responseType: 'blob' });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to export documents' };
    }
  }

  // ===================== Real Estate: Vacancy Tracking =====================
  async addVacancy(propertyId: string, vacancy: Omit<Vacancy, '_id'>): Promise<ApiResponse<Vacancy>> {
    try {
      const response = await this.api.post(`/realestate/${propertyId}/vacancies`, vacancy);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to add vacancy' };
    }
  }
  async updateVacancy(propertyId: string, vacancyId: string, vacancy: Partial<Vacancy>): Promise<ApiResponse<Vacancy>> {
    try {
      const response = await this.api.put(`/realestate/${propertyId}/vacancies/${vacancyId}`, vacancy);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update vacancy' };
    }
  }
  async deleteVacancy(propertyId: string, vacancyId: string): Promise<ApiResponse<{message: string}>> {
    try {
      const response = await this.api.delete(`/realestate/${propertyId}/vacancies/${vacancyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to delete vacancy' };
    }
  }

  // ===================== Real Estate: Analytics =====================
  async getPropertySummary(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/realestate/summary/${propertyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch property summary' };
    }
  }
  async getPropertyAnalysis(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(`/realestate/analysis/${propertyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch property analysis' };
    }
  }
  async getPortfolioSummary(): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get('/realestate/portfolio-summary');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to fetch portfolio summary' };
    }
  }
}

export const apiService = new ApiService();
