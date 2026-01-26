
export interface SectionItem {
  id: string;
  name: string;
  value: number;
  paidAmount?: number;
  date?: string;
  installmentsCount?: number; // Total de parcelas
  currentInstallment?: number; // Parcela atual (calculada ou manual)
  startMonth?: string;
  isActive?: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  items: SectionItem[];
  type: 'income' | 'expense';
  structure: 'standard' | 'installment';
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
  customSections: CustomSection[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  radarItems: RadarItem[];
  dreams: DreamItem[];
  dreamsTotalBudget: number;
  sectionsOrder?: string[];
  lastUpdate?: number;
}

export const INITIAL_DATA: FinancialData = {
  customSections: [], 
  creditCards: [],
  pixKeys: [],
  radarItems: [],
  dreams: [],
  dreamsTotalBudget: 0,
  sectionsOrder: [],
  lastUpdate: 0,
};
