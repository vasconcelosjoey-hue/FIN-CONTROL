
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

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  color: 'blue' | 'pink' | 'green' | 'yellow';
  deadline?: string;
}

export interface FinancialData {
  customSections: CustomSection[];
  creditCards: CreditCard[];
  pixKeys: PixKey[];
  radarItems: RadarItem[];
  dreams: DreamItem[];
  goals: Goal[];
  dreamsTotalBudget: number;
  sectionsOrder?: string[];
  lastUpdate?: number;
}

export const NATIVE_WALLET_ID = "native-wallet-session";

export const INITIAL_DATA: FinancialData = {
  customSections: [
    {
      id: NATIVE_WALLET_ID,
      title: "WALLET",
      items: [],
      type: 'income',
      structure: 'standard'
    }
  ], 
  creditCards: [],
  pixKeys: [],
  radarItems: [],
  dreams: [],
  goals: [],
  dreamsTotalBudget: 0,
  sectionsOrder: [NATIVE_WALLET_ID],
  lastUpdate: 0,
};
