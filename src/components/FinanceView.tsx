import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  Search,
  CheckCircle,
  AlertCircle,
  Filter,
  Printer,
  CreditCard,
  Banknote,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Expense, Income } from '../types';

export const FinanceView: React.FC = () => {
  const { expenses, incomes, sales, setting, addExpense, deleteExpense, addIncome, deleteIncome } = useStore();

  const [activeTab, setActiveTab] = useState<'xerc' | 'gelir' | 'analiz'>('xerc');

  // Expense form state
  const [expCategory, setExpCategory] = useState('Kommunal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'Nağd' | 'Kart'>('Nağd');
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  // Income form state
  const [incCategory, setIncCategory] = useState('Digər Gəlir');
  const [incDescription, setIncDescription] = useState('');
  const [incAmount, setIncAmount] = useState<number | ''>('');
  const [incPaymentMethod, setIncPaymentMethod] = useState<'Nağd' | 'Kart'>('Nağd');
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incNotes, setIncNotes] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Delete modal state
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const expenseCategories = [
    'Kommunal',
    'İcarə',
    'Əməkhaqqı / Maaş',
    'Yemək / Çay',
    'Nəqliyyat / Yanacaq',
    'Qablaşdırma & Torba',
    'Təmir & Avadanlıq',
    'Təmizlik & Gigiyena',
    'Marketinq / Reklam',
    'Dəftərxana',
    'Digər Xərc',
  ];

  const quickAmounts = [1, 2, 5, 10, 20, 50, 100, 200];

  // Date range checker
  const isInPeriod = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const itemDay = new Date(itemDate);
    itemDay.setHours(0, 0, 0, 0);

    if (filterPeriod === 'all') return true;

    if (filterPeriod === 'today') {
      return itemDay.getTime() === today.getTime();
    }

    if (filterPeriod === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return itemDay.getTime() === yesterday.getTime();
    }

    if (filterPeriod === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDay.getTime() >= weekAgo.getTime() && itemDay.getTime() <= today.getTime() + 86400000;
    }

    if (filterPeriod === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return itemDay.getTime() >= monthStart.getTime();
    }

    if (filterPeriod === 'custom') {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return itemDate.getTime() >= start.getTime() && itemDate.getTime() <= end.getTime();
    }

    return true;
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Date filter
      if (!isInPeriod(e.date)) return false;

      // Category filter
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // Payment method filter
      if (selectedMethod !== 'all') {
        const method = e.paymentMethod || 'Nağd';
        if (method !== selectedMethod) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const descMatch = e.description.toLowerCase().includes(q);
        const catMatch = e.category.toLowerCase().includes(q);
        const noteMatch = e.notes ? e.notes.toLowerCase().includes(q) : false;
        const amountMatch = e.amount.toString().includes(q);
        if (!descMatch && !catMatch && !noteMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [expenses, filterPeriod, customStartDate, customEndDate, selectedCategory, selectedMethod, searchQuery]);

  // Filtered Incomes
  const filteredIncomes = useMemo(() => {
    return incomes.filter((i) => {
      if (!isInPeriod(i.date)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const descMatch = i.description.toLowerCase().includes(q);
        const catMatch = i.category.toLowerCase().includes(q);
        const noteMatch = i.notes ? i.notes.toLowerCase().includes(q) : false;
        if (!descMatch && !catMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [incomes, filterPeriod, customStartDate, customEndDate, searchQuery]);

  // Financial Stats
  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.amount, 0);
  const filteredExpenseSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const totalSalesIncomeSum = sales.filter((s) => !s.isReturned).reduce((acc, s) => acc + s.total, 0);
  const totalIncomesSum = incomes.reduce((acc, i) => acc + i.amount, 0);
  const netFinancialBalance = totalSalesIncomeSum - totalExpenseSum;

  // Today stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayExpensesSum = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  // Month stats
  const thisMonthPrefix = todayStr.substring(0, 7);
  const thisMonthExpensesSum = expenses
    .filter((e) => e.date.startsWith(thisMonthPrefix))
    .reduce((acc, e) => acc + e.amount, 0);

  // Expenses Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const exp of filteredExpenses) {
      if (!map[exp.category]) {
        map[exp.category] = { count: 0, total: 0 };
      }
      map[exp.category].count += 1;
      map[exp.category].total += exp.amount;
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [filteredExpenses]);

  // Handle Add Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategory = isCustomCategory ? customCategory.trim() : expCategory.trim();
      if (!finalCategory) {
        showToast('Xərc kateqoriyasını daxil edin.', 'error');
        return;
      }

      if (!expDescription.trim()) {
        showToast('Xərcin açıqlamasını / təyinatını daxil edin.', 'error');
        return;
      }

      const amountNum = Number(expAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        showToast('Düzgün xərc məbləği daxil edin (0-dan böyük).', 'error');
        return;
      }

      addExpense({
        category: finalCategory,
        description: expDescription.trim(),
        amount: amountNum,
        date: new Date(expDate).toISOString(),
        paymentMethod: expPaymentMethod,
        notes: expNotes.trim() || undefined,
      });

      setExpDescription('');
      setExpAmount('');
      setExpNotes('');
      setCustomCategory('');
      setIsCustomCategory(false);
      showToast(`-${amountNum.toFixed(2)} ${setting.currency} xərc uğurla əlavə edildi!`);
    } catch (err: any) {
      showToast(err.message || 'Xərc əlavə edilərkən xəta baş verdi.', 'error');
    }
  };

  // Handle Delete Expense
  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    try {
      const amount = expenseToDelete.amount;
      const desc = expenseToDelete.description;
      deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      showToast(`"${desc}" (${amount.toFixed(2)} ${setting.currency}) xərci silindi.`);
    } catch (err: any) {
      showToast(err.message || 'Xərci silmək mümkün olmadı.', 'error');
    }
  };

  // Handle Add Income
  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!incDescription.trim()) {
        showToast('Gəlirin açıqlamasını daxil edin.', 'error');
        return;
      }

      const amountNum = Number(incAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        showToast('Düzgün gəlir məbləği daxil edin.', 'error');
        return;
      }

      addIncome({
        category: incCategory,
        description: incDescription.trim(),
        amount: amountNum,
        date: new Date(incDate).toISOString(),
        paymentMethod: incPaymentMethod,
        notes: incNotes.trim() || undefined,
      });

      setIncDescription('');
      setIncAmount('');
      setIncNotes('');
      showToast(`+${amountNum.toFixed(2)} ${setting.currency} gəlir qeydiyyata alındı!`);
    } catch (err: any) {
      showToast(err.message || 'Gəlir qeyd edilərkən xəta baş verdi.', 'error');
    }
  };

  // Handle Delete Income
  const handleConfirmDeleteIncome = () => {
    if (!incomeToDelete) return;
    try {
      deleteIncome(incomeToDelete.id);
      setIncomeToDelete(null);
      showToast(`Gəlir qeydi silindi.`);
    } catch (err: any) {
      showToast(err.message || 'Gəliri silmək mümkün olmadı.', 'error');
    }
  };

  // Print filtered report
  const handlePrintExpenses = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Overall Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-rose-600" />
            Xərclər və Maliyyə İdarəetməsi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gündəlik mağaza xərclərinin qeydiyyatı, kateqoriyalara ayrılması və silinməsi
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('xerc')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'xerc'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Xərclər ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('gelir')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'gelir'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Gəlirlər ({incomes.length})
          </button>
          <button
            onClick={() => setActiveTab('analiz')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'analiz'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Xərc Təhlili
          </button>
        </div>
      </div>

      {/* 4 Fast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bugünkü Xərc
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-rose-600 mt-2">
            -{todayExpensesSum.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Bugün çıxan xərclər</p>
        </div>

        {/* This Month Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bu Ayın Xərci
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-amber-600 mt-2">
            -{thisMonthExpensesSum.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Cari ayın toplam xərci</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ümumi Xərclər
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2">
            -{totalExpenseSum.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{expenses.length} ədəd qeydiyyat</p>
        </div>

        {/* Net Cash Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Xalis Kassa Balansı
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl font-extrabold mt-2 ${netFinancialBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {netFinancialBalance.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Satış gəliri minus xərclər</p>
        </div>
      </div>

      {/* Main Content Layout */}
      {activeTab === 'xerc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Add Expense (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-600" />
                Yeni Xərc Əlavə Et
              </h2>
              <span className="text-[11px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded">
                Kassadan Çıxarış
              </span>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Xərc Kateqoriyası <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {isCustomCategory ? 'Siyahıdan seç' : '+ Fərdi Kateqoriya'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Məsələn: Reklam bannerləri, Vitrin tərtibatı"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                ) : (
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Expense Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xərcin Təyinatı / Açıqlaması <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məs: İşıq pulu, Çörək və çay, Qablaşdırma torbaları"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Amount & Quick Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Məbləğ ({setting.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Dəqiq məbləği yazın</span>
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={expAmount}
                  placeholder="0.00"
                  onChange={(e) => setExpAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-rose-600 focus:ring-2 focus:ring-rose-500"
                />

                {/* Quick Amount Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] font-bold text-slate-400">Tez Məbləğ:</span>
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExpAmount(amt)}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 rounded-md font-bold border border-slate-200 transition"
                    >
                      {amt} ₼
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ödəniş Üsulu</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setExpPaymentMethod('Nağd')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                        expPaymentMethod === 'Nağd'
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      Nağd
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpPaymentMethod('Kart')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                        expPaymentMethod === 'Kart'
                          ? 'bg-white text-blue-700 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Kart
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Əlavə Qeyd (İstəyə bağlı)</label>
                <input
                  type="text"
                  placeholder="Xərc haqqında əlavə məlumat..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Xərci Yadda Saxla ({Number(expAmount || 0).toFixed(2)} {setting.currency})
              </button>
            </form>
          </div>

          {/* Right Section: Expenses List, Filters & Deletion (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            {/* Header with Title & Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>Xərclər Siyahısı</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({filteredExpenses.length} xərc / Cəmi: -{filteredExpenseSum.toFixed(2)} {setting.currency})
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintExpenses}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition"
                    title="Xərclər siyahısını çap et"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    Çap Et
                  </button>
                </div>
              </div>

              {/* Filters row 1: Period buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Bütün Vaxtlar' },
                  { id: 'today', label: 'Bugün' },
                  { id: 'yesterday', label: 'Dünən' },
                  { id: 'week', label: 'Son 7 Gün' },
                  { id: 'month', label: 'Bu Ay' },
                  { id: 'custom', label: 'Tarix Aralığı' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilterPeriod(tab.id as any)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition ${
                      filterPeriod === tab.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              {filterPeriod === 'custom' && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="font-semibold text-slate-500">Aralıq:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Filters row 2: Search, Category & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Açıqlama və ya qeydlə axtar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">Bütün Kateqoriyalar</option>
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="all">Bütün Ödəniş Üsulları</option>
                    <option value="Nağd">Yalnız Nağd</option>
                    <option value="Kart">Yalnız Kart</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-600">
                    <th className="py-2.5 px-3">Tarix</th>
                    <th className="py-2.5 px-3">Kateqoriya</th>
                    <th className="py-2.5 px-3">Açıqlama / Təyinat</th>
                    <th className="py-2.5 px-3">Ödəniş</th>
                    <th className="py-2.5 px-3 text-right">Məbləğ</th>
                    <th className="py-2.5 px-3 text-center">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        <Coins className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Seçilmiş filterlərə uyğun xərc qeydi tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-rose-50/30 transition group">
                        <td className="py-2.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(exp.date).toLocaleDateString('az-AZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-rose-100/80 text-rose-800 text-[11px] font-bold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-bold text-slate-800">{exp.description}</p>
                          {exp.notes && (
                            <p className="text-[10px] text-slate-500 font-normal">{exp.notes}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                              exp.paymentMethod === 'Kart'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {exp.paymentMethod === 'Kart' ? (
                              <CreditCard className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            {exp.paymentMethod || 'Nağd'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-rose-600 whitespace-nowrap text-xs">
                          -{exp.amount.toFixed(2)} {setting.currency}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-100 transition"
                            title="Bu xərci sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Total */}
            {filteredExpenses.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Göstərilən {filteredExpenses.length} xərcin cəmi:</span>
                <span className="text-sm font-extrabold text-rose-600">
                  -{filteredExpenseSum.toFixed(2)} {setting.currency}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'gelir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Income Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Əlavə Gəlir Qeydiyyatı
              </h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                Kassaya Mədaxil
              </span>
            </div>

            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gəlir Kateqoriyası</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Satış">Satış Mədaxili</option>
                  <option value="Xidmət">Xidmət / Çatdırılma Haqqı</option>
                  <option value="Digər Gəlir">Digər Gəlir</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıqlama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Əlavə çatdırılma gəliri və ya qutu satışı"
                  value={incDescription}
                  onChange={(e) => setIncDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Məbləğ ({setting.currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={incAmount}
                  placeholder="0.00"
                  onChange={(e) => setIncAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ödəniş Üsulu</label>
                  <select
                    value={incPaymentMethod}
                    onChange={(e) => setIncPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Nağd">Nağd</option>
                    <option value="Kart">Kart</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qeyd</label>
                <input
                  type="text"
                  placeholder="Əlavə qeydlər..."
                  value={incNotes}
                  onChange={(e) => setIncNotes(e.target.value)}
                  className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                Gəliri Yadda Saxla
              </button>
            </form>
          </div>

          {/* Incomes Table (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">Gəlirlər Siyahısı ({filteredIncomes.length})</h2>
            </div>
            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500">
                    <th className="py-3 px-3">Tarix</th>
                    <th className="py-3 px-3">Kateqoriya</th>
                    <th className="py-3 px-3">Açıqlama</th>
                    <th className="py-3 px-3 text-right">Məbləğ</th>
                    <th className="py-3 px-3 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        Heç bir gəlir qeydiyyatı tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    filteredIncomes.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-xs text-slate-500">
                          {new Date(inc.date).toLocaleDateString('az-AZ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                            {inc.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="text-xs font-bold text-slate-800">{inc.description}</p>
                          {inc.notes && <p className="text-[10px] text-slate-500">{inc.notes}</p>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 text-xs">
                          +{inc.amount.toFixed(2)} {setting.currency}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setIncomeToDelete(inc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analiz' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-rose-600" />
              Kateqoriyalar üzrə Xərclər
            </h2>

            <div className="space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Məlumat yoxdur.</p>
              ) : (
                categoryBreakdown.map(([cat, info]) => {
                  const percentage = totalExpenseSum > 0 ? (info.total / totalExpenseSum) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700">{cat} ({info.count} əməliyyat)</span>
                        <span className="font-extrabold text-rose-600">
                          {info.total.toFixed(2)} {setting.currency} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Maliyyə Qaydaları & Məlumat
            </h2>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-900">Xərclərin Hesablanması</p>
                <p className="mt-1 text-blue-800">
                  Daxil etdiyiniz bütün xərclər birbaşa ümumi kassa qalığından və hesabatlardakı xalis mənfəətdən avtomatik çıxılır.
                </p>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <p className="font-bold text-rose-900">Xərclərin Silinməsi</p>
                <p className="mt-1 text-rose-800">
                  Səhvən daxil edilmiş və ya ləğv olunmuş xərcləri qırmızı zibil qutusu ikonuna klikləyərək təsdiq edib asanlıqla silə bilərsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Xərci Silmək İstəyirsiniz?</h3>
              <p className="text-xs text-slate-500">
                Bu xərc kassa qeydiyyatından çıxarılacaq və kassa qalığı bərpa olunacaq.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Xərc Təyinatı:</span>
                <span className="font-bold text-slate-800">{expenseToDelete.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kateqoriya:</span>
                <span className="font-bold text-slate-800">{expenseToDelete.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tarix:</span>
                <span className="font-bold text-slate-800">
                  {new Date(expenseToDelete.date).toLocaleDateString('az-AZ')}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-rose-600 font-extrabold">
                <span>Məbləğ:</span>
                <span>-{expenseToDelete.amount.toFixed(2)} {setting.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                İmtina Et
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteExpense}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition"
              >
                Bəli, Xərci Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Income Confirmation Modal */}
      {incomeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Gəlir Qeydini Silmək İstəyirsiniz?</h3>
              <p className="text-xs text-slate-500">Bu gəlir kassa qeydiyyatından silinəcək.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Açıqlama:</span>
                <span className="font-bold text-slate-800">{incomeToDelete.description}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-600 font-extrabold">
                <span>Məbləğ:</span>
                <span>+{incomeToDelete.amount.toFixed(2)} {setting.currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                İmtina Et
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteIncome}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                Bəli, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
