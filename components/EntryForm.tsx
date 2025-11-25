import React, { useState, useEffect } from 'react';
import { FuelRecord, Language } from '../types.ts';
import { TRANSLATIONS, INITIAL_RECORD, formatCurrency } from '../constants.ts';
import { Save, X } from 'lucide-react';

interface EntryFormProps {
  onSave: (record: FuelRecord) => void;
  onCancel: () => void;
  lang: Language;
  initialData?: FuelRecord | null;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSave, onCancel, lang, initialData }) => {
  const t = TRANSLATIONS[lang];
  const [formData, setFormData] = useState<FuelRecord>(initialData || { ...INITIAL_RECORD, id: crypto.randomUUID() });

  // Auto-calculate total cost when gallons or price changes
  useEffect(() => {
    if (formData.gallons > 0 && formData.pricePerGallon > 0) {
      setFormData(prev => ({
        ...prev,
        totalCost: parseFloat((prev.gallons * prev.pricePerGallon).toFixed(2))
      }));
    }
  }, [formData.gallons, formData.pricePerGallon]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numFields = ['odometer', 'gallons', 'pricePerGallon', 'totalCost'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || formData.odometer <= 0 || formData.gallons <= 0 || formData.pricePerGallon <= 0) {
      alert(t.fillRequired);
      return;
    }
    onSave(formData);
  };

  return (
    <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {initialData ? t.edit : t.addRecord}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.date}</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.odometer}</label>
            <input 
              type="number" 
              name="odometer"
              value={formData.odometer || ''}
              onChange={handleChange}
              placeholder="e.g. 10500"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.gallons}</label>
              <input 
                type="number" 
                name="gallons"
                step="0.01"
                value={formData.gallons || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.pricePerGallon}</label>
              <input 
                type="number" 
                name="pricePerGallon"
                step="0.001"
                value={formData.pricePerGallon || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.totalCost}</label>
            <div className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-mono font-bold text-lg">
              {formatCurrency(formData.totalCost, lang)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.notes}</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              <X size={20} />
              {t.cancel}
            </button>
            <button 
              type="submit" 
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-md shadow-brand-500/30 transition-all active:scale-[0.98]"
            >
              <Save size={20} />
              {t.save}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EntryForm;