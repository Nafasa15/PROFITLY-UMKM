import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { Expense } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Trash2, Wallet, Calendar, Tag, CreditCard } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
    category: 'Lainnya',
    amount: 0,
    description: '',
    date: new Date(),
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'expenses'), where('userId', '==', auth.currentUser.uid), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        setLoading(false);
      },
      (error) => {
        console.error("Expenses listen error:", error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) return;
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        userId: auth.currentUser.uid,
        date: serverTimestamp(),
      });
      setShowAddForm(false);
      setFormData({ category: 'Lainnya', amount: 0, description: '', date: new Date() });
    } catch (error) {
      console.error("Error saving expense:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan pengeluaran ini?')) {
      await deleteDoc(doc(db, 'expenses', id));
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-300 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">Biaya Operasional</h3>
          <p className="text-[10px] md:text-sm text-slate-400 font-medium">Catat semua pengeluaran toko untuk menghitung laba bersih</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-rose-500 text-white rounded-xl md:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
        >
          {showAddForm ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Pengeluaran</>}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-xl max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Tag className="w-3 h-3" /> Kategori</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold text-slate-700 text-sm"
                >
                  <option value="Listrik">Listrik & Air</option>
                  <option value="Gaji">Gaji Pegawai</option>
                  <option value="Sewa Toko">Sewa Toko</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Nominal (Rp)</label>
                <input 
                  required
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono font-bold text-rose-600 text-lg md:text-xl"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Keterangan</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-4 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-medium text-sm min-h-[80px] md:min-h-[100px]"
                placeholder="Misal: Pembayaran listrik bulan Januari..."
              />
            </div>
            <button className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95">
              Simpan Pengeluaran
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className={`p-3 md:p-4 rounded-xl md:rounded-3xl ${
                expense.category === 'Sewa Toko' ? 'bg-slate-100 text-slate-600' :
                expense.category === 'Gaji' ? 'bg-emerald-50 text-emerald-600' :
                expense.category === 'Listrik' ? 'bg-blue-50 text-blue-600' :
                'bg-purple-50 text-purple-600'
              }`}>
                <Wallet className="w-5 h-5 md:w-7 md:h-7" />
              </div>
              <button 
                onClick={() => handleDelete(expense.id!)}
                className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <div className="space-y-1 md:space-y-2">
              <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{expense.category}</p>
              <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Rp {expense.amount.toLocaleString('id-ID')}</h4>
              <p className="text-xs md:text-sm text-slate-500 font-medium line-clamp-2 min-h-[2rem] md:min-h-[2.5rem]">{expense.description || 'Tanpa keterangan'}</p>
            </div>
            <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-slate-50 flex items-center justify-between text-[9px] md:text-[10px] font-bold text-slate-400">
              <span className="uppercase tracking-widest">Tercatat pada</span>
              <span className="text-slate-500">{expense.date ? format(expense.date.toDate(), 'dd MMM yyyy', { locale: localeId }) : '-'}</span>
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
            Belum ada catatan pengeluaran
          </div>
        )}
      </div>
    </div>
  );
}
