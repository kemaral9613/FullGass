import React, { useRef } from 'react';
import { FuelRecord, Language, Theme } from '../types';
import { TRANSLATIONS } from '../constants';
import { Moon, Sun, Globe, Download, Upload, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  records: FuelRecord[];
  onImport: (data: FuelRecord[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ lang, setLang, theme, setTheme, records, onImport }) => {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(records, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fueltrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            // Simple validation could be added here
            if (window.confirm('Importing will overwrite current data if IDs match or append new ones. Continue?')) {
              onImport(parsed);
              alert('Success!');
            }
          } else {
            alert('Invalid format');
          }
        } catch (error) {
          alert('Error parsing JSON');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      
      {/* Theme */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">{t.theme}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setTheme('light')}
            className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-brand-100 text-brand-700 border-2 border-brand-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            <Sun size={20} /> Light
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-brand-900 text-brand-100 border-2 border-brand-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            <Moon size={20} /> Dark
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">{t.language}</h3>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setLang('es')}
            className={`w-full p-3 text-left rounded-lg flex items-center gap-3 transition-all ${lang === 'es' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="text-2xl">🇪🇸</span> Español
          </button>
          <button 
            onClick={() => setLang('en')}
            className={`w-full p-3 text-left rounded-lg flex items-center gap-3 transition-all ${lang === 'en' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="text-2xl">🇺🇸</span> English
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Data Sync</h3>
        <div className="space-y-3">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            <span className="flex items-center gap-3 font-medium"><Download size={20} className="text-blue-500" /> {t.exportData}</span>
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">JSON</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
             <span className="flex items-center gap-3 font-medium"><Upload size={20} className="text-green-500" /> {t.importData}</span>
             <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">JSON</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
          
          <div className="flex gap-2 items-start mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>Use Export/Import to sync data between devices. E.g., Export from phone, send file to laptop, Import on laptop.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
