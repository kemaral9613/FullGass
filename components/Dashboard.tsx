
import React, { useMemo, useState } from 'react';
import { FuelRecord, Language } from '../types';
import { TRANSLATIONS, formatCurrency, getLocalDate } from '../constants';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { TrendingUp, DollarSign, Activity, Calendar, Droplet, Gauge, Filter } from 'lucide-react';

interface DashboardProps {
  records: FuelRecord[];
  lang: Language;
}

type TimeRange = 'week' | '30d' | '6m' | 'year' | 'all' | 'custom';
type ChartMode = 'cost' | 'volume';
type TrendMode = 'price' | 'efficiency';

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
}> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ records, lang }) => {
  const t = TRANSLATIONS[lang];
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [chartMode, setChartMode] = useState<ChartMode>('cost');
  const [trendMode, setTrendMode] = useState<TrendMode>('price');
  
  // Custom date state (defaults to current month)
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return getLocalDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => getLocalDate());

  const { stats, barChartData, trendChartData, isDailyView } = useMemo(() => {
    // 1. Sort all records
    const sortedAll = [...records].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 2. Filter records
    const now = new Date();
    // Reset time part for cleaner comparisons
    now.setHours(0,0,0,0);

    const filteredRecords = sortedAll.filter(r => {
      const date = new Date(r.date + 'T00:00:00'); // Ensure local time parsing
      
      if (timeRange === 'all') return true;
      if (timeRange === 'custom') {
        return r.date >= customStart && r.date <= customEnd;
      }

      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (timeRange === 'week') return diffDays >= 0 && diffDays <= 7;
      if (timeRange === '30d') return diffDays >= 0 && diffDays <= 30;
      if (timeRange === '6m') return diffDays >= 0 && diffDays <= 180;
      if (timeRange === 'year') return date.getFullYear() === now.getFullYear();
      
      return true;
    });

    // 3. Process data for stats and charts
    let totalDist = 0;
    let totalCost = 0;
    let totalGallons = 0;
    let weightedEfficiencySum = 0;
    let weightedEfficiencyCount = 0;

    const processedForCharts = filteredRecords.map((record) => {
      const originalIndex = sortedAll.findIndex(r => r.id === record.id);
      let efficiency = 0;
      let dist = 0;

      if (originalIndex > 0) {
        const prev = sortedAll[originalIndex - 1];
        dist = record.odometer - prev.odometer;
        if (dist > 0 && record.gallons > 0) {
          efficiency = dist / record.gallons;
        }
      }

      return {
        ...record,
        dist,
        efficiency,
        dateObj: new Date(record.date + 'T00:00:00')
      };
    });

    processedForCharts.forEach(r => {
      totalCost += r.totalCost;
      totalGallons += r.gallons;
      totalDist += r.dist;
      if (r.efficiency > 0) {
        weightedEfficiencySum += r.efficiency * r.gallons;
        weightedEfficiencyCount += r.gallons;
      }
    });

    const avgConsumption = weightedEfficiencyCount > 0 
      ? weightedEfficiencySum / weightedEfficiencyCount 
      : 0;

    const avgCostPerUnit = totalDist > 0 ? totalCost / totalDist : 0;

    // 4. Grouping logic for Bar Chart (Daily vs Monthly)
    let dynamicDailyView = false;
    if (timeRange === 'week' || timeRange === '30d') {
      dynamicDailyView = true;
    } else if (timeRange === 'custom') {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 45) dynamicDailyView = true;
    }

    const groupedData: Record<string, { cost: number; volume: number; label: string; order: number }> = {};

    processedForCharts.forEach(r => {
      let key: string;
      let label: string;
      const d = r.dateObj;

      if (dynamicDailyView) {
        key = r.date; // YYYY-MM-DD
        label = d.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
      } else {
        key = `${d.getFullYear()}-${d.getMonth()}`;
        label = d.toLocaleDateString(lang, { month: 'short', year: '2-digit' });
      }

      if (!groupedData[key]) {
        groupedData[key] = { 
          cost: 0, 
          volume: 0, 
          label,
          order: d.getTime()
        };
      }
      groupedData[key].cost += r.totalCost;
      groupedData[key].volume += r.gallons;
    });

    const barChartArray = Object.values(groupedData)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        name: item.label,
        value: chartMode === 'cost' ? parseFloat(item.cost.toFixed(2)) : parseFloat(item.volume.toFixed(2))
      }));

    // 5. Trend Chart Data (Price & Efficiency)
    const trendArray = processedForCharts
      .filter(r => trendMode === 'price' || r.efficiency > 0) // Hide zero efficiency points
      .map(r => {
        return {
            name: r.dateObj.toLocaleDateString(lang, { month: 'short', day: 'numeric' }),
            value: trendMode === 'price' ? r.pricePerGallon : parseFloat(r.efficiency.toFixed(2))
        };
      });

    return {
      stats: {
        totalCost,
        avgConsumption,
        avgCostPerUnit,
        lastRefuelDate: filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].date : null
      },
      barChartData: barChartArray,
      trendChartData: trendArray,
      isDailyView: dynamicDailyView
    };
  }, [records, timeRange, lang, chartMode, trendMode, customStart, customEnd]);

  const distUnit = 'km'; 
  const volUnit = 'gal';

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Activity size={48} className="mb-4 opacity-50" />
        <p>{t.noRecords}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-brand-600" />
            {t.statsFor}:
          </h2>
        </div>

        {/* Filter Buttons Scrollable */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max pb-1">
            {(['week', '30d', '6m', 'year', 'all', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  timeRange === range
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                }`}
              >
                {range === 'all' ? t.allTime : 
                 range === 'week' ? t.lastWeek :
                 range === '30d' ? t.last30Days : 
                 range === '6m' ? t.last6Months : 
                 range === 'year' ? t.thisYear : 
                 t.customRange}
              </button>
            ))}
          </div>
        </div>
        
        {/* Custom Range Inputs */}
        {timeRange === 'custom' && (
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex flex-wrap gap-3 items-center animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t.from}</label>
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">{t.to}</label>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t.totalSpent} 
          value={formatCurrency(stats.totalCost, lang)} 
          icon={<DollarSign size={20} />} 
        />
        <StatCard 
          title={t.avgConsumption} 
          value={`${stats.avgConsumption.toFixed(1)} ${distUnit}/${volUnit}`} 
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          title={t.costPerKm} 
          value={formatCurrency(stats.avgCostPerUnit, lang)} 
          icon={<Activity size={20} />} 
        />
        <StatCard 
          title={t.lastRefuel} 
          value={stats.lastRefuelDate ? new Date(stats.lastRefuelDate + 'T12:00:00').toLocaleDateString(lang) : '-'} 
          icon={<Calendar size={20} />} 
        />
      </div>

      {/* Bar Chart (Consumption/Cost) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">
            {isDailyView ? t.daily : t.monthlyExpenses}
          </h3>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setChartMode('cost')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${chartMode === 'cost' ? 'bg-white dark:bg-gray-700 shadow-sm text-green-600' : 'text-gray-400'}`}
            >
              <DollarSign size={14} /> {t.cost}
            </button>
            <button
              onClick={() => setChartMode('volume')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${chartMode === 'volume' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              <Droplet size={14} /> {t.volume}
            </button>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10}} 
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10}}
                tickFormatter={(value) => chartMode === 'cost' ? `$${value}` : value}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                cursor={{ fill: 'transparent' }}
                formatter={(value: number) => [
                  chartMode === 'cost' ? formatCurrency(value, lang) : `${value} ${volUnit}`, 
                  chartMode === 'cost' ? t.cost : t.volume
                ]}
              />
              <Bar 
                dataKey="value" 
                fill={chartMode === 'cost' ? '#22c55e' : '#3b82f6'} 
                radius={[4, 4, 0, 0]} 
                barSize={isDailyView ? 12 : 30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Chart (Price/Efficiency) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200">
             {trendMode === 'price' ? t.priceTrend : t.efficiencyTrend}
          </h3>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
             <button
              onClick={() => setTrendMode('price')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${trendMode === 'price' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-600' : 'text-gray-400'}`}
            >
              <DollarSign size={14} /> {t.price}
            </button>
            <button
              onClick={() => setTrendMode('efficiency')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${trendMode === 'efficiency' ? 'bg-white dark:bg-gray-700 shadow-sm text-purple-600' : 'text-gray-400'}`}
            >
              <Gauge size={14} /> {t.efficiency}
            </button>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10}} 
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9CA3AF', fontSize: 10}} 
                tickFormatter={(value) => trendMode === 'price' ? `$${value}` : value}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                formatter={(value: number) => [
                  trendMode === 'price' ? formatCurrency(value, lang) : `${value} ${distUnit}/${volUnit}`,
                  trendMode === 'price' ? t.price : t.efficiency
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={trendMode === 'price' ? '#f59e0b' : '#9333ea'} 
                strokeWidth={3} 
                dot={{ r: 3, fill: trendMode === 'price' ? '#f59e0b' : '#9333ea', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
