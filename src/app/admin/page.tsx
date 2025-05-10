'use client';
import React, { useEffect, useState } from 'react';
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

type Metrics = {
  users?: number;
  companies?: number;
  logs?: number;
  activity?: { day: string; count: number }[];
} & Record<string, unknown>;

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
  
  const fetchMetrics = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      const response = await fetch(`/api/admin/metrics?startDate=${startDateStr}&endDate=${endDateStr}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setMetrics(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    const newStartDate = subDays(startDate, 7);
    setStartDate(newStartDate);
    fetchMetrics(newStartDate, endOfWeek(newStartDate, { weekStartsOn: 1 }));
  };

  const handleNextWeek = () => {
    const newStartDate = addDays(startDate, 7);
    setStartDate(newStartDate);
    fetchMetrics(newStartDate, endOfWeek(newStartDate, { weekStartsOn: 1 }));
  };

  const handleDateSelect = (date: Date) => {
    const newStartDate = startOfWeek(date, { weekStartsOn: 1 });
    setStartDate(newStartDate);
    fetchMetrics(newStartDate, endOfWeek(newStartDate, { weekStartsOn: 1 }));
    setDatePickerOpen(false);
  };

  useEffect(() => {
    fetchMetrics(startDate, endDate);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{label:'Пользователей', key:'users'},{label:'Компаний',key:'companies'},{label:'Запросов',key:'logs'}].map((m) => (
          <div key={m.key} className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-indigo-600">
              {loading ? <span className="animate-pulse text-gray-300">...</span> : (
                metrics?.[m.key] !== undefined ? String(metrics[m.key]) : '-'
              )}
            </div>
            <div className="text-gray-500 mt-2">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-700">Активность за неделю</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePreviousWeek}
              className="p-2 rounded-md hover:bg-gray-100"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="relative">
              <button 
                onClick={() => setDatePickerOpen(!datePickerOpen)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm flex items-center space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <span>{format(startDate, 'dd.MM.yyyy', { locale: ru })} - {format(endDate, 'dd.MM.yyyy', { locale: ru })}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {datePickerOpen && (
                <div className="absolute z-10 mt-1 right-0 bg-white rounded-md shadow-lg p-4 border border-gray-200 w-64">
                  <div className="text-sm font-medium text-gray-700 mb-2">Выберите неделю</div>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                      <div key={day} className="text-center text-gray-500 font-medium p-1">{day}</div>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => {
                      // Начинаем с текущей даты и выводим 5 недель (2 недели до и 2 недели после текущей)
                      const date = addDays(startOfWeek(subDays(new Date(), 14), { weekStartsOn: 1 }), i);
                      const isCurrentWeekStart = 
                        format(date, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd');
                      const isInCurrentWeek = 
                        date >= startDate && date <= endDate;
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleDateSelect(date)}
                          className={`p-1 rounded-full text-center ${
                            isCurrentWeekStart 
                              ? 'bg-indigo-600 text-white' 
                              : isInCurrentWeek
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'hover:bg-gray-100'
                          }`}
                        >
                          {format(date, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={handleNextWeek}
              className="p-2 rounded-md hover:bg-gray-100"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Загрузка...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-400">{error}</div>
        ) : metrics?.activity?.length ? (
          <ActivityChart data={metrics.activity} />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">Нет данных за выбранный период</div>
        )}
      </div>
    </div>
  );
}

function ActivityChart({ data }: { data: { day: string, count: number }[] }) {
  // Находим максимальное значение для масштабирования
  const max = Math.max(...data.map(d => d.count), 1); // Минимум 1, чтобы избежать деления на 0
  
  // Убедимся, что данные отсортированы по датам
  const sortedData = [...data].sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

  // Заполним отсутствующие дни
  const filledData = (() => {
    if (sortedData.length === 0) return [];
    
    const result = [];
    const startDate = new Date(sortedData[0].day);
    const endDate = new Date(sortedData[sortedData.length - 1].day);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const existingData = sortedData.find(d => d.day === dateStr);
      
      result.push({
        day: dateStr,
        count: existingData ? existingData.count : 0
      });
      
      // Переходим к следующему дню
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  })();
  
  // Определяем, есть ли данные для отображения
  const hasData = filledData.some(d => d.count > 0);
  
  return (
    <div className="mt-4">
      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          Нет данных за выбранный период
        </div>
      ) : (
        <div className="flex items-end h-64 gap-1 w-full">
          {filledData.map(d => {
            // Определяем цвет столбца в зависимости от значения
            const getColor = (count: number) => {
              if (count === 0) return 'bg-gray-300'; // Более темный оттенок для нулей
              if (count === max) return 'bg-blue-600 hover:bg-blue-700';
              if (count > max * 0.7) return 'bg-blue-500 hover:bg-blue-600';
              if (count > max * 0.3) return 'bg-blue-400 hover:bg-blue-500';
              return 'bg-blue-300 hover:bg-blue-400';
            };
            
            // Рассчитываем высоту в процентах - точно пропорционально количеству запросов
            const heightPercent = d.count > 0 
              ? Math.max((d.count / max) * 100, 10) // Минимальная высота 10% для ненулевых значений
              : 5; // Фиксированная минимальная высота 5% для нулевых значений
            
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center group">
                <div className={`text-xs font-medium ${d.count > 0 ? 'text-blue-700' : 'text-gray-500'} mb-1`}>
                  {d.count}
                </div>
                
                <div 
                  className={`w-full max-w-16 rounded-t-md transition-all duration-200 relative ${getColor(d.count)}`}
                  style={{ 
                    height: `${heightPercent}%`,
                    minHeight: d.count > 0 ? '20px' : '10px', // Гарантированный минимальный размер
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm">{d.count}</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-2 font-medium">
                  {format(new Date(d.day), 'E, d MMM', { locale: ru })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-px bg-gray-200 w-full mt-4 mb-2"></div>
    </div>
  );
} 