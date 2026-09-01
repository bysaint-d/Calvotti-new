import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Coins,
  PackagePlus,
  ArrowDownRight,
  Flame,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useStore } from '../context/StoreContext';

export const ReportsView: React.FC = () => {
  const {
    setting,
    getSummary,
    getPurchasesTotal,
    getCostOfGoods,
    getProductsSold,
    getBestSelling,
    getMostProfitable,
    getStockReport,
  } = useStore();

  const [period, setPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'lastMonth' | 'custom'>('month');

  const today = useMemo(() => new Date(), []);
  const [customFrom, setCustomFrom] = useState<string>(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [customTo, setCustomTo] = useState<string>(today.toISOString().split('T')[0]);

  // Calculate Date Boundaries
  const { fromDate, toDate } = useMemo(() => {
    const d = new Date();
    let f = new Date();
    let t = new Date();

    if (period === 'today') {
      f.setHours(0, 0, 0, 0);
      t.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      f.setDate(d.getDate() - 1);
      f.setHours(0, 0, 0, 0);
      t.setDate(d.getDate() - 1);
      t.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      f = new Date(d.setDate(diff));
      f.setHours(0, 0, 0, 0);
      t = new Date();
      t.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      f = new Date(d.getFullYear(), d.getMonth(), 1);
      f.setHours(0, 0, 0, 0);
      t = new Date();
      t.setHours(23, 59, 59, 999);
    } else if (period === 'lastMonth') {
      f = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      f.setHours(0, 0, 0, 0);
      t = new Date(d.getFullYear(), d.getMonth(), 0);
      t.setHours(23, 59, 59, 999);
    } else {
      f = new Date(customFrom);
      f.setHours(0, 0, 0, 0);
      t = new Date(customTo);
      t.setHours(23, 59, 59, 999);
    }

    return { fromDate: f, toDate: t };
  }, [period, customFrom, customTo]);

  // Query calculated metrics
  const summary = getSummary(fromDate, toDate);
  const purchasesTotal = getPurchasesTotal(fromDate, toDate);
  const costOfGoods = getCostOfGoods(fromDate, toDate);
  const productsSold = getProductsSold(fromDate, toDate);
  const bestSelling = getBestSelling(fromDate, toDate);
  const mostProfitable = getMostProfitable(fromDate, toDate);
  const stockReport = getStockReport();

  // Chart data preparation
  const chartData = [
    {
      name: 'Satış & Dövriyyə',
      Məbləğ: summary.sales,
    },
    {
      name: 'Maya Dəyəri',
      Məbləğ: costOfGoods,
    },
    {
      name: 'Ümumi Qazanc',
      Məbləğ: summary.gross,
    },
    {
      name: 'Xərclər',
      Məbləğ: summary.expenses,
    },
    {
      name: 'Xalis Mənfəət',
      Məbləğ: summary.net,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Period Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Maliyyə və Satış Hesabatları
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mənfəət, xərclər, dövriyyə və ən çox satılan məhsulların statistikası
          </p>
        </div>

        {/* Period Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'today', label: 'Bugün' },
            { id: 'yesterday', label: 'Dünən' },
            { id: 'week', label: 'Bu həftə' },
            { id: 'month', label: 'Bu ay' },
            { id: 'lastMonth', label: 'Keçən ay' },
            { id: 'custom', label: 'Tarix aralığı' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                period === item.id
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === 'custom' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Başlanğıc:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Son:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Main KPI Grid (8 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Satış Dövriyyəsi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
            {summary.sales.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{summary.count} ədəd kassa çeki</p>
        </div>

        {/* Cost of Goods Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Malların Maya Dəyəri</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {costOfGoods.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{productsSold} ədəd məhsul satılıb</p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Ümumi Mənfəət</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-2">
            +{summary.gross.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Satış minus maya dəyəri</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Xalis Mənfəət (Net)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              summary.net >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-extrabold mt-2 ${summary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {summary.net >= 0 ? `+${summary.net.toFixed(2)}` : summary.net.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Mənfəət minus xərclər</p>
        </div>

        {/* Purchases In Period */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Dövrdəki Alışlar</span>
          <h3 className="text-xl font-bold text-slate-800 mt-2">
            {purchasesTotal.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Təchizatçılara ödənilən</p>
        </div>

        {/* Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Xərclər</span>
          <h3 className="text-xl font-bold text-rose-600 mt-2">
            -{summary.expenses.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Kommunal, icarə, maaş və s.</p>
        </div>

        {/* Total Stock in Store */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Cari Anbar Qalığı</span>
          <h3 className="text-xl font-bold text-slate-800 mt-2">
            {stockReport.totalQuantity} <span className="text-sm font-normal text-slate-500">ədəd</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">{stockReport.productCount} fərqli çeşid məhsul</p>
        </div>

        {/* Low Stock count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Kritik / Bitmiş Stok</span>
          <h3 className="text-xl font-bold text-amber-600 mt-2">
            {stockReport.lowStock + stockReport.outOfStock} <span className="text-sm font-normal text-slate-500">məhsul</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">{stockReport.outOfStock} məhsul tam bitib</p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <h2 className="font-bold text-slate-900 text-base mb-4">Maliyyə Dövriyyəsi Qrafiki</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} unit={` ${setting.currency}`} />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toFixed(2)} ${setting.currency}`, 'Məbləğ']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="Məbləğ" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Best Sellers & Top 10 Most Profitable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900 text-sm">Ən Çox Satılan 10 Məhsul</h2>
            </div>
            <span className="text-xs text-slate-400">Say üzrə</span>
          </div>

          <div className="divide-y divide-slate-100">
            {bestSelling.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Seçilmiş dövr üçün satış qeydi yoxdur.
              </div>
            ) : (
              bestSelling.map((item, idx) => (
                <div key={item.name} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-blue-600">{item.quantity} ədəd</span>
                    <p className="text-xs text-slate-400">
                      {item.amount.toFixed(2)} {setting.currency}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Profitable */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-slate-900 text-sm">Ən Çox Qazanc Gətirən 10 Məhsul</h2>
            </div>
            <span className="text-xs text-slate-400">Mənfəət üzrə</span>
          </div>

          <div className="divide-y divide-slate-100">
            {mostProfitable.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Seçilmiş dövr üçün mənfəət qeydi yoxdur.
              </div>
            ) : (
              mostProfitable.map((item, idx) => (
                <div key={item.name} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-600">
                      +{item.amount.toFixed(2)} {setting.currency}
                    </span>
                    <p className="text-xs text-slate-400">{item.quantity} ədəd satılıb</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
