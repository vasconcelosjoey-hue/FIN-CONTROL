
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
  dueDate: string; // YYYY-MM-DD
}

// Generic item for custom sections
export interface SectionItem {
  id: string;
  name: string;
  value: number;
  date?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: SectionItem[];
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
  currentInvoiceValue: number;
}

export interface PixKey {
  id: string;
  type: 'CPF' | 'CNPJ' | 'Telefone' | 'Email' | 'Aleatória';
  key: string;
  beneficiary?: string; // New field
  active: boolean;
}

export interface RadarItem {
  id: string;
  name: string;
  value: number;
}

export interface FinancialData {
  incomes: Income[];
  fixedExpenses: FixedExpense[]; // Renamed to "Contas Pessoais" in UI
  customSections: CustomSection[]; // New dynamic sections (e.g. CBMC)
  installments: InstallmentExpense[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  radarItems: RadarItem[]; // New "No Radar" items
  modulesOrder?: string[]; // Order of modules in the expense column
  settings?: {
    userName?: string;
  };
}

export const INITIAL_DATA: FinancialData = {
  incomes: [],
  fixedExpenses: [],
  customSections: [], // Start empty, user can add "CBMC MENSALIDADE"
  installments: [],
  creditCards: [],
  pixKeys: [],
  radarItems: [],
  modulesOrder: ['fixed', 'installments'], // Default order
};
