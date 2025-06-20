// User Types
export interface User {
  _id: string;
  googleId?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  isNewUser: boolean;
  onboardingSteps: OnboardingStep[];
  hasDeletedDummyData: boolean;
  sessionActivity: SessionActivity[];
}

export interface OnboardingStep {
  title: string;
  description: string;
  templateLink: boolean;
  completed: boolean;
  icon: string;
  animate: boolean;
}

export interface SessionActivity {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location: {
    city: string;
    region: string;
    country: string;
  };
}

// Net Worth Types
export interface Account {
  _id?: string;
  name: string;
  amount: number;
  category:
    | 'bank'
    | 'credit card'
    | 'loan'
    | 'investment'
    | 'retirement'
    | 'insurance'
    | 'crypto'
    | 'misc';
  manuallyAdded: boolean;
}

export interface CustomField {
  _id?: string;
  name: string;
  amount: number;
  type: 'asset' | 'liability';
}

export interface NetWorth {
  _id?: string;
  user: string;
  date: string | Date;
  cash: number;
  investments: number;
  realEstate: number;
  retirementAccounts: number;
  vehicles: number;
  personalProperty: number;
  otherAssets: number;
  liabilities: number;
  customFields: CustomField[];
  accounts: Account[];
  netWorth: number;
}

// Real Estate Types
export interface RentCollection {
  [date: string]: {
    amount: number;
    collected: boolean;
  };
}

export interface Expense {
  _id?: string;
  user?: string;
  date: string | Date;
  amount: number;
  description: string;
  category: string;
}

export interface Unit {
  _id?: string;
  name: string;
  rentAmount: number;
  tenant: string;
}

export interface Vacancy {
  _id?: string;
  startDate: string | Date;
  endDate: string | Date;
}

export interface Document {
  _id?: string;
  name: string;
  type: string;
  path: string;
}

export interface ShortTermIncome {
  _id?: string;
  date: string | Date;
  amount: number;
  notes?: string;
}

export interface RealEstate {
  _id?: string;
  userId: string;
  url: string;
  propertyAddress: string;
  purchaseDate: Date | string;
  purchasePrice: number;
  value: number;
  mortgageBalance: number;
  propertyType:
    | 'Long-Term Rental'
    | 'Short-Term Rental'
    | 'Primary Residence'
    | 'Vacation Home';
  rentCollected: RentCollection;
  expenses: Expense[];
  documents: Document[];
  units: Unit[];
  vacancies: Vacancy[];
  shortTermIncome: ShortTermIncome[];
  appreciation?: number;
}

// Retirement Types
export interface RetirementGoals {
  _id?: string;
  userId: string;
  currentAge: number;
  retirementAge: number;
  monthlySpend: number;
  mortgage: number;
  cars: number;
  healthCare: number;
  foodAndDrinks: number;
  travelAndEntertainment: number;
  reinvestedFunds: number;
}

// Budgeting Types
export interface SavingsGoal {
  _id?: string;
  user?: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string | Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Dashboard: undefined;
  Accounts: undefined;
  Budgeting: undefined;
  RealEstate: undefined;
  Retirement: undefined;
  Profile: undefined;
  AddEntry: undefined;
  EditEntry: {entryId: string};
  Settings: undefined;
  Transactions: { accountId: string; accountName: string };
  Expenses: undefined;
  SavingsGoals: undefined;
  PropertyDetail: { property: RealEstate };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Accounts: undefined;
  Budgeting: undefined;
  RealEstate: undefined;
  Retirement: undefined;
  Profile: undefined;
  Expenses: undefined;
  SavingsGoals: undefined;
};
