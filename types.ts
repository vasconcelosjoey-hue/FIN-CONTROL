export interface Income {
  id: string;
  name: string;
  value: number;
  expectedDate: string; // YYYY-MM-DD
}

export interface FixedExpense {
  id: string;
  name: string;
  value: number;
  dueDate: string; // Day of month as string usually, or full date. Let's use YYYY-MM-DD for simplicity in sorting, but visually show Day.
}

export interface InstallmentExpense {
  id: string;
  name: string;
  totalValue: number;
  installmentsCount: number;
  startMonth: string; // YYYY-MM
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  currentInvoiceValue: number; // Manually tracked or calculated from expenses linked to card (simplified to manual for this prompt)
}

export interface PixKey {
  id: string;
  type: 'CPF' | 'CNPJ' | 'Telefone' | 'Email' | 'Aleatória';
  key: string;
  active: boolean;
}

export interface FinancialData {
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  installments: InstallmentExpense[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  settings?: {
    userName?: string;
  };
}

export const INITIAL_DATA: FinancialData = {
  incomes: [],
  fixedExpenses: [],
  installments: [],
  creditCards: [],
  pixKeys: [],
};