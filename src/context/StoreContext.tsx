import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  Sale,
  SaleItem,
  Purchase,
  Expense,
  Income,
  StockMovement,
  Setting,
  Category,
  Supplier,
  SummaryReport,
  StockReport,
  ProductMetric,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_SETTING,
} from '../data/seedData';

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  incomes: Income[];
  movements: StockMovement[];
  categories: Category[];
  suppliers: Supplier[];
  setting: Setting;
  
  // Product Operations
  findProducts: (query?: string) => Product[];
  byBarcode: (barcode: string) => Product | undefined;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }) => Product;
  deleteProduct: (id: number) => void;
  adjustStock: (id: number, change: number, note: string) => void;
  
  // Sales & POS Operations
  completeSale: (params: {
    items: { productId: number; quantity: number }[];
    discount: number;
    paidAmount: number;
    paymentMethod: 'Nağd' | 'Kart' | 'Borc';
    partialPaymentMethod?: 'Nağd' | 'Kart';
    customerName?: string;
    notes?: string;
  }) => Sale;
  returnSale: (saleId: number) => void;
  deleteSale: (saleId: number, restoreStock?: boolean) => void;
  clearAllSales: (restoreStock?: boolean) => void;
  wipeAllProducts: () => void;
  payDebt: (saleId: number, amount: number, paymentMethod?: 'Nağd' | 'Kart', notes?: string) => void;
  
  // Purchase Operations
  completePurchase: (params: {
    productId: number;
    quantity: number;
    purchasePrice: number;
    supplier?: string;
    notes?: string;
  }) => Purchase;
  
  // Expenses & Income
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: number) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  deleteIncome: (id: number) => void;
  
  // Categories & Suppliers
  addCategory: (name: string) => void;
  deleteCategory: (id: number) => void;
  addSupplier: (name: string, phone?: string, notes?: string) => void;
  deleteSupplier: (id: number) => void;
  
  // Settings & DB Maintenance
  updateSetting: (newSetting: Partial<Setting>) => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
  resetDatabase: () => void;
  
  // Reports
  getSummary: (from: Date, to: Date) => SummaryReport;
  getPurchasesTotal: (from: Date, to: Date) => number;
  getCostOfGoods: (from: Date, to: Date) => number;
  getProductsSold: (from: Date, to: Date) => number;
  getBestSelling: (from: Date, to: Date) => ProductMetric[];
  getMostProfitable: (from: Date, to: Date) => ProductMetric[];
  getStockReport: () => StockReport;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  PRODUCTS: 'calvotti_products_v1',
  SALES: 'calvotti_sales_v1',
  PURCHASES: 'calvotti_purchases_v1',
  EXPENSES: 'calvotti_expenses_v1',
  INCOMES: 'calvotti_incomes_v1',
  MOVEMENTS: 'calvotti_movements_v1',
  CATEGORIES: 'calvotti_categories_v1',
  SUPPLIERS: 'calvotti_suppliers_v1',
  SETTING: 'calvotti_setting_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!saved) return INITIAL_PRODUCTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (!saved) return INITIAL_SALES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!saved) return INITIAL_EXPENSES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (!saved) return INITIAL_STOCK_MOVEMENTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_STOCK_MOVEMENTS;
    } catch {
      return INITIAL_STOCK_MOVEMENTS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!saved) return INITIAL_CATEGORIES;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_CATEGORIES;
      return parsed.map((item, idx) => {
        if (typeof item === 'string') {
          return { id: idx + 1, name: item };
        }
        if (item && typeof item === 'object') {
          return { id: Number(item.id) || idx + 1, name: String(item.name || '') };
        }
        return { id: idx + 1, name: String(item || '') };
      }).filter((c) => c.name.trim() !== '');
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      if (!saved) return INITIAL_SUPPLIERS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_SUPPLIERS;
      return parsed.map((item, idx) => {
        if (typeof item === 'string') {
          return { id: idx + 1, name: item };
        }
        if (item && typeof item === 'object') {
          return {
            id: Number(item.id) || idx + 1,
            name: String(item.name || ''),
            phone: item.phone ? String(item.phone) : undefined,
            notes: item.notes ? String(item.notes) : undefined,
          };
        }
        return { id: idx + 1, name: String(item || '') };
      }).filter((s) => s.name.trim() !== '');
    } catch {
      return INITIAL_SUPPLIERS;
    }
  });

  const [setting, setSetting] = useState<Setting>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTING);
      if (!saved) return INITIAL_SETTING;
      const parsed = JSON.parse(saved);
      return {
        id: parsed?.id || 1,
        storeName: parsed?.storeName || INITIAL_SETTING.storeName,
        currency: parsed?.currency || INITIAL_SETTING.currency,
        allowNegativeStock: Boolean(parsed?.allowNegativeStock),
      };
    } catch {
      return INITIAL_SETTING;
    }
  });

  // Sync to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements)); }, [movements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTING, JSON.stringify(setting)); }, [setting]);

  // Product Operations
  const findProducts = (query = ''): Product[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [...products].sort((a, b) => a.name.localeCompare(b.name));
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.supplier && p.supplier.toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const byBarcode = (barcode: string): Product | undefined => {
    if (!barcode.trim()) return undefined;
    return products.find((p) => p.barcode?.trim() === barcode.trim());
  };

  const saveProduct = (form: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }): Product => {
    if (!form.name.trim()) throw new Error('Məhsul adı boş ola bilməz.');
    if (form.salePrice < 0 || form.purchasePrice < 0 || form.stockQuantity < 0) {
      throw new Error('Qiymət və stok mənfi ola bilməz.');
    }
    if (form.barcode && form.barcode.trim()) {
      const existing = products.find((p) => p.barcode === form.barcode.trim() && p.id !== form.id);
      if (existing) throw new Error('Bu barkod artıq başqa bir məhsula aiddir.');
    }

    const nowIso = new Date().toISOString();

    if (!form.id || form.id === 0) {
      const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
      const newProd: Product = {
        ...form,
        id: nextId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setProducts((prev) => [newProd, ...prev]);

      // Stock movement for initial stock
      const movement: StockMovement = {
        id: Date.now(),
        productId: nextId,
        productName: newProd.name,
        type: 'İlkin stok',
        quantity: newProd.stockQuantity,
        previousStock: 0,
        newStock: newProd.stockQuantity,
        date: nowIso,
        notes: 'Yeni məhsul əlavə edildi',
      };
      setMovements((prev) => [movement, ...prev]);

      return newProd;
    } else {
      const oldProd = products.find((p) => p.id === form.id);
      const updated: Product = {
        ...form,
        id: form.id,
        createdAt: oldProd?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      setProducts((prev) => prev.map((p) => (p.id === form.id ? updated : p)));
      return updated;
    }
  };

  const deleteProduct = (id: number) => {
    const p = products.find((x) => x.id === id);
    if (!p) throw new Error('Məhsul tapılmadı.');

    const hasSales = sales.some((s) => s.items.some((i) => i.productId === id));
    const hasPurchases = purchases.some((pr) => pr.productId === id);

    if (hasSales || hasPurchases) {
      throw new Error('Tarixçəsi olan məhsul silinə bilməz; onu stokda 0 edin.');
    }

    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const adjustStock = (id: number, change: number, note: string) => {
    if (change === 0) throw new Error('Düzəliş miqdarı 0 ola bilməz.');
    const p = products.find((x) => x.id === id);
    if (!p) throw new Error('Məhsul tapılmadı.');

    const newStock = p.stockQuantity + change;
    if (newStock < 0 && !setting.allowNegativeStock) {
      throw new Error('Stok mənfi ola bilməz.');
    }

    const nowIso = new Date().toISOString();
    const movement: StockMovement = {
      id: Date.now(),
      productId: id,
      productName: p.name,
      type: 'Stok düzəlişi',
      quantity: change,
      previousStock: p.stockQuantity,
      newStock: newStock,
      date: nowIso,
      notes: note || 'Əl ilə düzəliş',
    };

    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stockQuantity: newStock, updatedAt: nowIso } : item))
    );
    setMovements((prev) => [movement, ...prev]);
  };

  // Complete Sale
  const completeSale = ({
    items,
    discount,
    paidAmount,
    paymentMethod,
    partialPaymentMethod,
    customerName,
    notes,
  }: {
    items: { productId: number; quantity: number }[];
    discount: number;
    paidAmount: number;
    paymentMethod: 'Nağd' | 'Kart' | 'Borc';
    partialPaymentMethod?: 'Nağd' | 'Kart';
    customerName?: string;
    notes?: string;
  }): Sale => {
    if (!items.length) throw new Error('Səbət boşdur.');

    // Validate stock
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) throw new Error('Məhsul tapılmadı.');
      if (item.quantity <= 0) throw new Error('Məhsul miqdarı 0-dan çox olmalıdır.');
      if (prod.stockQuantity < item.quantity && !setting.allowNegativeStock) {
        throw new Error(`${prod.name} üçün yetərli stok yoxdur (Mövcud: ${prod.stockQuantity}).`);
      }
    }

    const saleId = sales.length > 0 ? Math.max(...sales.map((s) => s.id)) + 1 : 101;
    const nowIso = new Date().toISOString();

    const saleItems: SaleItem[] = items.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const total = Number((prod.salePrice * item.quantity).toFixed(2));
      const profit = Number(((prod.salePrice - prod.purchasePrice) * item.quantity).toFixed(2));
      return {
        id: Date.now() + idx,
        saleId,
        productId: prod.id,
        productName: prod.name,
        productBarcode: prod.barcode,
        quantity: item.quantity,
        salePrice: prod.salePrice,
        costPrice: prod.purchasePrice,
        total,
        profit,
      };
    });

    const subtotal = Number(saleItems.reduce((acc, i) => acc + i.total, 0).toFixed(2));
    const total = Math.max(0, Number((subtotal - discount).toFixed(2)));

    if (discount > subtotal) {
      throw new Error('Endirim ümumi məbləğdən çox ola bilməz.');
    }

    if (paymentMethod !== 'Borc' && paidAmount < total) {
      throw new Error('Nağd və kart satışında tam ödəniş tələb olunur.');
    }

    if (paymentMethod === 'Borc' && !customerName?.trim()) {
      throw new Error('Borc satışı üçün müştəri adı (borc götürən) daxil edilməlidir.');
    }

    const changeAmount = paymentMethod === 'Borc' ? 0 : Math.max(0, Number((paidAmount - total).toFixed(2)));
    const debtAmount = paymentMethod === 'Borc' ? Math.max(0, Number((total - paidAmount).toFixed(2))) : 0;

    const newSale: Sale = {
      id: saleId,
      date: nowIso,
      subtotal,
      discount,
      total,
      paidAmount,
      changeAmount,
      debtAmount,
      paymentMethod,
      partialPaymentMethod: paymentMethod === 'Borc' ? (partialPaymentMethod || 'Nağd') : undefined,
      customerName: customerName?.trim() || undefined,
      notes: notes?.trim() || undefined,
      isReturned: false,
      items: saleItems,
    };

    // Deduct stock and record movements
    const newMovements: StockMovement[] = [];
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = items.find((i) => i.productId === p.id);
        if (cartItem) {
          const newStock = p.stockQuantity - cartItem.quantity;
          newMovements.push({
            id: Date.now() + Math.random(),
            productId: p.id,
            productName: p.name,
            type: 'Satış',
            quantity: -cartItem.quantity,
            previousStock: p.stockQuantity,
            newStock,
            date: nowIso,
            notes: `Satış #${saleId}${customerName ? ` (${customerName})` : ''}`,
          });
          return { ...p, stockQuantity: newStock, updatedAt: nowIso };
        }
        return p;
      })
    );

    setMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);

    // Record Income if money received (either full total or partial payment on debt)
    const incomeAmount = paymentMethod === 'Borc' ? paidAmount : total;
    if (incomeAmount > 0) {
      const payMethodLabel = paymentMethod === 'Borc' 
        ? `Borc Satışı - İlkin Ödəniş (${partialPaymentMethod || 'Nağd'})` 
        : paymentMethod;
      const income: Income = {
        id: Date.now(),
        category: 'Satış',
        description: `Satış #${saleId} (${payMethodLabel})`,
        amount: incomeAmount,
        date: nowIso,
        notes: customerName ? `Müştəri: ${customerName} (Borc Qalığı: ${debtAmount.toFixed(2)} ${setting.currency})${notes ? ` - ${notes}` : ''}` : notes,
      };
      setIncomes((prev) => [income, ...prev]);
    }

    return newSale;
  };

  const payDebt = (saleId: number, amount: number, paymentMethod?: 'Nağd' | 'Kart', notes?: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Satış çeki tapılmadı.');
    if (sale.isReturned) throw new Error('Qaytarılmış satış üçün borc ödənilə bilməz.');
    if (sale.debtAmount <= 0) throw new Error('Bu satışın heç bir borc qalığı yoxdur.');
    if (amount <= 0) throw new Error('Ödəniş məbləği 0-dan böyük olmalıdır.');
    if (amount > sale.debtAmount) throw new Error(`Ödəniş məbləği qalıq borcdan (${sale.debtAmount} ₼) çox ola bilməz.`);

    const nowIso = new Date().toISOString();
    const newDebtAmount = Math.max(0, Number((sale.debtAmount - amount).toFixed(2)));
    const newPaidAmount = Number((sale.paidAmount + amount).toFixed(2));

    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              debtAmount: newDebtAmount,
              paidAmount: newPaidAmount,
            }
          : s
      )
    );

    const payType = paymentMethod || 'Nağd';
    const income: Income = {
      id: Date.now(),
      category: 'Borc Ödənişi',
      description: `Borc ödənişi (Çek #${saleId}, ${payType}) - ${sale.customerName || 'Müştəri'}`,
      amount,
      date: nowIso,
      notes: notes || `Müştəri: ${sale.customerName || 'Məlum deyil'} (Ödənilən: ${amount.toFixed(2)} ₼, Qalıq Borc: ${newDebtAmount.toFixed(2)} ₼)`,
    };
    setIncomes((prev) => [income, ...prev]);
  };

  const returnSale = (saleId: number) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Satış tapılmadı.');
    if (sale.isReturned) throw new Error('Bu satış artıq qaytarılıb.');

    const nowIso = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    setProducts((prev) =>
      prev.map((p) => {
        const item = sale.items.find((i) => i.productId === p.id);
        if (item) {
          const newStock = p.stockQuantity + item.quantity;
          newMovements.push({
            id: Date.now() + Math.random(),
            productId: p.id,
            productName: p.name,
            type: 'Qaytarma',
            quantity: item.quantity,
            previousStock: p.stockQuantity,
            newStock,
            date: nowIso,
            notes: `Satış #${saleId} qaytarıldı`,
          });
          return { ...p, stockQuantity: newStock, updatedAt: nowIso };
        }
        return p;
      })
    );

    setMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, isReturned: true } : s)));

    // Record negative income / refund
    const refundIncome: Income = {
      id: Date.now(),
      category: 'Qaytarma',
      description: `Satış #${saleId} qaytarma`,
      amount: -sale.total,
      date: nowIso,
    };
    setIncomes((prev) => [refundIncome, ...prev]);
  };

  const deleteSale = (saleId: number, restoreStock: boolean = true) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return;

    if (restoreStock && !sale.isReturned) {
      const nowIso = new Date().toISOString();
      const newMovements: StockMovement[] = [];

      setProducts((prev) =>
        prev.map((p) => {
          const item = sale.items.find((i) => i.productId === p.id);
          if (item) {
            const newStock = p.stockQuantity + item.quantity;
            newMovements.push({
              id: Date.now() + Math.random(),
              productId: p.id,
              productName: p.name,
              type: 'Satış ləğvi',
              quantity: item.quantity,
              previousStock: p.stockQuantity,
              newStock,
              date: nowIso,
              notes: `Satış #${saleId} silindi, stok bərpa edildi`,
            });
            return { ...p, stockQuantity: newStock, updatedAt: nowIso };
          }
          return p;
        })
      );

      setMovements((prev) => [...newMovements, ...prev]);
    }

    setSales((prev) => prev.filter((s) => s.id !== saleId));
    setIncomes((prev) => prev.filter((i) => !i.description.includes(`Satış #${saleId}`)));
  };

  const clearAllSales = (restoreStock: boolean = false) => {
    if (restoreStock) {
      const nowIso = new Date().toISOString();
      const newMovements: StockMovement[] = [];

      setProducts((prev) =>
        prev.map((p) => {
          let extraQty = 0;
          for (const s of sales) {
            if (!s.isReturned) {
              const it = s.items.find((i) => i.productId === p.id);
              if (it) extraQty += it.quantity;
            }
          }
          if (extraQty > 0) {
            const newStock = p.stockQuantity + extraQty;
            newMovements.push({
              id: Date.now() + Math.random(),
              productId: p.id,
              productName: p.name,
              type: 'Satış ləğvi',
              quantity: extraQty,
              previousStock: p.stockQuantity,
              newStock,
              date: nowIso,
              notes: `Bütün satışlar təmizləndi, stok bərpa edildi`,
            });
            return { ...p, stockQuantity: newStock, updatedAt: nowIso };
          }
          return p;
        })
      );
      setMovements((prev) => [...newMovements, ...prev]);
    }

    setSales([]);
    setIncomes((prev) => prev.filter((i) => i.category !== 'Satış' && i.category !== 'Qaytarma'));
  };

  const wipeAllProducts = () => {
    localStorage.clear();
    setProducts([]);
    setSales([]);
    setPurchases([]);
    setExpenses([]);
    setIncomes([]);
    setMovements([]);
    setCategories([]);
    setSuppliers([]);
  };

  // Purchases
  const completePurchase = ({
    productId,
    quantity,
    purchasePrice,
    supplier,
    notes,
  }: {
    productId: number;
    quantity: number;
    purchasePrice: number;
    supplier?: string;
    notes?: string;
  }): Purchase => {
    if (quantity <= 0 || purchasePrice < 0) {
      throw new Error('Miqdar və qiymət düzgün daxil edilməlidir.');
    }
    const p = products.find((x) => x.id === productId);
    if (!p) throw new Error('Məhsul tapılmadı.');

    const nowIso = new Date().toISOString();
    const purchaseId = purchases.length > 0 ? Math.max(...purchases.map((pr) => pr.id)) + 1 : 1;
    const total = Number((quantity * purchasePrice).toFixed(2));

    const newPurchase: Purchase = {
      id: purchaseId,
      productId,
      productName: p.name,
      date: nowIso,
      quantity,
      purchasePrice,
      supplier: supplier || p.supplier,
      notes,
      total,
    };

    const newStock = p.stockQuantity + quantity;
    const movement: StockMovement = {
      id: Date.now(),
      productId,
      productName: p.name,
      type: 'Alış',
      quantity,
      previousStock: p.stockQuantity,
      newStock,
      date: nowIso,
      notes: notes || `Alış #${purchaseId}${supplier ? ` (${supplier})` : ''}`,
    };

    setProducts((prev) =>
      prev.map((item) =>
        item.id === productId
          ? {
              ...item,
              stockQuantity: newStock,
              purchasePrice: purchasePrice > 0 ? purchasePrice : item.purchasePrice,
              supplier: supplier || item.supplier,
              updatedAt: nowIso,
            }
          : item
      )
    );

    setMovements((prev) => [movement, ...prev]);
    setPurchases((prev) => [newPurchase, ...prev]);

    return newPurchase;
  };

  // Expenses & Income
  const addExpense = (exp: Omit<Expense, 'id'>) => {
    if (exp.amount <= 0 || !exp.description.trim()) {
      throw new Error('Xərc adı və məbləği daxil edilməlidir.');
    }
    const id = expenses.length > 0 ? Math.max(...expenses.map((e) => e.id)) + 1 : 1;
    setExpenses((prev) => [{ ...exp, id }, ...prev]);
  };

  const deleteExpense = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const addIncome = (inc: Omit<Income, 'id'>) => {
    if (inc.amount <= 0 || !inc.description.trim()) {
      throw new Error('Gəlir adı və məbləği daxil edilməlidir.');
    }
    const id = incomes.length > 0 ? Math.max(...incomes.map((i) => i.id)) + 1 : 1;
    setIncomes((prev) => [{ ...inc, id }, ...prev]);
  };

  const deleteIncome = (id: number) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  // Categories & Suppliers
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Kateqoriya adı boş ola bilməz.');
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Bu kateqoriya artıq mövcuddur.');
    }
    const id = categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    setCategories((prev) => [...prev, { id, name: trimmed }]);
  };

  const deleteCategory = (id: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const addSupplier = (name: string, phone?: string, notes?: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Təchizatçı adı boş ola bilməz.');
    if (suppliers.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Bu təchizatçı artıq mövcuddur.');
    }
    const id = suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.id)) + 1 : 1;
    setSuppliers((prev) => [...prev, { id, name: trimmed, phone, notes }]);
  };

  const deleteSupplier = (id: number) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSetting = (newSetting: Partial<Setting>) => {
    setSetting((prev) => ({ ...prev, ...newSetting }));
  };

  // Export / Import
  const exportDatabaseJson = (): string => {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      setting,
      categories,
      suppliers,
      products,
      sales,
      purchases,
      expenses,
      incomes,
      movements,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
        if (data.sales) setSales(data.sales);
        if (data.purchases) setPurchases(data.purchases);
        if (data.expenses) setExpenses(data.expenses);
        if (data.incomes) setIncomes(data.incomes);
        if (data.movements) setMovements(data.movements);
        if (data.categories) setCategories(data.categories);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.setting) setSetting(data.setting);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetDatabase = () => {
    localStorage.clear();
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setPurchases([]);
    setExpenses(INITIAL_EXPENSES);
    setIncomes([]);
    setMovements(INITIAL_STOCK_MOVEMENTS);
    setCategories(INITIAL_CATEGORIES);
    setSuppliers(INITIAL_SUPPLIERS);
    setSetting(INITIAL_SETTING);
  };

  // Reporting calculations
  const getSummary = (from: Date, to: Date): SummaryReport => {
    const fromTime = from.getTime();
    const toTime = to.getTime();

    const periodSales = sales.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= fromTime && t <= toTime && !s.isReturned;
    });

    const salesTotal = periodSales.reduce((acc, s) => acc + s.total, 0);
    const grossProfit = periodSales.reduce((acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.profit, 0), 0);

    const periodExpenses = expenses.filter((e) => {
      const t = new Date(e.date).getTime();
      return t >= fromTime && t <= toTime;
    });
    const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

    return {
      sales: Number(salesTotal.toFixed(2)),
      gross: Number(grossProfit.toFixed(2)),
      expenses: Number(totalExpenses.toFixed(2)),
      net: Number((grossProfit - totalExpenses).toFixed(2)),
      count: periodSales.length,
    };
  };

  const getPurchasesTotal = (from: Date, to: Date): number => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return purchases
      .filter((p) => {
        const t = new Date(p.date).getTime();
        return t >= fromTime && t <= toTime;
      })
      .reduce((acc, p) => acc + p.total, 0);
  };

  const getCostOfGoods = (from: Date, to: Date): number => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return sales
      .filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= fromTime && t <= toTime && !s.isReturned;
      })
      .reduce((acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.costPrice * item.quantity, 0), 0);
  };

  const getProductsSold = (from: Date, to: Date): number => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return sales
      .filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= fromTime && t <= toTime && !s.isReturned;
      })
      .reduce((acc, s) => acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0), 0);
  };

  const getBestSelling = (from: Date, to: Date): ProductMetric[] => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const map = new Map<string, { quantity: number; amount: number }>();

    sales
      .filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= fromTime && t <= toTime && !s.isReturned;
      })
      .forEach((s) => {
        s.items.forEach((item) => {
          const current = map.get(item.productName) || { quantity: 0, amount: 0 };
          map.set(item.productName, {
            quantity: current.quantity + item.quantity,
            amount: current.amount + item.total,
          });
        });
      });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        amount: Number(data.amount.toFixed(2)),
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  };

  const getMostProfitable = (from: Date, to: Date): ProductMetric[] => {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const map = new Map<string, { quantity: number; amount: number }>();

    sales
      .filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= fromTime && t <= toTime && !s.isReturned;
      })
      .forEach((s) => {
        s.items.forEach((item) => {
          const current = map.get(item.productName) || { quantity: 0, amount: 0 };
          map.set(item.productName, {
            quantity: current.quantity + item.quantity,
            amount: current.amount + item.profit,
          });
        });
      });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        amount: Number(data.amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  };

  const getStockReport = (): StockReport => {
    return {
      productCount: products.length,
      totalQuantity: products.reduce((acc, p) => acc + p.stockQuantity, 0),
      lowStock: products.filter((p) => p.stockQuantity <= p.minimumStock && p.stockQuantity > 0).length,
      outOfStock: products.filter((p) => p.stockQuantity <= 0).length,
    };
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        sales,
        purchases,
        expenses,
        incomes,
        movements,
        categories,
        suppliers,
        setting,
        findProducts,
        byBarcode,
        saveProduct,
        deleteProduct,
        adjustStock,
        completeSale,
        returnSale,
        deleteSale,
        clearAllSales,
        wipeAllProducts,
        payDebt,
        completePurchase,
        addExpense,
        deleteExpense,
        addIncome,
        deleteIncome,
        addCategory,
        deleteCategory,
        addSupplier,
        deleteSupplier,
        updateSetting,
        exportDatabaseJson,
        importDatabaseJson,
        resetDatabase,
        getSummary,
        getPurchasesTotal,
        getCostOfGoods,
        getProductsSold,
        getBestSelling,
        getMostProfitable,
        getStockReport,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};
