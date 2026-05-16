import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, getDoc, doc, updateDoc, increment, where } from 'firebase/firestore';
import { Sale, Product } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, ShoppingCart, Search, CreditCard, Banknote, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Selection state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const qSales = query(collection(db, 'sales'), where('userId', '==', uid), orderBy('date', 'desc'));
    const unsubSales = onSnapshot(qSales, (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    const qProducts = query(collection(db, 'products'), where('userId', '==', uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
    return () => { unsubSales(); unsubProducts(); };
  }, []);

  const handleSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (selectedProduct.stock < qty) {
      alert('Stok tidak mencukupi!');
      return;
    }

    const totalSale = selectedProduct.sellingPrice * qty;
    const totalCost = selectedProduct.costPrice * qty;
    const totalProfit = totalSale - totalCost;

    try {
      if (!auth.currentUser) return;
      // 1. Record Sale
      await addDoc(collection(db, 'sales'), {
        userId: auth.currentUser.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty,
        totalSale,
        totalCost,
        totalProfit,
        paymentMethod,
        date: serverTimestamp(),
      });

      // 2. Decrement Stock
      await updateDoc(doc(db, 'products', selectedProduct.id!), {
        stock: increment(-qty)
      });

      // Reset
      setShowAddForm(false);
      setSelectedProduct(null);
      setQty(1);
    } catch (error) {
      console.error("Sale failed:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-none mb-1">Riwayat Penjualan</h3>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">Catat transaksi baru untuk menghitung profit</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Transaksi Baru
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h4 className="text-lg md:text-xl font-bold text-slate-900">Catat Penjualan</h4>
                <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8">
                {/* Product Selector */}
                <div className="flex-1 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari produk..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] lg:max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                    {filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          selectedProduct?.id === product.id 
                          ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-xs md:text-sm text-slate-900 truncate">{product.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
                          <span className="text-xs font-bold text-emerald-600">Rp {product.sellingPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[9px] md:text-[10px] mt-1 font-medium text-slate-400">Tersedia: {product.stock}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Details */}
                <div className="w-full lg:w-80 space-y-5 md:space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-5 md:p-6 border border-slate-100 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah (Qty)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={selectedProduct?.stock || 1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setPaymentMethod('Tunai')}
                          className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Tunai' ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
                        >
                          <Banknote className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Tunai</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('Transfer')}
                          className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${paymentMethod === 'Transfer' ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
                        >
                          <CreditCard className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Transfer</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div className="bg-emerald-900 rounded-2xl p-5 md:p-6 text-white shadow-xl">
                      <div className="flex justify-between text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
                        <span>Total Transaksi</span>
                        <span>{qty} Item</span>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold">Rp {(selectedProduct.sellingPrice * qty).toLocaleString('id-ID')}</p>
                      <div className="mt-4 pt-4 border-t border-emerald-800 flex justify-between items-center">
                        <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Estimasi Profit</span>
                        <span className="text-xs md:text-sm font-bold text-emerald-200">+Rp {((selectedProduct.sellingPrice - selectedProduct.costPrice) * qty).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={!selectedProduct}
                    onClick={handleSale}
                    className="w-full py-4 md:py-5 bg-emerald-500 text-white rounded-2xl font-black text-base md:text-lg hover:bg-emerald-600 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 rounded-[1.5rem] md:rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[600px] md:min-w-full">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] md:text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 md:px-8 py-5 font-bold">Tanggal</th>
                <th className="px-4 md:px-8 py-5 font-bold">Produk</th>
                <th className="px-4 md:px-8 py-5 font-bold text-center">Qty</th>
                <th className="px-4 md:px-8 py-5 font-bold">Metode</th>
                <th className="px-4 md:px-8 py-5 font-bold text-right">Total Jual</th>
                <th className="px-6 md:px-8 py-5 font-bold text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 md:px-8 py-4 md:py-5 text-xs">
                    <p className="font-bold text-slate-900">{format(sale.date?.toDate() || new Date(), 'dd/MM/yy')}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{format(sale.date?.toDate() || new Date(), 'HH:mm')}</p>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-700 text-xs">{sale.productName}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-center font-bold text-xs">{sale.quantity}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${sale.paymentMethod === 'Transfer' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {sale.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-right font-mono font-bold text-xs">Rp {sale.totalSale.toLocaleString('id-ID')}</td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-right font-mono font-bold text-emerald-600 text-xs">+Rp {sale.totalProfit.toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={6} className="px-8 py-10 text-center text-slate-400 font-medium italic">Belum ada riwayat transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
