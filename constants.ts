
import { Language, TranslationKey } from './types';

export const TRANSLATIONS: Record<Language, Record<TranslationKey | string, string>> = {
  es: {
    appTitle: 'Control de Combustible',
    dashboard: 'Panel',
    addRecord: 'Nuevo',
    history: 'Historial',
    settings: 'Ajustes',
    date: 'Fecha',
    odometer: 'Kilometraje',
    gallons: 'Galones',
    pricePerGallon: 'Precio/Galón',
    totalCost: 'Costo Total',
    notes: 'Notas',
    save: 'Guardar Registro',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    totalSpent: 'Gasto Total',
    avgConsumption: 'Rendimiento Prom.',
    costPerKm: 'Costo por Km',
    lastRefuel: 'Última Carga',
    monthlyExpenses: 'Gastos Mensuales',
    priceTrend: 'Tendencia de Precios',
    consumptionTrend: 'Tendencia de Consumo',
    importData: 'Importar Datos (JSON)',
    exportData: 'Exportar Datos (JSON)',
    theme: 'Tema',
    language: 'Idioma',
    noRecords: 'No hay registros aún. Agrega el primero.',
    confirmDelete: '¿Estás seguro de eliminar este registro?',
    fillRequired: 'Por favor completa todos los campos requeridos.',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    priceVariation: 'Variación de Precio',
    recordsList: 'Lista de Registros',
    aiTitle: 'Análisis Inteligente',
    aiDesc: 'Utiliza la IA de Gemini para analizar tus hábitos de consumo y recibir consejos personalizados.',
    analyzeBtn: 'Analizar Datos',
    analyzing: 'Analizando...',
    aiDisclaimer: 'La IA puede cometer errores. Verifica la información importante.',
    aiError: 'Hubo un error al generar el análisis. Por favor intenta de nuevo.',
    // Dashboard specific
    allTime: 'Todo',
    lastWeek: 'Semana',
    last30Days: '30 Días',
    last6Months: '6 Meses',
    thisYear: 'Este Año',
    customRange: 'Rango',
    from: 'Desde',
    to: 'Hasta',
    cost: 'Costo',
    volume: 'Volumen',
    statsFor: 'Estadísticas para',
    chartType: 'Ver por',
    price: 'Precio',
    efficiency: 'Eficiencia',
    efficiencyTrend: 'Eficiencia'
  },
  en: {
    appTitle: 'Fuel Tracker',
    dashboard: 'Dashboard',
    addRecord: 'New',
    history: 'History',
    settings: 'Settings',
    date: 'Date',
    odometer: 'Odometer',
    gallons: 'Gallons',
    pricePerGallon: 'Price/Gallon',
    totalCost: 'Total Cost',
    notes: 'Notes',
    save: 'Save Record',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    totalSpent: 'Total Spent',
    avgConsumption: 'Avg. Efficiency',
    costPerKm: 'Cost per Km',
    lastRefuel: 'Last Refuel',
    monthlyExpenses: 'Monthly Expenses',
    priceTrend: 'Price Trend',
    consumptionTrend: 'Efficiency Trend',
    importData: 'Import Data (JSON)',
    exportData: 'Export Data (JSON)',
    theme: 'Theme',
    language: 'Language',
    noRecords: 'No records yet. Add your first one.',
    confirmDelete: 'Are you sure you want to delete this record?',
    fillRequired: 'Please fill in all required fields.',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    priceVariation: 'Price Variation',
    recordsList: 'Records List',
    aiTitle: 'Smart Analysis',
    aiDesc: 'Use Gemini AI to analyze your consumption habits and get personalized advice.',
    analyzeBtn: 'Analyze Data',
    analyzing: 'Analyzing...',
    aiDisclaimer: 'AI can make mistakes. Please verify important information.',
    aiError: 'There was an error generating the analysis. Please try again.',
    // Dashboard specific
    allTime: 'All Time',
    lastWeek: 'Week',
    last30Days: '30 Days',
    last6Months: '6 Months',
    thisYear: 'This Year',
    customRange: 'Custom',
    from: 'From',
    to: 'To',
    cost: 'Cost',
    volume: 'Volume',
    statsFor: 'Statistics for',
    chartType: 'View by',
    price: 'Price',
    efficiency: 'Efficiency',
    efficiencyTrend: 'Efficiency'
  }
};

// Helper to get local date string YYYY-MM-DD
export const getLocalDate = (dateObj = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format currency with thousands separators
// e.g. 15500 -> $15.500,00 (es) or $15,500.00 (en)
export const formatCurrency = (amount: number, lang: Language) => {
  // Use 'de-DE' for Spanish to get dots for thousands (1.234,56)
  // Use 'en-US' for English (1,234.56)
  const locale = lang === 'es' ? 'de-DE' : 'en-US'; 
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `$${formattedNumber}`;
};

export const INITIAL_RECORD = {
  id: '',
  date: getLocalDate(),
  odometer: 0,
  gallons: 0,
  pricePerGallon: 0,
  totalCost: 0,
  notes: ''
};
