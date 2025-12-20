
export interface Income {
  id: string;
  name: string;
  value: number;
  expectedDate: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  value: number;
  paidAmount?: number; // Novo campo para pagamento parcial
  dueDate: string;
  installmentsCount?: number;
  startMonth?: string;
}

export interface SectionItem {
  id: string;
  name: string;
  value: number;
  paidAmount?: number; // Novo campo para pagamento parcial
  date?: string;
  installmentsCount?: number;
  startMonth?: string;
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
  paidAmount?: number; // Novo campo para pagamento parcial
  installmentsCount: number;
  startMonth: string;
  totalValue?: number;
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

export interface FinancialData {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  customSections: CustomSection[];
  installments: InstallmentExpense[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  radarItems: RadarItem[];
  modulesOrder?: string[];
  incomeModulesOrder?: string[];
  settings?: {
    userName?: string;
  };
}

export const INITIAL_DATA: FinancialData = {
  incomes: [],
  fixedExpenses: [],
  customSections: [], 
  installments: [],
  creditCards: [],
  pixKeys: [],
  radarItems: [],
  modulesOrder: ['fixed', 'installments'],
  incomeModulesOrder: ['incomes'],
};
