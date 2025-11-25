
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { FuelRecord, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Sparkles, Loader2, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';

interface AIAnalysisProps {
  records: FuelRecord[];
  lang: Language;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ records, lang }) => {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState(false);
  
  // Initialize from localStorage to persist data across view changes
  const [analysis, setAnalysis] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fuelApp_lastAnalysis');
    } catch (e) {
      return null;
    }
  });
  
  const [error, setError] = useState(false);

  const calculateStats = () => {
    // Sort chronologically
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let totalDist = 0;
    let totalGallons = 0;
    let totalPrice = 0;
    
    // Calculate efficiencies per interval
    const intervals: { date: string, efficiency: number, price: number }[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const prev = sorted[i-1];
      const dist = current.odometer - prev.odometer;
      
      if (dist > 0 && current.gallons > 0) {
        const eff = dist / current.gallons;
        intervals.push({
          date: current.date,
          efficiency: eff,
          price: current.pricePerGallon
        });
        totalDist += dist;
        totalGallons += current.gallons;
        totalPrice += current.pricePerGallon; // Sum for simple avg price
      }
    }

    if (intervals.length === 0) return null;

    const avgEfficiency = totalDist / totalGallons;
    const avgPrice = sorted.length > 0 ? (sorted.reduce((acc, r) => acc + r.pricePerGallon, 0) / sorted.length) : 0;

    // Trend Analysis (Last 3 vs Previous 3)
    const recentCount = Math.min(3, Math.floor(intervals.length / 2));
    let trend = "stable";
    let recentAvg = 0;
    let previousAvg = 0;

    if (recentCount > 0) {
      const recent = intervals.slice(-recentCount);
      const previous = intervals.slice(-recentCount * 2, -recentCount);
      
      recentAvg = recent.reduce((acc, curr) => acc + curr.efficiency, 0) / recentCount;
      
      if (previous.length > 0) {
        previousAvg = previous.reduce((acc, curr) => acc + curr.efficiency, 0) / previous.length;
        const diff = recentAvg - previousAvg;
        if (diff > (previousAvg * 0.05)) trend = "improving";
        else if (diff < -(previousAvg * 0.05)) trend = "worsening";
      }
    }

    return {
      totalRecords: sorted.length,
      avgEfficiency: avgEfficiency.toFixed(2),
      avgPrice: avgPrice.toFixed(2),
      recentAvgEfficiency: recentAvg.toFixed(2),
      previousAvgEfficiency: previousAvg.toFixed(2),
      trend, // "improving", "worsening", "stable"
      lastPrice: sorted[sorted.length - 1].pricePerGallon,
      firstPrice: sorted[0].pricePerGallon
    };
  };

  const handleAnalyze = async () => {
    if (records.length < 2) {
      const msg = lang === 'es' 
        ? "Necesito al menos 2 registros para calcular tendencias de consumo." 
        : "I need at least 2 records to calculate consumption trends.";
      setAnalysis(msg);
      // We don't save error messages as permanent analysis, or we could if desired.
      return;
    }

    const stats = calculateStats();
    if (!stats) return;

    setLoading(true);
    setError(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // We pass the PRE-CALCULATED stats to the AI so it doesn't fail at math.
      const systemPrompt = lang === 'es' 
        ? `Actúa como un experto en mecánica. Tienes los siguientes DATOS REALES calculados (no los recalcules):
           - Eficiencia Promedio Histórica: ${stats.avgEfficiency} km/gal.
           - Eficiencia Reciente (últimas cargas): ${stats.recentAvgEfficiency} km/gal.
           - Eficiencia Anterior: ${stats.previousAvgEfficiency} km/gal.
           - Tendencia detectada: ${stats.trend === 'improving' ? 'Mejorando' : stats.trend === 'worsening' ? 'Empeorando' : 'Estable'}.
           - Precio Promedio: $${stats.avgPrice}.
           - Precio Actual: $${stats.lastPrice}.
           
           Basado EXCLUSIVAMENTE en estos datos:
           1. Explica la tendencia de eficiencia (¿por qué es bueno o malo?).
           2. Comenta brevemente sobre el costo (si el precio actual es mayor al promedio).
           3. Dame 3 consejos breves para este conductor específico.
           
           IMPORTANTE: Usa formato Markdown simple. Usa **negritas** para resaltar datos. Usa listas con guiones (-). NO uses etiquetas HTML.`
        : `Act as a mechanic. You have these REAL CALCULATED DATA (do not recalculate):
           - Historial Avg Efficiency: ${stats.avgEfficiency} km/gal (or mi/gal).
           - Recent Efficiency: ${stats.recentAvgEfficiency}.
           - Previous Efficiency: ${stats.previousAvgEfficiency}.
           - Trend: ${stats.trend}.
           - Avg Price: $${stats.avgPrice}.
           - Current Price: $${stats.lastPrice}.
           
           Based EXCLUSIVAMENTE on this:
           1. Explain the efficiency trend.
           2. Comment on cost (current vs avg).
           3. Give 3 short tips.
           
           IMPORTANT: Use simple Markdown. Use **bold** for highlights. Use lists with dashes (-). DO NOT use HTML tags.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: systemPrompt,
      });

      const resultText = response.text || "No response generated.";
      setAnalysis(resultText);
      localStorage.setItem('fuelApp_lastAnalysis', resultText);
      
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Improved Markdown Parser: Returns React Nodes, not HTML strings.
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-gray-900 dark:text-gray-100 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50)) {
        const content = trimmed.replace(/#/g, '').replace(/\*\*/g, '');
        return <h4 key={i} className="font-bold text-lg mt-4 mb-2 text-brand-700 dark:text-brand-400">{content}</h4>;
      }

      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
        const content = trimmed.replace(/^[-*]|\d+\./, '').trim();
        return (
          <li key={i} className="ml-4 mb-1 text-gray-700 dark:text-gray-300 list-disc pl-1 marker:text-brand-500">
            {parseBold(content)}
          </li>
        );
      }

      // Empty lines
      if (trimmed === '') return <div key={i} className="h-2" />;
      
      // Paragraphs
      return (
        <p key={i} className="mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">
          {parseBold(line)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles size={24} className="text-yellow-300" />
          </div>
          <h2 className="text-xl font-bold">{t.aiTitle}</h2>
        </div>
        <p className="text-brand-100 mb-6 leading-relaxed">
          {t.aiDesc}
        </p>
        
        <button
          onClick={handleAnalyze}
          disabled={loading || records.length < 2}
          className="w-full bg-white text-brand-700 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-brand-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {t.analyzing}
            </>
          ) : (
            <>
              <Sparkles size={20} />
              {t.analyzeBtn}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
          <AlertTriangle size={24} />
          <p>{t.aiError}</p>
        </div>
      )}

      {analysis && (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${loading ? 'opacity-60 grayscale-[0.5]' : ''}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t.aiTitle} Results</h3>
            {loading && <span className="text-xs text-brand-600 animate-pulse ml-auto">Updating...</span>}
          </div>
          <div className="p-6">
            <div className="prose dark:prose-invert max-w-none text-sm">
              {renderMarkdown(analysis)}
            </div>
            <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <Lightbulb size={14} className="mt-0.5 shrink-0" />
              <p>{t.aiDisclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
