export interface Product {
  id: number;
  barcode: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stockQuantity: number;
  minimumStock: number;
  supplier?: string;
  imagePath?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  productBarcode?: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
  total: number;
  profit: number;
}

export interface Sale {
  id: number;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  changeAmount: number;
  debtAmount: number;
  paymentMethod: 'Nağd' | 'Kart' | 'Borc';
  customerName?: string;
  isReturned: boolean;
  items: SaleItem[];
}

export interface Purchase {
  id: number;
  productId: number;
  productName: string;
  date: string;
  quantity: number;
  purchasePrice: number;
  supplier?: string;
  notes?: string;
  total: number;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Income {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'İlkin stok' | 'Stok düzəlişi' | 'Alış' | 'Satış' | 'Qaytarma';
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  notes?: string;
}

export interface Setting {
  id: number;
  storeName: string;
  allowNegativeStock: boolean;
  currency: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  notes?: string;
}

export interface CartRow {
  product: Product;
  quantity: number;
  total: number;
}

export interface ProductMetric {
  name: string;
  quantity: number;
  amount: number;
}

export interface StockReport {
  productCount: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
}

export interface SummaryReport {
  sales: number;
  gross: number;
  expenses: number;
  net: number;
  count: number;
}

export type ActiveTab = 'Dashboard' | 'Mallar' | 'Satış' | 'Alış' | 'Maliyyə' | 'Hesabatlar' | 'Ayarlar';

