import './index.css';
import React, { useState, useMemo, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  TrendingUp, PlusCircle, Calendar, Percent, 
  Wallet, X, Layers, RefreshCw, Rocket, 
  ChevronRight, ArrowRight, Home, Gamepad2, 
  Container, Cloud, ShieldCheck
} from 'lucide-react';

// Перехватчик ошибок: предотвращает "черный экран смерти" в React
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 font-sans bg-red-950/50 border border-red-500/30 rounded-2xl text-red-200 max-w-2xl mx-auto my-12 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="animate-pulse">⚠️</span> Произошла ошибка рендера
          </h2>
          <p className="mb-4 text-sm text-red-300">Вместо черного экрана мы поймали системную ошибку:</p>
          <pre className="bg-black/40 p-4 rounded-lg overflow-x-auto text-xs font-mono mb-4 text-red-400">
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-800 hover:bg-red-700 transition-colors text-white text-sm font-semibold rounded-lg"
          >
            Перезагрузить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CalculatorApp = () => {
  const [initialAmount, setInitialAmount] = useState('100000');
  const [monthlyContribution, setMonthlyContribution] = useState('10000');
  const [monthsCount, setMonthsCount] = useState('60');
  const [compoundingFrequency, setCompoundingFrequency] = useState('monthly');

  const MAX_RATE_LIMIT = 50;
  const safeMonthsCount = Math.max(1, Number(monthsCount) || 1);
  const totalYears = Math.max(1, Math.ceil(safeMonthsCount / 12));
  const [yearlyRates, setYearlyRates] = useState(Array(15).fill(12)); 

  const frequencies = {
    daily: { label: 'Ежедневно', ppy: 365 },
    biweekly: { label: 'Каждые 2 нед.', ppy: 26 },
    monthly: { label: 'Ежемесячно', ppy: 12 },
    quarterly: { label: 'Ежеквартально', ppy: 4 },
    halfyearly: { label: 'Раз в полгода', ppy: 2 },
    yearly: { label: 'Ежегодно', ppy: 1 }
  };

  const averageRate = useMemo(() => {
    const activeRates = yearlyRates.slice(0, totalYears);
    if (activeRates.length === 0) return "0.0";
    const sum = activeRates.reduce((acc, curr) => acc + Number(curr || 0), 0);
    return (sum / activeRates.length).toFixed(1);
  }, [yearlyRates, totalYears]);

  const handleInputChange = (setter) => (e) => {
    const value = e.target.value;
    setter(value === '' ? '' : value);
  };

  const setFixedRateForAll = (e) => {
    const val = e.target.value;
    if (val === '') return;
    const rate = Math.max(0, Math.min(MAX_RATE_LIMIT, Number(val) || 0));
    setYearlyRates(Array(15).fill(rate));
  };

  const updateYearlyRate = (index, newValue) => {
    const nextRates = [...yearlyRates];
    nextRates[index] = Math.max(0, Math.min(MAX_RATE_LIMIT, Number(newValue) || 0));
    setYearlyRates(nextRates);
  };

  const investmentData = useMemo(() => {
    const data = [];
    const init = Number(initialAmount) || 0;
    const monthlyAdd = Number(monthlyContribution) || 0;
    
    const freqConfig = frequencies[compoundingFrequency] || frequencies['monthly'];
    const freq = freqConfig.ppy;
    let currentBalance = init;

    for (let month = 1; month <= safeMonthsCount; month++) {
      const currentYearIndex = Math.floor((month - 1) / 12);
      const rateToUse = yearlyRates[currentYearIndex] ?? yearlyRates[yearlyRates.length - 1] ?? 0;
      const currentAnnualRate = rateToUse / 100;
      
      const startBalance = currentBalance;
      const ratePerPeriod = currentAnnualRate / freq;
      const periodsInMonth = freq / 12; 

      const balanceAfterInterest = currentBalance * Math.pow(1 + ratePerPeriod, periodsInMonth);
      const interestForMonth = balanceAfterInterest - currentBalance;
      currentBalance = balanceAfterInterest + monthlyAdd;

      data.push({
        month,
        year: currentYearIndex + 1,
        rateUsed: (currentAnnualRate * 100).toFixed(1),
        openingBalance: startBalance,
        interest: interestForMonth || 0,
        contribution: monthlyAdd,
        closingBalance: currentBalance || 0,
        totalInvested: init + (monthlyAdd * month),
        totalProfit: currentBalance - (init + (monthlyAdd * month))
      });
    }
    return data;
  }, [initialAmount, monthlyContribution, safeMonthsCount, compoundingFrequency, yearlyRates]);

  const finalStats = investmentData[investmentData.length - 1] || { closingBalance: 0 };
  
  const monthlyPassiveIncome = useMemo(() => {
    const totalCapital = finalStats.closingBalance || 0;
    const lastYearIndex = Math.max(0, totalYears - 1);
    const lastYearRate = (yearlyRates[lastYearIndex] || 0) / 100;
    return (totalCapital * lastYearRate) / 12;
  }, [finalStats.closingBalance, yearlyRates, totalYears]);

  const handleEqualizerUpdate = (clientY, rect, index) => {
    const height = rect.height;
    const relativeY = Math.max(0, Math.min(height, clientY - rect.top));
    const percentage = MAX_RATE_LIMIT - (relativeY / height) * MAX_RATE_LIMIT;
    updateYearlyRate(index, percentage.toFixed(1));
  };

  const handleEqualizerMouseDown = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleEqualizerUpdate(e.clientY, rect, index);

    const onMouseMove = (moveEvent) => handleEqualizerUpdate(moveEvent.clientY, rect, index);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEqualizerTouchStart = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    handleEqualizerUpdate(touch.clientY, rect, index);

    const onTouchMove = (moveEvent) => {
      const moveTouch = moveEvent.touches[0];
      handleEqualizerUpdate(moveTouch.clientY, rect, index);
    };
    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-slate-100">
      {/* Сетка ввода параметров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:border-blue-500/50 transition-all">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            <Wallet size={14} className="text-blue-400" /> Стартовый капитал
          </label>
          <div className="flex items-end gap-2">
            <input 
              type="number" 
              value={initialAmount} 
              onChange={handleInputChange(setInitialAmount)} 
              className="w-full text-2xl font-bold outline-none bg-transparent text-white" 
            />
            <span className="text-slate-400 font-semibold">₽</span>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:border-blue-500/50 transition-all">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            <PlusCircle size={14} className="text-emerald-400" /> Ежемесячно
          </label>
          <div className="flex items-end gap-2">
            <input 
              type="number" 
              value={monthlyContribution} 
              onChange={handleInputChange(setMonthlyContribution)} 
              className="w-full text-2xl font-bold outline-none bg-transparent text-white" 
            />
            <span className="text-slate-400 font-semibold">₽</span>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:border-blue-500/50 transition-all">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            <Calendar size={14} className="text-indigo-400" /> Срок накопления
          </label>
          <div className="flex items-end gap-2">
            <input 
              type="number" 
              value={monthsCount} 
              onChange={handleInputChange(setMonthsCount)} 
              className="w-full text-2xl font-bold outline-none bg-transparent text-white" 
            />
            <span className="text-slate-400 font-semibold">мес</span>
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md hover:border-blue-500/50 transition-all">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            <RefreshCw size={14} className="text-rose-400 animate-spin-slow" /> Капитализация
          </label>
          <select 
            value={compoundingFrequency} 
            onChange={(e) => setCompoundingFrequency(e.target.value)} 
            className="w-full text-lg font-semibold outline-none bg-transparent cursor-pointer text-white [&>option]:bg-slate-900"
          >
            {Object.entries(frequencies).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        
        <div className="bg-blue-600/10 border border-blue-500/30 p-5 rounded-2xl backdrop-blur-md hover:border-blue-500/60 transition-all">
          <label className="flex items-center gap-2 text-[11px] font-semibold text-blue-300 uppercase tracking-widest mb-3">
            Фикс. ставка
          </label>
          <div className="flex items-end gap-2">
            <input 
              type="number" 
              placeholder="Для всех лет" 
              onChange={setFixedRateForAll} 
              className="w-full text-2xl font-bold outline-none bg-transparent text-blue-100 placeholder:text-blue-500/60" 
            />
            <span className="text-blue-400 font-semibold">%</span>
          </div>
        </div>
      </div>

      {/* Карточки результатов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-900/40 to-slate-900/40 border border-blue-500/20 p-8 rounded-3xl shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Итоговый капитал</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              {(finalStats.closingBalance || 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
            </h2>
            <span className="text-xl text-blue-400 font-medium">₽</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900/40 border border-emerald-500/20 p-8 rounded-3xl shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-6 right-6 opacity-10">
            <ArrowRight size={48} className="text-emerald-400" />
          </div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Пассивный доход в месяц</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400">
              {monthlyPassiveIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
            </h2>
            <span className="text-xl text-emerald-500 font-medium">₽</span>
          </div>
        </div>
      </div>

      {/* Интерактивный эквалайзер доходности */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-6 right-6 md:top-8 md:right-8 bg-slate-800/80 border border-white/10 px-4 py-2 rounded-xl flex flex-col items-end">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Средняя ставка</span>
          <span className="text-xl font-black text-blue-400">{averageRate}%</span>
        </div>

        <div className="mb-8">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Percent size={18} className="text-blue-400" />
            Прогноз доходности по годам
          </h3>
          <p className="text-xs text-slate-400 mt-1">Тяните (или ведите пальцем) столбцы вверх/вниз для интерактивного изменения процента</p>
        </div>
        
        <div className="flex items-end justify-between gap-2 h-64 bg-slate-950/40 rounded-2xl p-4 md:p-6 border border-white/5">
          {Array.from({ length: Math.min(totalYears, 15) }).map((_, i) => {
            const isLast = i === Math.min(totalYears, 15) - 1;
            return (
              <div key={i} className="flex-1 h-full flex flex-col items-center gap-2 group/bar">
                <span className={`text-[10px] sm:text-xs font-bold transition-colors ${isLast ? 'text-blue-400' : 'text-slate-400 group-hover/bar:text-white'}`}>
                  {yearlyRates[i]}%
                </span>
                
                <div 
                  onMouseDown={(e) => handleEqualizerMouseDown(e, i)}
                  onTouchStart={(e) => handleEqualizerTouchStart(e, i)}
                  className="w-full h-full bg-slate-800/30 rounded-md relative cursor-ns-resize hover:bg-slate-800/60 transition-all overflow-hidden"
                >
                  <div 
                    className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-75 
                      ${isLast 
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]' 
                        : 'bg-gradient-to-t from-blue-500/80 to-indigo-400/80 group-hover/bar:from-blue-500 group-hover/bar:to-cyan-400'
                      }`} 
                    style={{ height: `${(yearlyRates[i] / MAX_RATE_LIMIT) * 100}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-tight ${isLast ? 'text-blue-400' : 'text-slate-500'}`}>
                  {i + 1}г
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Детализация (таблица) */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-8 backdrop-blur-md">
        <div className="px-6 py-5 border-b border-white/10 bg-white/5">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers size={16} className="text-blue-400" /> Детализация по месяцам (последние 2 года)
          </h4>
        </div>
        <div className="overflow-x-auto max-h-[350px]">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 shadow-sm z-10 border-b border-white/10 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Период</th>
                <th className="px-6 py-4">Начисленный процент за месяц</th>
                <th className="px-6 py-4">Капитал на конец месяца</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {investmentData.slice(-24).map((row) => (
                <tr key={row.month} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-300">Месяц {row.month} <span className="text-slate-500 text-xs ml-1">({row.year}г)</span></td>
                  <td className="px-6 py-4 font-semibold text-emerald-400">+{row.interest.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</td>
                  <td className="px-6 py-4 font-black text-white">{row.closingBalance.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardApp = () => {
  const services = [
    { 
      name: "Nahodilka", 
      desc: "Интерактивная игра Капибары", 
      icon: Gamepad2, 
      color: "text-blue-400 border-blue-500/20 shadow-blue-500/5", 
      link: "https://nahodilka.alxorern.ru" 
    },
    { 
      name: "Nextcloud", 
      desc: "Приватное облачное хранилище файлов", 
      icon: Cloud, 
      color: "text-indigo-400 border-indigo-500/20 shadow-indigo-500/5", 
      link: "https://cloud.alxorern.ru" 
    },
    { 
      name: "NPM (Proxy)", 
      desc: "Управление Nginx и SSL сертификатами", 
      icon: ShieldCheck, 
      color: "text-rose-400 border-rose-500/20 shadow-rose-500/5", 
      link: "https://proxy.alxorern.ru" 
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <a 
              key={index} 
              href={service.link} 
              className={`bg-white/3 border ${service.color.split(' ')[1]} p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/5 hover:border-blue-500/40 group relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/2 rounded-full group-hover:scale-150 transition-transform pointer-events-none duration-500"></div>
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl bg-white/5 ${service.color.split(' ')[0]}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{service.name}</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{service.desc}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home');

  const currentDate = useMemo(() => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('ru-RU', options);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,#1e293b,#020617)] text-slate-100 font-sans antialiased pb-12">
        {/* Заголовок */}
        <header className="max-w-6xl mx-auto pt-10 px-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Alxorern Home Lab
            </h1>
            <p className="text-slate-400 text-xs capitalize mt-1">
              {currentDate}
            </p>
          </div>
          
          {/* Переключатель вкладок */}
          <nav className="flex p-1 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <button 
              onClick={() => setView('home')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                view === 'home' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home size={16} />
              Панель управления
            </button>
            <button 
              onClick={() => setView('calc')} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                view === 'calc' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp size={16} />
              Калькулятор
            </button>
          </nav>
        </header>

        {/* Текущее окно приложения */}
        <main>
          {view === 'home' ? <DashboardApp /> : <CalculatorApp />}
        </main>
      </div>
    </ErrorBoundary>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}