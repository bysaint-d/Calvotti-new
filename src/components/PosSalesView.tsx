import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  UserCheck,
  RotateCcw,
  Printer,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { Product, CartRow, Sale } from '../types';
import { useStore } from '../context/StoreContext';
import { ReceiptModal } from './ReceiptModal';

interface PosSalesViewProps {
  onOpenNewProduct?: (barcode: string) => void;
}

export const PosSalesView: React.FC<PosSalesViewProps> = ({ onOpenNewProduct }) => {
  const {
    products,
    sales,
    categories,
    setting,
    completeSale,
    returnSale,
    deleteSale,
    byBarcode,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'kassa' | 'tarixce'>('kassa');

  // Barcode & Product Catalog State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartRow[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Nağd' | 'Kart' | 'Borc'>('Nağd');
  const [customerName, setCustomerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Extract unique customer names from previous sales for quick selection
  const previousCustomerNames = Array.from(
    new Set(
      sales
        .map((s) => s.customerName?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0))
    )
  ).slice(0, 8);

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Notifications
  const [posError, setPosError] = useState<string | null>(null);
  const [posSuccess, setPosSuccess] = useState<string | null>(null);

  // Sales history filter
  const [historySearch, setHistorySearch] = useState('');

  // Auto-focus barcode input
  useEffect(() => {
    if (activeSubTab === 'kassa') {
      barcodeInputRef.current?.focus();
    }
  }, [activeSubTab]);

  // Cart Calculations
  const subtotal = Number(cart.reduce((acc, row) => acc + row.total, 0).toFixed(2));
  const total = Math.max(0, Number((subtotal - discount).toFixed(2)));
  const change = paymentMethod === 'Borc' ? 0 : Math.max(0, Number((paidAmount - total).toFixed(2)));
  const debt = paymentMethod === 'Borc' ? Math.max(0, Number((total - paidAmount).toFixed(2))) : 0;

  // Auto set paid amount to total when total changes and method is not changed manually
  const handleSelectExactAmount = () => {
    setPaidAmount(total);
  };

  const handleAddQuickCash = (amount: number) => {
    setPaidAmount((prev) => Number((prev + amount).toFixed(2)));
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setPosError(null);
    if (product.stockQuantity <= 0 && !setting.allowNegativeStock) {
      setPosError(`${product.name} stokda qalmayıb!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((r) => r.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stockQuantity && !setting.allowNegativeStock) {
          setPosError(`${product.name} üçün maksimum stok: ${product.stockQuantity}`);
          return prev;
        }
        return prev.map((r) =>
          r.product.id === product.id
            ? { ...r, quantity: r.quantity + 1, total: Number(((r.quantity + 1) * product.salePrice).toFixed(2)) }
            : r
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            total: product.salePrice,
          },
        ];
      }
    });

    // Autofill paidAmount if it was previously equal to previous total
    if (paidAmount === total || paidAmount === 0) {
      setPaidAmount(Number((total + product.salePrice).toFixed(2)));
    }
  };

  const updateCartQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && qty > prod.stockQuantity && !setting.allowNegativeStock) {
      setPosError(`${prod.name} üçün mövcud stok: ${prod.stockQuantity}`);
      return;
    }

    setCart((prev) =>
      prev.map((r) =>
        r.product.id === productId
          ? { ...r, quantity: qty, total: Number((qty * r.product.salePrice).toFixed(2)) }
          : r
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((r) => r.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount(0);
    setCustomerName('');
    setSaleNotes('');
    setPosError(null);
  };

  // Barcode scanner trigger
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const product = byBarcode(code);
    if (product) {
      addToCart(product);
      setPosSuccess(`${product.name} səbətə əlavə edildi`);
      setTimeout(() => setPosSuccess(null), 2000);
    } else {
      if (onOpenNewProduct) {
        if (window.confirm(`'${code}' barkodlu məhsul tapılmadı. Yeni məhsul kimi qeydiyyatdan keçirilsin?`)) {
          onOpenNewProduct(code);
        }
      } else {
        setPosError(`'${code}' barkodu ilə məhsul tapılmadı!`);
      }
    }
    setBarcodeInput('');
  };

  // Complete the sale
  const handleCheckout = () => {
    try {
      setPosError(null);
      if (cart.length === 0) throw new Error('Səbət boşdur.');
      if (paymentMethod !== 'Borc' && paidAmount < total) {
        throw new Error(`Ödənilən məbləğ (${paidAmount} ${setting.currency}) yekun məbləğdən (${total} ${setting.currency}) azdır!`);
      }
      if (paymentMethod === 'Borc' && !customerName.trim() && !saleNotes.trim()) {
        throw new Error('Borc satışı üçün müştəri adını və ya qeydini mütləq daxil edin (məs: Elmir).');
      }

      const effectiveCustomerName = customerName.trim() || (paymentMethod === 'Borc' ? saleNotes.trim() : '');

      const sale = completeSale({
        items: cart.map((r) => ({ productId: r.product.id, quantity: r.quantity })),
        discount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || (paymentMethod === 'Borc' ? 0 : total),
        paymentMethod,
        customerName: effectiveCustomerName,
        notes: saleNotes.trim() || undefined,
      });

      setCompletedSale(sale);
      setIsReceiptOpen(true);
      clearCart();
      setPosSuccess(`Satış #${sale.id} uğurla tamamlandı!`);
      setTimeout(() => setPosSuccess(null), 4000);
    } catch (err: any) {
      setPosError(err.message || 'Satış tamamlana bilmədi.');
    }
  };

  // Return sale handler
  const handleReturnSale = (saleId: number) => {
    if (window.confirm(`#${saleId} nömrəli satışı ləğv edib malları anbara qaytarmaq istədiyinizdən əminsiniz?`)) {
      try {
        returnSale(saleId);
        setPosSuccess(`Satış #${saleId} qaytarıldı və stok bərpa edildi.`);
        setTimeout(() => setPosSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Qaytarma mümkün olmadı.');
      }
    }
  };

  // Delete sale handler
  const handleDeleteSale = (saleId: number) => {
    if (window.confirm(`#${saleId} nömrəli satışı tamamilə silmək istəyirsiniz? (Satılan məhsullar yenidən anbar stokuna əlavə ediləcək)`)) {
      try {
        deleteSale(saleId, true);
        setPosSuccess(`Satış #${saleId} silindi və mallar anbara qaytarıldı.`);
        setTimeout(() => setPosSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Silmə mümkün olmadı.');
      }
    }
  };

  // Filter Catalog Products
  const catalogProducts = products.filter((p) => {
    const q = catalogSearch.trim().toLowerCase();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q);

    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchQuery && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* Sub tabs: Kassa POS vs Tarixçə */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kassa')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              activeSubTab === 'kassa'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Kassa Terminalı (POS)
          </button>
          <button
            onClick={() => setActiveSubTab('tarixce')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
              activeSubTab === 'tarixce'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Satış Tarixçəsi & Qaytarma ({sales.length})
          </button>
        </div>

        {/* Global Notifications */}
        {posError && (
          <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {posError}
          </div>
        )}
        {posSuccess && (
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {posSuccess}
          </div>
        )}
      </div>

      {activeSubTab === 'kassa' ? (
        /* POS Terminal Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Barcode & Catalog Browser (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barcode Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <form onSubmit={handleBarcodeScan} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-5 h-5 text-blue-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Barkod oxudun və ya daxil edib Enter basın..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20 text-sm flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Əlavə et
                </button>
              </form>
            </div>

            {/* Product Catalog Grid */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              {/* Search & Categories */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Mallar üzrə axtarış..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hamısı
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                        selectedCategory === c.name
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[440px] overflow-y-auto p-1">
                {catalogProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minimumStock;
                  const isZero = p.stockQuantity <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 text-left transition flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800 line-clamp-2 group-hover:text-blue-600 transition">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{p.category}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="font-extrabold text-sm text-slate-900">
                          {p.salePrice.toFixed(2)} {setting.currency}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isZero
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200/60 text-slate-700'
                          }`}
                        >
                          {p.stockQuantity} əd.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Cart & Checkout (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-base">Cari Səbət</h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Təmizlə
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="p-4 space-y-2.5 flex-1 max-h-[320px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="w-12 h-12 mx-auto text-slate-200" />
                  <p className="text-sm font-medium">Səbət boşdur</p>
                  <p className="text-xs text-slate-400">
                    Barkod oxudun və ya soldakı siyahıdan məhsul seçin
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {item.product.salePrice.toFixed(2)} {setting.currency} × {item.quantity} ={' '}
                        <span className="font-bold text-slate-800">{item.total.toFixed(2)} {setting.currency}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartQuantity(item.product.id, parseInt(e.target.value) || 1)
                        }
                        className="w-10 text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />

                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment & Calculation Drawer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              {/* Discount and Payment Method */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Endirim ({setting.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={discount || ''}
                    placeholder="0.00"
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Ödəniş Növü</label>
                  <div className="flex gap-1">
                    {(['Nağd', 'Kart', 'Borc'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method === 'Kart') setPaidAmount(total);
                          if (method === 'Borc') setPaidAmount(0);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                          paymentMethod === method
                            ? method === 'Borc'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {method === 'Borc' ? '⚠️ Borc' : method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Name & Notes */}
              <div className={`p-3 rounded-xl border space-y-2.5 transition ${
                paymentMethod === 'Borc'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-slate-50/80 border-slate-200 text-slate-800'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Müştəri Adı {paymentMethod === 'Borc' && <span className="text-rose-600 font-bold">*</span>}</span>
                    </label>
                    {paymentMethod === 'Borc' && (
                      <span className="text-[10px] font-semibold bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
                        Borc Dəftərinə yazılacaq
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={paymentMethod === 'Borc' ? 'Məsələn: Elmir' : 'Müştəri adı (istəyə bağlı)...'}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  {previousCustomerNames.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-400">Tez seçim:</span>
                      {previousCustomerNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setCustomerName(name)}
                          className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition font-medium"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Satış Qeydi (Məs: Ağ polo 85 manat Borc Elmir götürdü)
                  </label>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="Qeyd və ya xüsusi məlumat..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Cash Selection Buttons */}
              {paymentMethod === 'Nağd' && total > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <button
                    onClick={handleSelectExactAmount}
                    className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-md hover:bg-emerald-200 whitespace-nowrap"
                  >
                    Dəqiq ({total.toFixed(2)})
                  </button>
                  {[1, 5, 10, 20, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAddQuickCash(val)}
                      className="px-2 py-1 bg-white border border-slate-200 font-semibold rounded-md hover:bg-slate-100 text-slate-700"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              )}

              {/* Summary Numbers */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Cəmi Məbləğ:</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} {setting.currency}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Endirim:</span>
                    <span>-{discount.toFixed(2)} {setting.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                  <span>YEKUN ÖDƏNİŞ:</span>
                  <span className="text-blue-600">{total.toFixed(2)} {setting.currency}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 items-center">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Ödənilən:</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div className="text-right">
                    {paymentMethod === 'Borc' ? (
                      <div>
                        <span className="text-[11px] text-amber-600 font-semibold">Qalan Borc:</span>
                        <p className="font-bold text-sm text-amber-600">{debt.toFixed(2)} {setting.currency}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[11px] text-emerald-700 font-semibold">Qalıq Pul:</span>
                        <p className="font-bold text-sm text-emerald-700">{change.toFixed(2)} {setting.currency}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-base flex items-center justify-center gap-2 transition"
              >
                <CheckCircle className="w-5 h-5" />
                Satışı Tamamla ({total.toFixed(2)} {setting.currency})
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Sales History & Returns View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 text-base">Satışlar Tarixçəsi</h2>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Çek nömrəsi və ya müştəri ilə axtar..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="py-3 px-4">Çek No</th>
                  <th className="py-3 px-3">Tarix & Saat</th>
                  <th className="py-3 px-3">Məhsullar</th>
                  <th className="py-3 px-3">Müştəri</th>
                  <th className="py-3 px-3 text-center">Ödəniş</th>
                  <th className="py-3 px-3 text-right">Yekun Məbləğ</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales
                  .filter((s) => {
                    const q = historySearch.trim().toLowerCase();
                    return (
                      !q ||
                      s.id.toString().includes(q) ||
                      (s.customerName && s.customerName.toLowerCase().includes(q))
                    );
                  })
                  .map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        #{sale.id}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">
                        {new Date(sale.date).toLocaleString('az-AZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700">
                        <span className="font-semibold">{sale.items.length} çeşid:</span>{' '}
                        {sale.items.map((i) => `${i.productName} (${i.quantity} əd.)`).join(', ')}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-600 font-medium">
                        {sale.customerName || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {sale.total.toFixed(2)} {setting.currency}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {sale.isReturned ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                            Qaytarılıb
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Tamamlandı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setCompletedSale(sale);
                              setIsReceiptOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Çeki göstər / Çap et"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {!sale.isReturned && (
                            <button
                              onClick={() => handleReturnSale(sale.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-1"
                              title="Satışı qaytar"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Qaytar
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1"
                            title="Satışı sil (malları stoka qaytarır)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setIsReceiptOpen(false)} />
      )}
    </div>
  );
};
