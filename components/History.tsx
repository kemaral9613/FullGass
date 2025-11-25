import React, { useState } from 'react';
import { FuelRecord, Language } from '../types';
import { TRANSLATIONS, formatCurrency } from '../constants';
import { Edit2, Trash2, Search, Droplet, Gauge } from 'lucide-react';

interface HistoryProps {
  records: FuelRecord[];
  lang: Language;
  onEdit: (record: FuelRecord) => void;
  onDelete: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ records, lang, onEdit, onDelete }) => {
  const t = TRANSLATIONS[lang];
  const [searchTerm, setSearchTerm] = useState('');

  const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const filteredRecords = sortedRecords.filter(r => 
    r.date.includes(searchTerm) || 
    r.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.odometer.toString().includes(searchTerm)
  );

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pt-2 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search date, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t.noRecords}</p>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-2">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString(lang, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h4>
                  {record.notes && <p className="text-xs text-gray-500 mt-1 italic">{record.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(record)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(record.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs flex items-center gap-1"><Gauge size={10} /> {t.odometer}</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{record.odometer.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs flex items-center gap-1"><Droplet size={10} /> {t.gallons}</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{record.gallons.toFixed(2)}</span>
                </div>
                <div className="flex flex-col text-right">
                   <span className="text-gray-400 text-xs">{t.totalCost}</span>
                   <span className="font-bold text-brand-600 dark:text-brand-400 text-base">
                     {formatCurrency(record.totalCost, lang)}
                   </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;