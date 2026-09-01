import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  DollarSign,
  User,
  Calendar,
  Clock,
  AlertCircle,
  TrendingDown,
  Printer,
  ChevronDown,
  ChevronUp,
  Coins,
  ArrowRight,
  Filter,
  Check,
  Receipt,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Sale } from '../types';
import { ReceiptModal } from './ReceiptModal';

export const BorclarView: React.FC = () => {
  const { sales, payDebt, setting } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'all' | 'settled'>('active');
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Nağd' | 'Kart'>('Nağd');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);

  // All sales that have debt history (either currently has debt or was a debt sale)
  const debtSales = useMemo(() => {
    return sales
      .filter((s) => s.paymentMethod === 'Borc' || s.debtAmount > 0 || (s.paidAmount < s.total && !s.isReturned))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  // Overall statistics
  const totalActiveDebt = useMemo(() => {
    return debtSales.reduce((acc, s) => acc + (s.debtAmount || 0), 0);
  }, [debtSales]);

  const activeDebtCount = useMemo(() => {
    return debtSales.filter((s) => (s.debtAmount || 0) > 0).length;
  }, [debtSales]);

  const totalCollectedDebt = useMemo(() => {
    return debtSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  }, [debtSales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return debtSales.filter((sale) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        sale.id.toString().includes(q) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
        (sale.notes && sale.notes.toLowerCase().includes(q)) ||
        sale.items.some((i) => i.productName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === 'active') return sale.debtAmount > 0;
      if (filterStatus === 'settled') return sale.debtAmount === 0;
      return true;
    });
  }, [debtSales, searchTerm, filterStatus]);

  // Customer grouped aggregated summary
  const customerDebtsSummary = useMemo(() => {
    const map = new Map<string, { totalDebt: number; totalSales: number; lastDate: string }>();
    debtSales
      .filter((s) => s.debtAmount > 0)
      .forEach((s) => {
        const name = s.customerName?.trim() || 'Adsız Müştəri';
        const current = map.get(name) || { totalDebt: 0, totalSales: 0, lastDate: s.date };
        current.totalDebt += s.debtAmount;
        current.totalSales += 1;
        if (new Date(s.date) > new Date(current.lastDate)) {
          current.lastDate = s.date;
        }
        map.set(name, current);
      });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [debtSales]);

  // Handle opening pay modal
  const handleOpenPayModal = (sale: Sale) => {
    setSelectedSaleForPayment(sale);
    setPaymentAmount(sale.debtAmount.toString());
    setPaymentError(null);
    setPaymentSuccess(null);
  };

  // Submit debt payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleForPayment) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Zəhmət olmasa düzgün məbləğ daxil edin.');
      return;
    }

    if (amount > selectedSaleForPayment.debtAmount) {
      setPaymentError(`Ödəniş məbləği qalıq borcdan (${selectedSaleForPayment.debtAmount} ${setting.currency}) çox ola bilməz.`);
      return;
    }

    try {
      payDebt(selectedSaleForPayment.id, amount, paymentMethod);
      setPaymentSuccess(`${amount} ${setting.currency} borc ödənişi uğurla qəbul edildi!`);
      setTimeout(() => {
        setSelectedSaleForPayment(null);
        setPaymentSuccess(null);
      }, 1200);
    } catch (err: any) {
      setPaymentError(err.message || 'Ödəniş qeyd edilə bilmədi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            Borclar və Nisyə Dəftəri
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Borca götürülmüş mallar, müştərilər üzrə borc siyahısı və hissə-hissə borc ödənişlərinin qəbulu
          </p>
        </div>

        {/* Action / Search stats */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            {activeDebtCount} aktiv borc qeydi
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-linear-to-br from-amber-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Cəmi Qalıq Borc</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-amber-900 mt-2">
            {totalActiveDebt.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-amber-700/80 mt-1">Müştərilərdən alınacaq ümumi məbləğ</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-linear-to-br from-emerald-50/50 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ödənilmiş Məbləğ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-900 mt-2">
            {totalCollectedDebt.toFixed(2)} {setting.currency}
          </h3>
          <p className="text-xs text-emerald-700/80 mt-1">Nisyə satışlardan yığılan vəsait</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Borclu Müştəri Sayı</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {customerDebtsSummary.length} <span className="text-sm font-normal text-slate-500">nəfər</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Aktiv borcu olan müştərilər</p>
        </div>
      </div>

      {/* Top Debtors Quick Chips */}
      {customerDebtsSummary.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" />
              Müştərilər üzrə Qalıq Borclar:
            </span>
            <span className="text-[11px] text-slate-400">Filtr üçün müştərinin adına klikləyin</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {customerDebtsSummary.map((cust) => (
              <button
                key={cust.name}
                onClick={() => setSearchTerm(cust.name === searchTerm ? '' : cust.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                  searchTerm === cust.name
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>{cust.name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
                  searchTerm === cust.name ? 'bg-amber-700 text-white' : 'bg-white text-amber-800'
                }`}>
                  {cust.totalDebt.toFixed(2)} {setting.currency}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müştəri adı, qeyd (məs: Elmir) və ya çek nömrəsinə görə axtar..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {[
              { id: 'active', label: 'Aktiv Borclar' },
              { id: 'settled', label: 'Bağlanmış Borclar' },
              { id: 'all', label: 'Hamısı' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id as any)}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
                  filterStatus === st.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of Debt Sales */}
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-semibold text-slate-700">Seçilmiş parametr üzrə borc qeydi tapılmadı.</p>
            <p className="text-xs text-slate-400">Bütün borclar ödənilib və ya axtarışa uyğun nəticə yoxdur.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSales.map((sale) => {
              const isExpanded = expandedSaleId === sale.id;
              const formattedDate = new Date(sale.date).toLocaleString('az-AZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sale.id}
                  className={`p-4 transition ${
                    sale.debtAmount > 0
                      ? 'hover:bg-amber-50/40 bg-white'
                      : 'hover:bg-slate-50/50 bg-slate-50/20 opacity-80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Customer & Info */}
                    <div className="flex items-start md:items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs flex-shrink-0 ${
                        sale.debtAmount > 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {sale.debtAmount > 0 ? (
                          <>
                            <span className="text-[9px] uppercase">BORC</span>
                            <span>#{sale.id}</span>
                          </>
                        ) : (
                          <Check className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <User className="w-4 h-4 text-slate-400" />
                            {sale.customerName || 'Adsız Müştəri'}
                          </span>

                          <span className="text-xs text-slate-400 font-mono">Çek #{sale.id}</span>

                          {sale.debtAmount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Qalıq: {sale.debtAmount.toFixed(2)} {setting.currency}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Tam Ödənilib
                            </span>
                          )}
                        </div>

                        {/* Note & Date */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formattedDate}
                          </span>
                          <span>•</span>
                          <span>{sale.items.length} çeşid məhsul</span>
                          {sale.notes && (
                            <>
                              <span>•</span>
                              <span className="text-amber-900 bg-amber-100/70 border border-amber-200/80 px-2 py-0.5 rounded text-[11px] font-semibold">
                                Qeyd: {sale.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Numbers & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right text-xs space-y-0.5">
                        <div className="text-slate-500">
                          Yekun Məbləğ: <span className="font-bold text-slate-800">{sale.total.toFixed(2)} {setting.currency}</span>
                        </div>
                        <div className="text-slate-500">
                          Ödənilən: <span className="font-bold text-emerald-600">{sale.paidAmount.toFixed(2)} {setting.currency}</span>
                          {sale.paidAmount > 0 && sale.partialPaymentMethod && (
                            <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              {sale.partialPaymentMethod}
                            </span>
                          )}
                        </div>
                        {sale.debtAmount > 0 && (
                          <div className="text-amber-800 font-extrabold text-[11px]">
                            Qalıq Borc: <span>{sale.debtAmount.toFixed(2)} {setting.currency}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {sale.debtAmount > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(sale)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition flex items-center gap-1.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Ödəniş Qəbul Et</span>
                          </button>
                        )}

                        <button
                          onClick={() => setReceiptSale(sale)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                          title="Çekə Bax"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 bg-slate-50/50 p-3 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-slate-700">Götürülən Məhsullar:</p>
                      <div className="divide-y divide-slate-200/60 bg-white rounded-lg border border-slate-200">
                        {sale.items.map((item) => (
                          <div key={item.id} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{item.productName}</p>
                              {item.productBarcode && (
                                <p className="text-[10px] text-slate-400 font-mono">{item.productBarcode}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-700">
                                {item.quantity} ədəd × {item.salePrice.toFixed(2)} {setting.currency}
                              </span>
                              <p className="font-bold text-slate-900">
                                = {item.total.toFixed(2)} {setting.currency}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pay Debt Modal */}
      {selectedSaleForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Borc Ödənişi Qəbulu</h3>
              </div>
              <button
                onClick={() => setSelectedSaleForPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                  {paymentError}
                </div>
              )}

              {paymentSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {paymentSuccess}
                </div>
              )}

              {/* Customer & Debt Overview */}
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Müştəri:</span>
                  <span className="font-bold text-slate-900">{selectedSaleForPayment.customerName || 'Adsız'}</span>
                </div>
                {selectedSaleForPayment.notes && (
                  <div className="flex justify-between text-slate-600">
                    <span>Qeyd:</span>
                    <span className="font-medium text-amber-900">{selectedSaleForPayment.notes}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Satış Çeki:</span>
                  <span className="font-mono">#{selectedSaleForPayment.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Yekun Satış:</span>
                  <span>{selectedSaleForPayment.total.toFixed(2)} {setting.currency}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-amber-900 pt-2 border-t border-amber-200">
                  <span>Cari Qalıq Borc:</span>
                  <span>{selectedSaleForPayment.debtAmount.toFixed(2)} {setting.currency}</span>
                </div>
              </div>

              {/* Payment Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ödəniləcək Məbləğ ({setting.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedSaleForPayment.debtAmount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedSaleForPayment.debtAmount.toString())}
                    className="absolute right-2 top-2 px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md"
                  >
                    Tam Borc
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kassaya Daxilolma Növü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Nağd')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      paymentMethod === 'Nağd'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💵 Nağd Kassa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Kart')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      paymentMethod === 'Kart'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    💳 Bank Kartı
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition"
                >
                  Ödənişi Təsdiq Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </div>
  );
};
