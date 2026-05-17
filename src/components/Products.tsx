import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { Product } from '../types';
import { Plus, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    category: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStockThreshold: 5,
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'products'), where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      },
      (error) => {
        console.error("Products error:", error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) return;
      if (isEditing) {
        await updateDoc(doc(db, 'products', isEditing), {
          ...formData,
          userId: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
        setIsEditing(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          userId: auth.currentUser.uid,
          updatedAt: serverTimestamp(),
        });
        setShowAddForm(false);
      }
      setFormData({ name: '', category: '', costPrice: 0, sellingPrice: 0, stock: 0, minStockThreshold: 5 });
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minStockThreshold: product.minStockThreshold || 5,
    });
    setIsEditing(product.id!);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 leading-none mb-1">Master Barang</h3>
          <p className="text-[10px] md:text-xs text-slate-400 font-medium">Kelola stok dan harga produk Anda</p>
        </div>
        <button 
          onClick={() => { setShowAddForm(!showAddForm); setIsEditing(null); setFormData({ name: '', category: '', costPrice: 0, sellingPrice: 0, stock: 0, minStockThreshold: 5 }); }}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'Batal' : 'Tambah Produk'}
        </button>
      </div>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-3xl border border-slate-200 shadow-xl"
        >
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            <div className="md:col-span-2 space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Produk</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm md:text-base"
                placeholder="Contoh: Kemeja Linen Blue"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</label>
              <input 
                type="text" 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm md:text-base"
                placeholder="Contoh: Atasan"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Beli (Modal)</label>
              <input 
                required
                type="number" 
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono font-bold text-sm md:text-base"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Jual</label>
              <input 
                required
                type="number" 
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono font-bold text-emerald-600 text-sm md:text-base"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Stok Awal</label>
              <input 
                required
                type="number" 
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm md:text-base"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[10px] md:text-xs font-bold text-rose-400 uppercase tracking-wider">Batas Stok Minimum</label>
              <input 
                required
                type="number" 
                value={formData.minStockThreshold}
                onChange={(e) => setFormData({ ...formData, minStockThreshold: Number(e.target.value) })}
                className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold text-rose-600 text-sm md:text-base"
              />
            </div>
            <div className="md:col-span-3 pt-4">
              <button 
                type="submit"
                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-[1.5rem] md:rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[700px] md:min-w-full">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] md:text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 md:px-8 py-5 font-bold">Produk</th>
                <th className="px-4 md:px-8 py-5 font-bold">Kategori</th>
                <th className="px-4 md:px-8 py-5 font-bold">Modal</th>
                <th className="px-4 md:px-8 py-5 font-bold">Jual</th>
                <th className="px-4 md:px-8 py-5 font-bold text-center">Stok</th>
                <th className="px-6 md:px-8 py-5 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 md:px-8 py-4 md:py-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs md:text-sm">{product.name}</span>
                      {product.stock <= product.minStockThreshold && (
                        <div className="group/tip relative">
                          <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 fill-rose-50" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block bg-rose-900 text-white text-[9px] md:text-[10px] py-1 px-2 rounded whitespace-nowrap z-50 shadow-xl">
                            Stok Menipis (Batas: {product.minStockThreshold})
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-slate-500 text-xs">{product.category}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 font-mono text-slate-600 text-xs">Rp {product.costPrice.toLocaleString('id-ID')}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 font-mono font-bold text-emerald-600 text-xs md:text-sm">Rp {product.sellingPrice.toLocaleString('id-ID')}</td>
                  <td className="px-4 md:px-8 py-4 md:py-5 text-center">
                    <span className={`inline-block min-w-[36px] md:min-w-[40px] px-2 py-1 rounded-lg font-bold text-[10px] md:text-xs ${
                      product.stock <= product.minStockThreshold ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                    <div className="flex justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(product)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all">
                        <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id!)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
