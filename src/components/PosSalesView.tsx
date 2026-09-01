import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  X,
  History,
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

  // Barcode & Catalog State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Cart State
  const [cart, setCart] = useState<CartRow[]>([]);
  const [discount, setDiscount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Nağd' | 'Kart' | 'Borc'>('Nağd');
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<'Nağd' | 'Kart'>('Nağd');
  const [customerName, setCustomerName] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Default and extracted quick customers
  const defaultQuickCustomers = ['Elmir', 'Rəşad Əliyev', 'Aysel Məmmədova', 'Samir Quliyev', 'Leyla Həsənova'];
  const previousCustomerNames = useMemo(() => {
    const existing = sales
      .map((s) => s.customerName?.trim())
      .filter((name): name is string => Boolean(name && name.length > 0));
    const combined = Array.from(new Set([...defaultQuickCustomers, ...existing]));
    return combined.slice(0, 7);
  }, [sales]);

  // Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Notifications
  const [posError, setPosError] = useState<string | null>(null);
  const [posSuccess, setPosSuccess] = useState<string | null>(null);

  // Sales history filter
  const [historySearch, setHistorySearch] = useState('');

  // Focus barcode input on mount
  useEffect(() => {
    if (activeSubTab === 'kassa') {
      barcodeInputRef.current?.focus();
    }
  }, [activeSubTab]);

  // Calculations
  const subtotal = Number(cart.reduce((acc, row) => acc + row.total, 0).toFixed(2));
  const discountNum = typeof discount === 'number' ? discount : 0;
  const total = Math.max(0, Number((subtotal - discountNum).toFixed(2)));
  const paidNum = typeof paidAmount === 'number' ? paidAmount : 0;
  const change = paymentMethod === 'Borc' ? 0 : Math.max(0, Number((paidNum - total).toFixed(2)));
  const debt = paymentMethod === 'Borc' ? Math.max(0, Number((total - paidNum).toFixed(2))) : 0;

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

    if (paymentMethod !== 'Borc' && (paidAmount === '' || paidAmount === total || paidNum === 0)) {
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
    setDiscount('');
    setPaidAmount('');
    setCustomerName('');
    setSaleNotes('');
    setPosError(null);
  };

  // Barcode submit
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const product = byBarcode(code);
    if (product) {
      addToCart(product);
      setPosSuccess(`${product.name} əlavə edildi`);
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

  // Scroll categories left/right
  const handleScrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth',
      });
    }
  };

  // Complete checkout
  const handleCheckout = () => {
    try {
      setPosError(null);
      if (cart.length === 0) throw new Error('Səbət boşdur.');

      const numPaid = typeof paidAmount === 'number' ? paidAmount : 0;

      if (paymentMethod !== 'Borc' && numPaid < total) {
        throw new Error(
          `Ödənilən məbləğ (${numPaid.toFixed(2)} ${setting.currency}) yekun məbləğdən (${total.toFixed(2)} ${setting.currency}) azdır! Qalan məbləği borca yazmaq üçün "Borc" növünü seçin.`
        );
      }

      if (paymentMethod === 'Borc' && !customerName.trim() && !saleNotes.trim()) {
        throw new Error('Borc satışı üçün borc götürən müştərinin adını mütləq daxil edin (məsələn: Elmir).');
      }

      const effectiveCustomerName = customerName.trim() || (paymentMethod === 'Borc' ? saleNotes.trim() : '');

      const sale = completeSale({
        items: cart.map((r) => ({ productId: r.product.id, quantity: r.quantity })),
        discount: discountNum,
        paidAmount: paymentMethod === 'Borc' ? numPaid : (numPaid || total),
        paymentMethod,
        partialPaymentMethod: paymentMethod === 'Borc' ? partialPaymentMethod : undefined,
        customerName: effectiveCustomerName,
        notes: saleNotes.trim() || undefined,
      });

      setCompletedSale(sale);
      setIsReceiptOpen(true);
      clearCart();
      setPaymentMethod('Nağd');
      setPosSuccess(`Satış #${sale.id} uğurla tamamlandı!`);
      setTimeout(() => setPosSuccess(null), 3500);
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
    if (window.confirm(`#${saleId} nömrəli satışı tamamilə silmək istəyirsiniz?`)) {
      try {
        deleteSale(saleId, true);
        setPosSuccess(`Satış #${saleId} silindi.`);
        setTimeout(() => setPosSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Silmə mümkün olmadı.');
      }
    }
  };

  // Filter Catalog Products
  const catalogProducts = useMemo(() => {
    return products.filter((p) => {
      const q = catalogSearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchQuery && matchCategory;
    });
  }, [products, catalogSearch, selectedCategory]);

  return (
    <div className="space-y-4">
      {/* Toast Notifications */}
      {posError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{posError}</span>
          </div>
          <button onClick={() => setPosError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {posSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{posSuccess}</span>
          </div>
          <button onClick={() => setPosSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtab Toggle (Minimalist top right or embedded) */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('kassa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'kassa'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Kassa (POS)
          </button>
          <button
            onClick={() => setActiveSubTab('tarixce')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'tarixce'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Satış Tarixçəsi ({sales.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'kassa' ? (
        /* Main 2-Column POS Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Barcode, Category Filter, Product Grid (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Barcode Search Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <form onSubmit={handleBarcodeScan} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-blue-600">
                    <span className="font-mono text-sm tracking-tighter font-bold">||||</span>
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Barkod oxudun və ya daxil edib Enter basın.."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Əlavə et
                </button>
              </form>
            </div>

            {/* 2. Categories Pill Bar with Scroll Arrows & Search */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                {/* Search Toggle Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`p-2 rounded-xl border transition cursor-pointer shrink-0 ${
                    isSearchOpen || catalogSearch
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Mallar üzrə axtarış"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                {/* Left Arrow */}
                <button
                  type="button"
                  onClick={() => handleScrollCategories('left')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Scrollable Categories List */}
                <div
                  ref={categoryScrollRef}
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 text-xs py-0.5"
                  style={{ scrollbarWidth: 'none' }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hamısı
                  </button>

                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.name)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === c.name
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  type="button"
                  onClick={() => handleScrollCategories('right')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Expandable Search Input */}
              {isSearchOpen && (
                <div className="relative pt-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Məhsul adı və ya barkod ilə filtr..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Product Cards Grid (4 Columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {catalogProducts.map((p) => {
                const isLow = p.stockQuantity <= (p.minimumStock || 5);
                const isZero = p.stockQuantity <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs hover:border-blue-400 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-[126px] text-left group"
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{p.category}</p>
                    </div>

                    <div className="flex items-end justify-between pt-1">
                      <span className="font-extrabold text-sm text-slate-900">
                        {p.salePrice.toFixed(2)} {setting.currency}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isZero
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
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

          {/* Right Column: Cart & Checkout Box (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">Cari Səbət</h2>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-extrabold">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer transition"
                >
                  Təmizlə
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-200" />
                  <p className="text-xs font-semibold text-slate-500">Səbət boşdur</p>
                  <p className="text-[11px] text-slate-400">Soldan məhsul seçin və ya barkod oxudun</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.product.salePrice.toFixed(2)} {setting.currency} × {item.quantity} ={' '}
                        <span className="font-bold text-slate-800">
                          {item.total.toFixed(2)} {setting.currency}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-6 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount and Payment Method Row */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Endirim ({setting.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  placeholder="0.00"
                  onChange={(e) => setDiscount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ödəniş Növü</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Nağd', 'Kart', 'Borc'] as const).map((method) => {
                    const isBorc = method === 'Borc';
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method === 'Borc') {
                            setPaidAmount(0);
                          } else {
                            setPaidAmount(total);
                          }
                        }}
                        className={`py-2 px-1 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 border cursor-pointer ${
                          isSelected
                            ? isBorc
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isBorc ? '⚠️ Borc' : method}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Borc & Hissəli Ödəniş Details Container */}
            {paymentMethod === 'Borc' ? (
              <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50/40 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Borc & Hissəli Ödəniş Məlumatları</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                    Nisyə Dəftəri
                  </span>
                </div>

                {/* 1. Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Borc Götürən Şəxs (Müştəri Adı) <span className="text-rose-600 font-extrabold">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Məsələn: Elmir"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  {/* Quick selection chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-amber-800 font-semibold">Tez seçim:</span>
                    {previousCustomerNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCustomerName(name)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border cursor-pointer ${
                          customerName === name
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Paid Amount and Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-amber-900">
                      İndi Ödənilən Məbləğ ({setting.currency}):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      (Məs: 150 ₼-dan 100 ₼ ödəyir)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={total}
                      step="0.01"
                      value={paidAmount}
                      placeholder="0"
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />

                    {/* Quick Amount Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPaidAmount(0)}
                        className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer"
                      >
                        0 ₼
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(50)}
                        className="px-2 py-1 bg-white hover:bg-amber-100 text-slate-800 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer"
                      >
                        50 ₼
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(100)}
                        className="px-2 py-1 bg-white hover:bg-amber-100 text-slate-800 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer"
                      >
                        100 ₼
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(total)}
                        className="px-2 py-1 bg-white hover:bg-amber-100 text-slate-800 text-[10px] font-bold rounded-lg border border-amber-200 cursor-pointer"
                      >
                        Tam
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Summary Block */}
                <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200/80 space-y-1 text-xs text-slate-800">
                  <div className="flex justify-between font-semibold">
                    <span>Cəmi Səbət Məbləği:</span>
                    <span>{total.toFixed(2)} {setting.currency}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-800">
                    <span>İndi Ödənilən (Nağd):</span>
                    <span>{paidNum.toFixed(2)} {setting.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-rose-600 pt-1 border-t border-amber-200">
                    <span>⚠️ Borca Qalan Məbləğ:</span>
                    <span>{debt.toFixed(2)} {setting.currency}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-amber-900 pt-0.5">
                    <span>Borc Götürən:</span>
                    <span>{customerName.trim() || '—'}</span>
                  </div>
                </div>

                {/* 4. Sale Note */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Satış Qeydi (Məsələn: Ağ polo 85 manat Borc Elmir götürdü)
                  </label>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="Qeyd və ya xüsusi məlumat..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* Standard Cash/Card Summary Panel */
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Cəmi Məbləğ:</span>
                  <span>{subtotal.toFixed(2)} {setting.currency}</span>
                </div>
                {discountNum > 0 && (
                  <div className="flex justify-between font-semibold text-rose-600">
                    <span>Endirim:</span>
                    <span>-{discountNum.toFixed(2)} {setting.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>YEKUN ÖDƏNİŞ:</span>
                  <span className="text-blue-600">{total.toFixed(2)} {setting.currency}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 items-center">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ödənilən ({setting.currency}):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder={total.toFixed(2)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-700">Qalıq Pul:</span>
                    <p className="font-extrabold text-sm text-emerald-700">
                      {change.toFixed(2)} {setting.currency}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Müştəri Adı (İstəyə bağlı)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Məsələn: Rəşad Əliyev"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Complete Checkout Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3.5 text-white font-bold rounded-xl shadow-md text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : paymentMethod === 'Borc'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {paymentMethod === 'Borc'
                ? `Satışı Tamamla (${debt.toFixed(2)} ${setting.currency} Borc, ${paidNum.toFixed(2)} ${setting.currency} Ödənilən)`
                : `Satışı Tamamla (${total.toFixed(2)} ${setting.currency})`}
            </button>
          </div>
        </div>
      ) : (
        /* History & Returns View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900 text-base">Satışlar Tarixçəsi</h2>
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Çek no və ya müştəri ilə axtar..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-3">Çek No</th>
                  <th className="py-3 px-3">Tarix</th>
                  <th className="py-3 px-3">Məhsullar</th>
                  <th className="py-3 px-3">Müştəri</th>
                  <th className="py-3 px-3 text-center">Ödəniş</th>
                  <th className="py-3 px-3 text-right">Məbləğ</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Əməliyyat</th>
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
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">#{sale.id}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {sale.date ? sale.date.split('T')[0] : ''}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">
                          {sale.items.length} növ məhsul
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {sale.customerName || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.paymentMethod === 'Borc'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {sale.total.toFixed(2)} {setting.currency}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {sale.isReturned ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                            Qaytarılıb
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Tamamlandı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setCompletedSale(sale);
                              setIsReceiptOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            title="Çekə Bax"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!sale.isReturned && (
                            <button
                              onClick={() => handleReturnSale(sale.id)}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-amber-50"
                              title="Qaytarma"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <ReceiptModal
          sale={completedSale}
          onClose={() => {
            setIsReceiptOpen(false);
            setCompletedSale(null);
          }}
        />
      )}
    </div>
  );
};
