import React, { useState } from 'react';
import {
  Settings,
  Store,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  Tag,
  Truck,
  ShieldAlert,
  Database,
  Phone,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const SettingsView: React.FC = () => {
  const {
    setting,
    categories,
    suppliers,
    updateSetting,
    addCategory,
    deleteCategory,
    addSupplier,
    deleteSupplier,
    exportDatabaseJson,
    importDatabaseJson,
    resetDatabase,
    clearAllSales,
    wipeAllProducts,
  } = useStore();

  const [storeName, setStoreName] = useState(setting.storeName);
  const [currency, setCurrency] = useState(setting.currency);
  const [allowNegativeStock, setAllowNegativeStock] = useState(setting.allowNegativeStock);

  // New category
  const [newCatName, setNewCatName] = useState('');

  // New supplier
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupNotes, setNewSupNotes] = useState('');

  const [success, setSuccess] = useState<string | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('Mağaza adı boş ola bilməz.');
      return;
    }
    updateSetting({
      storeName: storeName.trim(),
      currency,
      allowNegativeStock,
    });
    setSuccess('Ayarlar yadda saxlanıldı!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      addCategory(newCatName.trim());
      setNewCatName('');
      setSuccess('Kateqoriya əlavə edildi.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Kateqoriya əlavə edilə bilmədi.');
    }
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    try {
      addSupplier(newSupName.trim(), newSupPhone.trim(), newSupNotes.trim());
      setNewSupName('');
      setNewSupPhone('');
      setNewSupNotes('');
      setSuccess('Təchizatçı əlavə edildi.');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Təchizatçı əlavə edilə bilmədi.');
    }
  };

  const handleExportBackup = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calvotti-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('Baza nüsxəsi JSON faylı kimi yükləndi!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm('Cari məlumatlar yeni faylla əvəzlənəcək. Davam edilsin?')) {
          const ok = importDatabaseJson(content);
          if (ok) {
            setSuccess('Baza uğurla bərpa edildi!');
            setTimeout(() => setSuccess(null), 3000);
          } else {
            alert('Fayl formatı düzgün deyil.');
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Bütün məlumatlar silinib ilkin nümunə bazasına qaytarılacaq. Davam edilsin?')) {
      resetDatabase();
      setStoreName('Calvotti Market');
      setCurrency('₼');
      setAllowNegativeStock(false);
      setSuccess('Baza ilkin vəziyyətinə qaytarıldı!');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleMasterWipeWithCode = () => {
    // Step 1
    const step1 = window.confirm(
      '⚠️ 1/3 XƏBƏRDARLIQ: Bütün məhsullar, anbar qalıqları, kateqoriyalar və satış tarixçəsi tamamilə sıfırlanacaq!\n\nDavam etmək istəyirsiniz?'
    );
    if (!step1) return;

    // Step 2
    const step2 = window.confirm(
      '🛑 2/3 TƏSDİQ: Bu əməliyyat GERİ QAYTARILA BİLMƏZ!\n\nBütün mağaza bazasını birdəfəlik silmək istədiyinizə tam əminsiniz?'
    );
    if (!step2) return;

    // Step 3
    const secretCode = window.prompt(
      '🔒 3/3 TƏHLÜKƏSİZLİK KODU:\n\nSıfırlama əməliyyatını tamamlamaq üçün gizli kodu daxil edin:'
    );

    if (secretCode === null) return;

    if (secretCode.trim() === 'kamal2014') {
      wipeAllProducts();
      setSuccess('🔥 Bütün məhsullar və baza uğurla sıfırlandı!');
      setTimeout(() => setSuccess(null), 4000);
    } else {
      alert('❌ XƏTA: Daxil edilmiş gizli kod yanlışdır! Sıfırlama ləğv edildi.');
    }
  };

  const handleClearSalesHistory = () => {
    if (window.confirm('Bütün satış tarixçəsini təmizləmək istəyirsiniz? (Mallar anbara qaytarılmayacaq)')) {
      clearAllSales(false);
      setSuccess('Satış tarixçəsi təmizləndi.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
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
            <Settings className="w-6 h-6 text-blue-600" />
            Sistem Ayarları və Parametrlər
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mağaza adı, valyuta, kateqoriyalar, təchizatçılar və nüsxələmə (Backup)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General Settings (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* General Store Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              Ümumi Mağaza Parametrləri
            </h2>

            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mağaza / Obyekt Adı
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valyuta Simvolu</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="₼">₼ (AZN - Azərbaycan Manatı)</option>
                  <option value="$">$ (USD - ABŞ Dolları)</option>
                  <option value="€">€ (EUR - Avro)</option>
                  <option value="₺">₺ (TRY - Türk Lirəsi)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition">
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800">Mənfi stoka icazə verilsin</span>
                    <p className="text-[11px] text-slate-400">
                      Stokda mal 0 olsa belə kassa satışına icazə verilir
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 text-sm transition"
              >
                Dəyişiklikləri Yadda Saxla
              </button>
            </form>
          </div>

          {/* Database Backup & Restore */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Verilənlər Bazası və Nüsxələmə (Backup)
            </h2>
            <p className="text-xs text-slate-500">
              Bütün məhsullar, satışlar, alışlar və maliyyə tarixçəsini JSON formatında ixrac edə və ya bərpa edə bilərsiniz.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition"
              >
                <Download className="w-5 h-5 text-indigo-600" />
                Nüsxə Çıxar (Backup)
              </button>

              <label className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-5 h-5 text-slate-600" />
                Nüsxədən Bərpa Et
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                İlkin Nümunə Məlumatlarını Bərpa Et (Reset)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Categories & Suppliers Management (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Categories Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              Kateqoriyaların İdarə Edilməsi ({categories.length})
            </h2>

            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Yeni kateqoriya adı..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Əlavə et
              </button>
            </form>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-medium flex items-center gap-2 border border-slate-200/70"
                >
                  <span>{cat.name}</span>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-slate-400 hover:text-rose-600"
                    title="Sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Suppliers Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Təchizatçı Şirkətlər ({suppliers.length})
            </h2>

            <form onSubmit={handleAddSupplier} className="space-y-2">
              <input
                type="text"
                required
                placeholder="Şirkət / Distribütor adı..."
                value={newSupName}
                onChange={(e) => setNewSupName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Telefon (məs: +994 12 ...)"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Qeyd / Ərazi"
                  value={newSupNotes}
                  onChange={(e) => setNewSupNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-4 h-4" />
                Təchizatçını Əlavə Et
              </button>
            </form>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {suppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">{sup.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {sup.phone || 'Telefon qeyd edilməyib'} {sup.notes && `• ${sup.notes}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSupplier(sup.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Master Products Reset & Sales Clean with Security Code */}
      <div className="p-6 bg-rose-50/70 rounded-2xl border-2 border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <span>Təhlükəli Əməliyyatlar və Baza Sıfırlama (Danger Zone)</span>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed">
          Bütün məhsulları və bazanı tam sıfırlamaq üçün 3 pilləli təsdiq tələb olunur və ən sonda <strong>kamal2014</strong> gizli kodu daxil edilməlidir. Yanlış kod daxil edildikdə heç bir məlumat silinməyəcək.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleMasterWipeWithCode}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-rose-600/20 transition"
          >
            <Trash2 className="w-4 h-4" />
            🔥 Bütün Məhsulları və Bazanı Sıfırla (Kod: kamal2014)
          </button>

          <button
            onClick={handleClearSalesHistory}
            className="px-4 py-2.5 bg-white hover:bg-rose-100/50 text-rose-800 font-semibold border border-rose-300 rounded-xl text-xs flex items-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            Yalnız Satış Tarixçəsini Təmizlə
          </button>
        </div>
      </div>
    </div>
  );
};
