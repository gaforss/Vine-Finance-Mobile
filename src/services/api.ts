import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { storageService } from './storage';
import {
  NetWorth,
  RealEstate,
  RetirementGoals,
  User,
  Account,
  ApiResponse,
  RetirementProjectionsResult,
  NetWorthComparisonResult,
  OnboardingStep,
  Session,
  Transaction,
  SavingsGoal,
  Unit,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:3000';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async config => {
        const token = await storageService.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );
  }

  private handleError(error: any, defaultMessage: string): ApiResponse<any> {
    if (axios.isAxiosError(error)) {
      console.error(
        `❌ API Error: ${error.response?.status} - ${JSON.stringify(
          error.response?.data,
        )}`,
      );
      const message = error.response?.data?.message || error.message;
      return {success: false, message, error: error.response?.data};
    } else {
      console.error('❌ Unexpected Error:', error);
      return {success: false, message: defaultMessage, error};
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{token: string}>> {
    try {
      const response: AxiosResponse<{token: string}> = await this.api.post(
        '/auth/login',
        {email, password},
      );
      const {token} = response.data;
      if (token) {
        await storageService.setItem('token', token);
      }
      return {success: true, data: response.data};
    } catch (error: any) {
      console.error(
        '❌ Login failed - Full error:',
        error.isAxiosError ? error.toJSON() : error,
      );
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      return {success: false, message: 'Login failed', error: error};
    }
  }

  // Profile Methods
  async getUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<User> = await this.api.get('/auth/api/user');
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch user data');
    }
  }

  async updateUser(userData: { firstName?: string; lastName?: string; username?: string }): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<{ message: string; user: User }> = await this.api.post('/auth/api/profile', userData);
      return { success: true, data: response.data.user };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update user');
    }
  }

  async getOnboardingSteps(): Promise<ApiResponse<OnboardingStep[]>> {
    try {
      const response: AxiosResponse<OnboardingStep[]> = await this.api.get('/auth/api/onboarding-steps');
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch onboarding steps');
    }
  }

  async updateOnboardingStep(title: string, completed: boolean): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post('/auth/api/onboarding-step', { title, completed });
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update onboarding step');
    }
  }

  async deleteAccount(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete('/auth/deleteAccount');
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to delete account');
    }
  }

  // Fetch net worth entries for time-series chart
  async getNetWorthEntries(): Promise<ApiResponse<NetWorth[]>> {
    try {
      const response: AxiosResponse<NetWorth[]> = await this.api.get(
        '/entries',
      );
      return {success: true, data: response.data};
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch net worth entries');
    }
  }

  async getRealEstate(): Promise<ApiResponse<RealEstate[]>> {
    try {
      console.log('getRealEstate: about to get userId from storage');
      const userId = await storageService.getItem('userId');
      console.log('getRealEstate: userId from storage:', userId);
      if (!userId) throw new Error('No userId found in storage');
      const url = '/realestate/list';
      const params = { userId };
      console.log('getRealEstate: making request', url, params);
      const response: AxiosResponse<RealEstate[]> = await this.api.get(url, { params });
      return {success: true, data: response.data};
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch real estate data');
    }
  }

  async addRealEstate(property: Partial<RealEstate>): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<RealEstate> = await this.api.post('/realestate/add', property);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to add real estate property');
    }
  }

  async updateRealEstate(id: string, property: Partial<RealEstate>): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<RealEstate> = await this.api.put(`/realestate/update/${id}`, property);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update real estate property');
    }
  }

  async deleteRealEstate(id: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/realestate/delete/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to delete real estate property');
    }
  }

  async getPropertyDetails(id: string): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<RealEstate> = await this.api.get(`/realestate/property/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch property details');
    }
  }

  async updateRentCollection(propertyId: string, month: string, data: { collected: boolean; amount?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/realestate/rent/collect/${propertyId}/${month}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update rent collection');
    }
  }

  async addRentPayment(propertyId: string, data: { startDate: string; endDate: string; amount: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/realestate/rent/pay/${propertyId}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to add rent payment');
    }
  }

  // This is for REAL ESTATE expenses
  async addRealEstateExpense(propertyId: string, expense: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/realestate/expense/add/${propertyId}`, expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to add real estate expense');
    }
  }

  // This is for REAL ESTATE expenses
  async listRealEstateExpenses(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/realestate/expense/list/${propertyId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to list real estate expenses');
    }
  }
  
  async updateRealEstateExpense(propertyId: string, expenseId: string, expense: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/realestate/expense/update/${propertyId}/${expenseId}`, expense);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update real estate expense');
    }
  }

  // This is for REAL ESTATE expenses
  async deleteRealEstateExpense(propertyId: string, expenseId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/realestate/expense/delete/${propertyId}/${expenseId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to delete real estate expense');
    }
  }

  async listDocuments(propertyId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/realestate/${propertyId}/documents`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to list documents');
    }
  }

  async uploadDocument(propertyId: string, formData: FormData): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/realestate/${propertyId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to upload document');
    }
  }

  async renameDocument(propertyId: string, docId: string, name: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.put(`/realestate/${propertyId}/documents/${docId}`, { name });
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to rename document');
    }
  }

  async deleteDocument(propertyId: string, docId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/realestate/${propertyId}/documents/${docId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to delete document');
    }
  }

  async addUnit(propertyId: string, unit: Unit): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<RealEstate> = await this.api.post(`/realestate/${propertyId}/units`, unit);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to add unit');
    }
  }

  async updateUnit(propertyId: string, unitId: string, unit: Partial<Unit>): Promise<ApiResponse<RealEstate>> {
    try {
      const response: AxiosResponse<RealEstate> = await this.api.put(`/realestate/${propertyId}/units/${unitId}`, unit);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to update unit');
    }
  }

  async deleteUnit(propertyId: string, unitId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.delete(`/realestate/${propertyId}/units/${unitId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return this.handleError(error, 'Failed to delete unit');
    }
  }
  
  async getTransactions(): Promise<ApiResponse<Transaction[]>> {
    try {
      const response = await this.api.get<Transaction[]>('/plaid/transactions/cashflow');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch transactions');
    }
  }

  async getCashFlow(period: string = 'monthly'): Promise<ApiResponse<any>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get('/budget/cashflow', { params: { userId, period } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch cash flow');
    }
  }

  async getSpending(period: string = 'monthly'): Promise<ApiResponse<any[]>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get<any[]>('/budget/spending', { params: { userId, period } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch spending data');
    }
  }

  async getSavingsGoals(): Promise<ApiResponse<SavingsGoal[]>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get<SavingsGoal[]>('/budget/savings-goals', { params: { userId } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch savings goals');
    }
  }

  async addSavingsGoal(goal: Partial<SavingsGoal>): Promise<ApiResponse<SavingsGoal>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.post<SavingsGoal>('/budget/savings-goals', { ...goal, userId });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to add savings goal');
    }
  }

  async updateSavingsGoal(id: string, goal: Partial<SavingsGoal>): Promise<ApiResponse<SavingsGoal>> {
    try {
      const response = await this.api.put<SavingsGoal>(`/budget/savings-goals/${id}`, goal);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to update savings goal');
    }
  }

  async deleteSavingsGoal(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/budget/savings-goals/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to delete savings goal');
    }
  }

  async getExpenses(): Promise<ApiResponse<any[]>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get<any[]>('/budget/expenses', { params: { userId } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch expenses');
    }
  }

  async addExpense(expense: any): Promise<ApiResponse<any>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.post('/budget/expenses', { ...expense, userId });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to add expense');
    }
  }

  async updateExpense(id: string, expense: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.put(`/budget/expenses/${id}`, expense);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to update expense');
    }
  }

  async deleteExpense(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/budget/expenses/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to delete expense');
    }
  }

  async getRetirementGoals(): Promise<ApiResponse<RetirementGoals>> {
    try {
      console.log('DEBUG: getRetirementGoals called');
      const userId = await storageService.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found in storage');
      }
      console.log(`DEBUG: Fetching retirement goals for userId: ${userId}`);
      const response: AxiosResponse<RetirementGoals> = await this.api.get(
        '/retirement/goals',
        { params: { userId } }
      );
      console.log('DEBUG: getRetirementGoals response', response.data);
      return {success: true, data: response.data};
    } catch (error: any) {
      return this.handleError(error, 'Failed to fetch retirement goals');
    }
  }

  // Retirement Endpoints
  async getRetirementProjections(): Promise<ApiResponse<RetirementProjectionsResult>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get<RetirementProjectionsResult>('/retirement/projections', { params: { userId } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch retirement projections');
    }
  }

  async getNetWorthComparison(): Promise<ApiResponse<NetWorthComparisonResult>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.get<NetWorthComparisonResult>('/retirement/networth/comparison', { params: { userId } });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch net worth comparison');
    }
  }

  async updateRetirementGoals(goals: Partial<RetirementGoals>): Promise<ApiResponse<RetirementGoals>> {
    try {
      const userId = await storageService.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      const response = await this.api.post<RetirementGoals>('/retirement/goals', { ...goals, userId });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to update retirement goals');
    }
  }

  // Plaid/Accounts Methods
  async createPlaidLinkToken(): Promise<ApiResponse<{ link_token: string }>> {
    try {
      const response = await this.api.post('/plaid/create_link_token');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to create Plaid link token');
    }
  }

  async exchangePublicToken(publicToken: string, institutionName: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post('/plaid/exchange_public_token', { 
        public_token: publicToken,
        institutionName: institutionName,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to exchange public token');
    }
  }

  async getAccounts(): Promise<ApiResponse<{[key: string]: Account[]}>> {
    try {
      const response = await this.api.get('/plaid/accounts');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch accounts');
    }
  }

  async getManualAccounts(): Promise<ApiResponse<Account[]>> {
    try {
      const response = await this.api.get('/plaid/manual_accounts');
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to fetch manual accounts');
    }
  }

  async addManualAccount(accountData: { name: string, amount: number, category: string }): Promise<ApiResponse<Account>> {
    try {
      const response = await this.api.post('/plaid/manual_account', accountData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to add manual account');
    }
  }

  async updateAccount(accountId: string, accountData: { name: string, amount: number, category: string }): Promise<ApiResponse<Account>> {
    try {
      const response = await this.api.put(`/plaid/manual_account/${accountId}`, accountData);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to update manual account');
    }
  }

  async deleteManualAccount(accountId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.delete(`/plaid/manual_account/${accountId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return this.handleError(error, 'Failed to delete manual account');
    }
  }
}

export const apiService = new ApiService();
