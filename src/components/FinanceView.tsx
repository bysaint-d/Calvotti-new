import React, { useState } from 'react';
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
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const FinanceView: React.FC = () => {
  const { expenses, incomes, sales, setting, addExpense, deleteExpense, addIncome } = useStore();

  const [activeTab, setActiveTab] = useState<'xerc' | 'gelir'>('xerc');

  // New Expense form
  const [expCategory, setExpCategory] = useState('İcarə');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  // New Income form
  const [incCategory, setIncCategory] = useState('Satış');
  const [incDescription, setIncDescription] = useState('');
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const expenseCategories = ['İcarə', 'Kommunal', 'Maaş', 'Nəqliyyat', 'Təmir', 'Marketinq', 'Digər'];

  const totalExpenseSum = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalSalesIncomeSum = sales.filter((s) => !s.isReturned).reduce((acc, s) => acc + s.total, 0);
  const totalManualIncomeSum = incomes.reduce((acc, i) => acc + i.amount, 0);
  const netFinancialBalance = totalSalesIncomeSum - totalExpenseSum;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) return;

    addExpense({
      category: expCategory,
      description: expDescription.trim(),
      amount: Number(expAmount),
      date: new Date(expDate).toISOString(),
      notes: expNotes.trim() || undefined,
    });

    setExpDescription('');
    setExpAmount(0);
    setExpNotes('');
    setSuccess('Xərc uğurla qeyd edildi!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incDescription.trim() || incAmount <= 0) return;

    addIncome({
      category: incCategory,
      description: incDescription.trim(),
      amount: Number(incAmount),
      date: new Date(incDate).toISOString(),
    });

    setIncDescription('');
    setIncAmount(0);
    setSuccess('Gəlir qeydiyyata alındı!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-blue-600" />
            Maliyyə, Gəlir və Xərclər
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gündəlik xərclər, kassa dövriyyəsi və xalis maliyyə balansı
          </p>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Sales Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ümumi Satış Gəliri
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mt-3">
            +{totalSalesIncomeSum.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Kassadan daxil olan ümumi məbləğ</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ümumi Xərclər
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-rose-600 mt-3">
            -{totalExpenseSum.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{expenses.length} ədəd xərc qeydiyyatı</p>
        </div>

        {/* Net Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Xalis Kassa Qalığı
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mt-3 ${netFinancialBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {netFinancialBalance.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Satış gəliri minus xərclər</p>
        </div>
      </div>

      {/* Main Container: Form & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add Expense / Income (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('xerc')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'xerc'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Xərc Qeydi
            </button>
            <button
              onClick={() => setActiveTab('gelir')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'gelir'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Gəlir Qeydi
            </button>
          </div>

          {activeTab === 'xerc' ? (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xərc Kateqoriyası
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {expenseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xərcin Təyinatı / Açıqlaması <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Kassa lenti və qablaşdırma torbaları"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məbləğ ({setting.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={expAmount || ''}
                    placeholder="0.00"
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qeyd</label>
                <textarea
                  rows={2}
                  placeholder="Əlavə qeydlər..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-600/20 text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Xərci Qeyd Et
              </button>
            </form>
          ) : (
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gəlir Kateqoriyası
                </label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Satış">Satış</option>
                  <option value="Xidmət">Xidmət / Çatdırılma</option>
                  <option value="Digər">Digər Gəlir</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Açıqlama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Əlavə çatdırılma haqqı"
                  value={incDescription}
                  onChange={(e) => setIncDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məbləğ ({setting.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={incAmount || ''}
                    placeholder="0.00"
                    onChange={(e) => setIncAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarix</label>
                  <input
                    type="date"
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                Gəliri Qeyd Et
              </button>
            </form>
          )}
        </div>

        {/* Right Table: Expenses / Incomes Log (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 text-base">Xərclər Siyahısı</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Açıqlama və ya kateqoriya ilə axtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-3">Kateqoriya</th>
                  <th className="py-3 px-3">Açıqlama</th>
                  <th className="py-3 px-3 text-right">Məbləğ</th>
                  <th className="py-3 px-4 text-right">Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      Heç bir xərc qeydi tapılmadı.
                    </td>
                  </tr>
                ) : (
                  expenses
                    .filter((e) => {
                      const q = search.trim().toLowerCase();
                      return (
                        !q ||
                        e.description.toLowerCase().includes(q) ||
                        e.category.toLowerCase().includes(q) ||
                        (e.notes && e.notes.toLowerCase().includes(q))
                      );
                    })
                    .map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(exp.date).toLocaleDateString('az-AZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {exp.description}
                          {exp.notes && (
                            <p className="text-[11px] text-slate-400 font-normal">{exp.notes}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                          -{exp.amount.toFixed(2)} {setting.currency}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Xərci sil"
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
    </div>
  );
};
