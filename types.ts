
export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';
export type View = 'dashboard' | 'add' | 'history' | 'settings' | 'ai';

export interface FuelRecord {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  odometer: number;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  notes?: string;
}

export interface AppSettings {
  language: Language;
  theme: Theme;
  currency: string;
  distanceUnit: 'km' | 'mi';
  volumeUnit: 'gal' | 'l';
}

export interface ProcessedStats {
  totalDistance: number;
  totalCost: number;
  totalGallons: number;
  avgConsumption: number; // distance / volume
  avgCostPerUnit: number; // cost / distance
  lastRefuelDate: string | null;
}

export type TranslationKey = 
  | 'dashboard' | 'addRecord' | 'history' | 'settings'
  | 'date' | 'odometer' | 'gallons' | 'pricePerGallon' | 'totalCost' | 'notes'
  | 'save' | 'cancel' | 'delete' | 'edit'
  | 'totalSpent' | 'avgConsumption' | 'costPerKm' | 'lastRefuel'
  | 'monthlyExpenses' | 'priceTrend' | 'consumptionTrend'
  | 'importData' | 'exportData' | 'theme' | 'language'
  | 'noRecords' | 'confirmDelete' | 'fillRequired'
  | 'daily' | 'weekly' | 'monthly'
  | 'priceVariation' | 'appTitle' | 'recordsList'
  | 'aiTitle' | 'aiDesc' | 'analyzeBtn' | 'analyzing' | 'aiDisclaimer' | 'aiError'
  // New keys below
  | 'lastWeek' | 'customRange' | 'from' | 'to';
