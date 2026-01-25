
export interface Income {
  id: string;
  name: string;
  value: number;
  expectedDate: string;
  isActive?: boolean;
}

export interface FixedExpense {
  id: string;
  name: string;
  value: number;
  paidAmount?: number;
  dueDate: string; 
  installmentsCount?: number;
  isActive?: boolean;
}

export interface SectionItem {
  id: string;
  name: string;
  value: number;
  paidAmount?: number;
  date?: string;
  installmentsCount?: number;
  isActive?: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  items: SectionItem[];
  type: 'income' | 'expense';
  structure: 'standard' | 'installment';
}

export interface InstallmentExpense {
  id: string;
  name: string;
  monthlyValue: number;
  paidAmount?: number;
  installmentsCount: number;
  startMonth: string;
  isActive?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceValue: number;
}

export interface PixKey {
  id: string;
  type: 'CPF' | 'CNPJ' | 'Telefone' | 'Email' | 'Aleatória';
  key: string;
  beneficiary?: string;
  active: boolean;
}

export interface RadarItem {
  id: string;
  name: string;
  value: number;
}

export interface DreamItem {
  id: string;
  name: string;
  value: number;
  isActive: boolean;
}

export interface FinancialData {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  customSections: CustomSection[];
  installments: InstallmentExpense[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  radarItems: RadarItem[];
  dreams: DreamItem[];
  dreamsTotalBudget: number;
  modulesOrder?: string[];
  incomeModulesOrder?: string[];
  lastUpdate?: number;
}

export const INITIAL_DATA: FinancialData = {
  incomes: [],
  fixedExpenses: [],
  customSections: [], 
  installments: [],
  creditCards: [],
  pixKeys: [],
  radarItems: [],
  dreams: [],
  dreamsTotalBudget: 0,
  modulesOrder: ['fixed', 'installments'],
  incomeModulesOrder: ['incomes'],
  lastUpdate: 0,
};
