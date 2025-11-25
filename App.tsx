import React, { useState, useEffect } from 'react';
import { FuelRecord, Language, Theme, View } from './types.ts';
import { TRANSLATIONS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import EntryForm from './components/EntryForm.tsx';
import History from './components/History.tsx';
import Settings from './components/Settings.tsx';
import AIAnalysis from './components/AIAnalysis.tsx';
import { LayoutDashboard, PlusCircle, History as HistoryIcon, Settings as SettingsIcon, Fuel, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  // --- State Management ---
  const [lang, setLang] = useState<Language>(() => 
    (localStorage.getItem('fuelApp_lang') as Language) || 'es'
  );
  
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('fuelApp_theme') as Theme) || 'light'
  );

  const [records, setRecords] = useState<FuelRecord[]>(() => {
    const saved = localStorage.getItem('fuelApp_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('fuelApp_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('fuelApp_theme', theme);
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fuelApp_records', JSON.stringify(records));
  }, [records]);

  // --- Handlers ---
  const handleSaveRecord = (record: FuelRecord) => {
    setRecords(prev => {
      const exists = prev.find(r => r.id === record.id);
      if (exists) {
        return prev.map(r => r.id === record.id ? record : r);
      }
      return [...prev, record];
    });
    setEditingRecord(null);
    setCurrentView('dashboard');
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleEditRecord = (record: FuelRecord) => {
    setEditingRecord(record);
    setCurrentView('add');
  };

  const handleImport = (importedRecords: FuelRecord[]) => {
    // Merge strategy: Filter out existing IDs to prevent duplicates if user imports same file,
    // but overwrite if ID exists (handled by map logic if we were strictly updating, but here we prioritize import).
    // Let's replace simple duplicates or concat.
    // Ideally for "sync", we merge unique IDs.
    const currentIds = new Set(records.map(r => r.id));
    const newRecords = importedRecords.filter(r => !currentIds.has(r.id));
    setRecords([...records, ...newRecords]);
  };

  const t = TRANSLATIONS[lang];

  // --- Navigation Component ---
  const NavItem = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => {
        if (view === 'add') setEditingRecord(null);
        setCurrentView(view);
      }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
        currentView === view 
          ? 'text-brand-600 dark:text-brand-400' 
          : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
      }`}
    >
      <div className={`p-1 rounded-xl ${currentView === view ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-2 rounded-lg">
             <Fuel size={20} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
            FuelTrack
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 min-h-[calc(100vh-140px)]">
        {currentView === 'dashboard' && <Dashboard records={records} lang={lang} />}
        {currentView === 'add' && (
          <EntryForm 
            onSave={handleSaveRecord} 
            onCancel={() => {
              setEditingRecord(null);
              setCurrentView('dashboard');
            }} 
            lang={lang} 
            initialData={editingRecord} 
          />
        )}
        {currentView === 'history' && (
          <History 
            records={records} 
            lang={lang} 
            onEdit={handleEditRecord} 
            onDelete={handleDeleteRecord} 
          />
        )}
        {currentView === 'ai' && (
          <AIAnalysis 
            records={records}
            lang={lang}
          />
        )}
        {currentView === 'settings' && (
          <Settings 
            lang={lang} 
            setLang={setLang} 
            theme={theme} 
            setTheme={setTheme} 
            records={records}
            onImport={handleImport}
          />
        )}
      </main>

      {/* Bottom Navigation (Mobile Optimized) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe-area">
        <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
          <NavItem view="dashboard" icon={<LayoutDashboard size={24} />} label={t.dashboard} />
          <NavItem view="history" icon={<HistoryIcon size={24} />} label={t.history} />
          
          {/* Floating Action Button-ish look for Add */}
          <button
            onClick={() => {
              setEditingRecord(null);
              setCurrentView('add');
            }}
            className="flex flex-col items-center justify-center -mt-6"
          >
            <div className={`p-4 rounded-full shadow-lg shadow-brand-500/30 transition-transform active:scale-95 ${
              currentView === 'add' 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-brand-700' 
                : 'bg-brand-600 text-white'
            }`}>
              <PlusCircle size={28} />
            </div>
            <span className={`text-[10px] font-medium mt-1 ${currentView === 'add' ? 'text-brand-600' : 'text-gray-400'}`}>
              {t.addRecord}
            </span>
          </button>

          <NavItem view="ai" icon={<Sparkles size={24} />} label="AI" />
          <NavItem view="settings" icon={<SettingsIcon size={24} />} label={t.settings} />
        </div>
      </nav>
    </div>
  );
};

export default App;