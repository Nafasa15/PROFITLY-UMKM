import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { StockOpname as OpnameType, Product } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ClipboardCheck, Search, AlertCircle, CheckCircle2, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StockOpname() {
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<OpnameType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const qProducts = query(collection(db, 'products'), where('userId', '==', uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
    const qHistory = query(collection(db, 'stock_opnames'), where('userId', '==', uid), orderBy('date', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OpnameType)));
    });
    return () => { unsubProducts(); unsubHistory(); };
  }, []);

  const handleOpname = async (product: Product, physical: number) => {
    if (physical < 0) return;
    const difference = physical - product.stock;
    
    try {
      if (!auth.currentUser) return;
      // 1. Record adjustments
      await addDoc(collection(db, 'stock_opnames'), {
        userId: auth.currentUser.uid,
        productId: product.id,
        productName: product.name,
        systemStock: product.stock,
        physicalStock: physical,
        difference: difference,
        date: serverTimestamp(),
      });

      // 2. Update actual stock
      await updateDoc(doc(db, 'products', product.id!), {
        stock: physical,
        updatedAt: serverTimestamp()
      });

      alert(`Stok ${product.name} berhasil disesuaikan!`);
    } catch (error) {
      console.error("Opname failed:", error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 gap-4 shadow-sm">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">Stok Opname</h3>
          <p className="text-[10px] md:text-sm text-slate-400 font-medium">Sinkronisasi stok fisik dengan data sistem</p>
        </div>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
        >
          {showHistory ? <X className="w-4 h-4" /> : <History className="w-4 h-4" />}
          {showHistory ? 'Tutup Riwayat' : 'Riwayat Stok'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari barang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-white border border-slate-200 rounded-xl md:rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm md:text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
              <div className="flex justify-between items-start mb-5 md:mb-6">
                <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-3xl">
                  <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="text-right">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Stok Sistem</p>
                  <p className="text-xl md:text-2xl font-black text-slate-900 leading-none">{product.stock}</p>
                </div>
              </div>
              <div className="mb-6 md:mb-8">
                <h4 className="text-base md:text-lg font-black text-slate-800 truncate leading-tight">{product.name}</h4>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.category}</p>
              </div>
              
              <div className="space-y-4 pt-5 md:pt-6 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Fisik di Toko</label>
                  <div className="flex gap-2">
                    <input 
                      id={`physical-${product.id}`}
                      type="number"
                      placeholder="Jumlah..."
                      className="flex-1 p-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900 text-sm"
                    />
                    <button 
                      onClick={() => {
                        const val = (document.getElementById(`physical-${product.id}`) as HTMLInputElement).value;
                        if (val) handleOpname(product, Number(val));
                      }}
                      className="p-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
              Barang tidak ditemukan
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 text-white mt-6 md:mt-10 overflow-x-auto custom-scrollbar">
              <h4 className="text-lg md:text-xl font-bold mb-6 md:mb-8 flex items-center gap-3">
                <History className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                Riwayat Penyesuaian Stok
              </h4>
              <div className="space-y-3 md:space-y-4 min-w-[500px] md:min-w-0">
                {history.map(item => (
                  <div key={item.id} className="grid grid-cols-4 gap-4 p-4 md:p-5 bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-700 items-center">
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Produk</p>
                      <p className="font-bold text-xs md:text-sm truncate">{item.productName}</p>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Selisih</p>
                      <p className={`font-bold text-xs md:text-sm ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.difference > 0 ? '+' : ''}{item.difference} Qty
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Waktu</p>
                      <p className="font-bold text-[10px] md:text-xs text-slate-400">{item.date ? format(item.date.toDate(), 'dd/MM HH:mm') : '-'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] md:text-[10px] font-black text-slate-500 block uppercase tracking-widest mb-1">ID</span>
                      <p className="text-[10px] md:text-xs font-bold text-slate-300 italic truncate">OPN-{item.id?.slice(0, 5).toUpperCase()}</p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="py-10 text-center text-slate-500 font-medium italic">Belum ada riwayat penyesuaian</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
