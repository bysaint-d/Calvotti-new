import React, { useState } from 'react';
import {
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  Sliders,
  History,
  AlertTriangle,
  Package,
  X,
  Check,
  Tag,
  Truck,
  ArrowUpDown,
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    suppliers,
    setting,
    movements,
    saveProduct,
    deleteProduct,
    adjustStock,
    addCategory,
    addSupplier,
    byBarcode,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Barcode input for quick lookup or new entry
  const [barcodeInput, setBarcodeInput] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetProduct, setAdjustTargetProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState('');

  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [movementFilterProduct, setMovementFilterProduct] = useState<Product | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields for create / edit
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSalePrice, setFormSalePrice] = useState<number>(0);
  const [formStockQuantity, setFormStockQuantity] = useState<number>(0);
  const [formMinimumStock, setFormMinimumStock] = useState<number>(5);
  const [formSupplier, setFormSupplier] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Inline quick category / supplier add
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newSupplierInput, setNewSupplierInput] = useState('');
  const [showAddSupplierInput, setShowAddSupplierInput] = useState(false);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.supplier && p.supplier.toLowerCase().includes(q));

    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchLowStock = !showLowStockOnly || p.stockQuantity <= p.minimumStock;

    return matchQuery && matchCategory && matchLowStock;
  });

  const openCreateModal = (presetBarcode = '') => {
    setEditingProduct(null);
    setFormName('');
    setFormBarcode(presetBarcode);
    setFormCategory(categories[0]?.name || 'Ərzaq');
    setFormPurchasePrice(0);
    setFormSalePrice(0);
    setFormStockQuantity(10);
    setFormMinimumStock(5);
    setFormSupplier(suppliers[0]?.name || '');
    setFormNotes('');
    setErrorMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBarcode(p.barcode || '');
    setFormCategory(p.category || (categories[0]?.name ?? 'Ərzaq'));
    setFormPurchasePrice(p.purchasePrice);
    setFormSalePrice(p.salePrice);
    setFormStockQuantity(p.stockQuantity);
    setFormMinimumStock(p.minimumStock);
    setFormSupplier(p.supplier || '');
    setFormNotes(p.notes || '');
    setErrorMessage(null);
    setIsFormModalOpen(true);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const existing = byBarcode(code);
    if (existing) {
      setSearch(code);
      setSuccessMessage(`Məhsul tapıldı: ${existing.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      openCreateModal(code);
    }
    setBarcodeInput('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveProduct({
        id: editingProduct?.id,
        name: formName,
        barcode: formBarcode,
        category: formCategory,
        purchasePrice: Number(formPurchasePrice) || 0,
        salePrice: Number(formSalePrice) || 0,
        stockQuantity: Number(formStockQuantity) || 0,
        minimumStock: Number(formMinimumStock) || 0,
        supplier: formSupplier,
        notes: formNotes,
      });

      setIsFormModalOpen(false);
      setSuccessMessage(editingProduct ? 'Məhsul yeniləndi.' : 'Yeni məhsul əlavə edildi.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`${p.name} adlı məhsulu silmək istədiyinizdən əminsiniz?`)) {
      try {
        deleteProduct(p.id);
        setSuccessMessage('Məhsul silindi.');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        alert(err.message || 'Silmək mümkün olmadı.');
      }
    }
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetProduct) return;
    try {
      adjustStock(adjustTargetProduct.id, Number(adjustAmount), adjustNote);
      setIsAdjustModalOpen(false);
      setSuccessMessage('Stok uğurla dəyişdirildi.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Stok dəyişdirmək mümkün olmadı.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Mallar və Anbar Kataloqu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cəmi {products.length} məhsul qeydiyyatdadır
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Barcode Scanner Form */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Barkod oxut və ya daxil et..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-56 font-mono"
            />
          </form>

          <button
            onClick={() => {
              setMovementFilterProduct(null);
              setIsMovementsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-1.5 transition"
          >
            <History className="w-4 h-4 text-slate-500" />
            Hərəkət Tarixçəsi
          </button>

          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            Yeni Məhsul
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Məhsul adı, kateqoriya, barkod və ya təchizatçı ilə axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              showLowStockOnly
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Yalnız Kritik Stok
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bütün Kateqoriyalar ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.name).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.name)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === c.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-semibold text-slate-500">
                <th className="py-3 px-4">Məhsul Adı</th>
                <th className="py-3 px-3">Barkod</th>
                <th className="py-3 px-3">Kateqoriya</th>
                <th className="py-3 px-3 text-right">Alış Qiyməti</th>
                <th className="py-3 px-3 text-right">Satış Qiyməti</th>
                <th className="py-3 px-3 text-center">Mövcud Stok</th>
                <th className="py-3 px-3 text-center">Min. Hədd</th>
                <th className="py-3 px-3">Təchizatçı</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">Axtarışa uyğun məhsul tapılmadı.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minimumStock;
                  const isZero = p.stockQuantity <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition group">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.name}
                        {p.notes && <p className="text-xs text-slate-400 font-normal">{p.notes}</p>}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-600">
                        {p.barcode || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 font-medium">
                        {p.purchasePrice.toFixed(2)} {setting.currency}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-900 font-bold">
                        {p.salePrice.toFixed(2)} {setting.currency}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isZero
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stockQuantity} ədəd
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-xs text-slate-400">
                        {p.minimumStock}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500 truncate max-w-[120px]">
                        {p.supplier || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Adjust Stock Button */}
                          <button
                            title="Stok düzəlişi et"
                            onClick={() => {
                              setAdjustTargetProduct(p);
                              setAdjustAmount(0);
                              setAdjustNote('');
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Movements Log for this product */}
                          <button
                            title="Hərəkət tarixçəsi"
                            onClick={() => {
                              setMovementFilterProduct(p);
                              setIsMovementsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            title="Redaktə et"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            title="Məhsulu sil"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Məhsul Məlumatlarını Redaktə Et' : 'Yeni Məhsul Əlavə Et'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Məhsul Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Məs: Milla Süd 3.2% 1L"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Barcode & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barkod</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Məs: 4760012300012"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Kateqoriya</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                      className="text-[10px] text-blue-600 font-semibold hover:underline"
                    >
                      + Yeni
                    </button>
                  </div>
                  {showAddCategoryInput ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Yeni ad..."
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryInput.trim()) {
                            addCategory(newCategoryInput.trim());
                            setFormCategory(newCategoryInput.trim());
                            setNewCategoryInput('');
                            setShowAddCategoryInput(false);
                          }
                        }}
                        className="px-2 bg-blue-600 text-white rounded-lg text-xs"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Purchase & Sale Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alış Qiyməti ({setting.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satış Qiyməti ({setting.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Stock Quantity & Minimum Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlkin / Cari Stok Miqdarı
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Stok Xəbərdarlığı
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinimumStock}
                    onChange={(e) => setFormMinimumStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Supplier Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Təchizatçı</label>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierInput(!showAddSupplierInput)}
                    className="text-[10px] text-blue-600 font-semibold hover:underline"
                  >
                    + Yeni Təchizatçı
                  </button>
                </div>
                {showAddSupplierInput ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Təchizatçı şirkət adı..."
                      value={newSupplierInput}
                      onChange={(e) => setNewSupplierInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSupplierInput.trim()) {
                          addSupplier(newSupplierInput.trim());
                          setFormSupplier(newSupplierInput.trim());
                          setNewSupplierInput('');
                          setShowAddSupplierInput(false);
                        }
                      }}
                      className="px-2 bg-blue-600 text-white rounded-lg text-xs"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <select
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seçilməyib</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qeydlər</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Məhsul haqqında əlavə qeydlər..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
                >
                  Yadda saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Stok Düzəlişi</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-sm text-slate-900">{adjustTargetProduct.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Mövcud Stok: <span className="font-semibold text-slate-800">{adjustTargetProduct.stockQuantity} ədəd</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Düzəliş Miqdarı (+ artırmaq, - azaltmaq üçün)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Yeni stok olacaq:{' '}
                  <span className="font-bold text-blue-600">
                    {adjustTargetProduct.stockQuantity + Number(adjustAmount)} ədəd
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Düzəliş Səbəbi / Qeyd</label>
                <input
                  type="text"
                  placeholder="Məs: Sayım nəticəsi, Zədələnmiş mal, Hədiyyə..."
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition"
                >
                  Stoku Tətbiq Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movements Log Modal */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Stok Hərəkətləri Tarixçəsi
                  {movementFilterProduct && ` (${movementFilterProduct.name})`}
                </h3>
                <p className="text-xs text-slate-400">Giriş, çıxış, satış və düzəliş qeydləri</p>
              </div>
              <button
                onClick={() => setIsMovementsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {movements.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Hərəkət qeydi yoxdur.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Tarix</th>
                      <th className="py-2.5 px-3">Məhsul</th>
                      <th className="py-2.5 px-3 text-center">Növ</th>
                      <th className="py-2.5 px-3 text-right">Dəyişim</th>
                      <th className="py-2.5 px-3 text-center">Əvvəlki → Yeni</th>
                      <th className="py-2.5 px-3">Qeyd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements
                      .filter((m) => !movementFilterProduct || m.productId === movementFilterProduct.id)
                      .slice(0, 100)
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(m.date).toLocaleString('az-AZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {m.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold ${
                                m.type === 'Satış'
                                  ? 'bg-blue-100 text-blue-700'
                                  : m.type === 'Alış'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : m.type === 'Qaytarma'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold ${
                              m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">
                            {m.previousStock} → <span className="font-semibold text-slate-900">{m.newStock}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{m.notes || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
