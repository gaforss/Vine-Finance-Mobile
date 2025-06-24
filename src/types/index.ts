// User Types
export interface User {
  _id: string;
  googleId?: string;
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  isNewUser: boolean;
  onboardingSteps: OnboardingStep[];
  onboardingCompletion: {
    [key: string]: boolean;
  };
  hasDeletedDummyData: boolean;
  sessions: Session[];
  createdAt: string | Date;
}

export interface Transaction {
  _id: string;
  user: string;
  account: string;
  name: string;
  amount: number;
  date: string | Date;
  category: string[];
  pending: boolean;
}

export interface OnboardingStep {
  title: string;
  description: string;
  completed: boolean;
  icon: string;
  animate?: boolean;
  templateLink?: boolean;
}

export interface Session {
  _id: string;
  timestamp: string;
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
  institutionName?: string;
  mask?: string;
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
  annualSavings?: number;
  currentNetWorth?: number;
}

export interface RetirementProjectionYear {
  year: number;
  value: number;
}

export interface RetirementProjection {
  rate: number;
  data: RetirementProjectionYear[];
  currentAge: number;
  retirementAge: number;
}

export interface RetirementProjectionsResult {
  projections: RetirementProjection[];
  currentNetWorth: number;
  totalAtRetirement: number;
  intersectionAge: number | string;
  goalMet: boolean;
  shortfall: number;
  requiredSavings: number;
}

export interface NetWorthComparisonResult {
  userNetWorth: number;
  ageGroupAverage: number;
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
  Transactions: {accountId: string; accountName: string};
  Expenses: undefined;
  SavingsGoals: undefined;
  PropertyDetail: {
    property: RealEstate;
    expenses: any[];
    onRefreshExpenses: () => void;
    onDeleteExpense: (expense: any) => void;
    onEditExpense: (expense: any) => void;
  };
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
