export interface Product {
  id?: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockThreshold: number;
  updatedAt?: any;
}

export interface Sale {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  totalSale: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: 'Tunai' | 'Transfer';
  date: any;
}

export interface Expense {
  id?: string;
  category: 'Listrik' | 'Gaji' | 'Sewa Toko' | 'Lainnya';
  amount: number;
  description: string;
  date: any;
}

export interface Debt {
  id?: string;
  type: 'Hutang' | 'Piutang';
  contactName: string;
  amount: number;
  dueDate?: any;
  status: 'Belum Lunas' | 'Lunas';
  notes?: string;
  createdAt: any;
}

export interface StockOpname {
  id?: string;
  productId: string;
  productName: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  date: any;
  notes?: string;
}
