import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { Debt } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Check, Clock, User, Banknote, Trash2, AlertCircle, X } from 'lucide-react';

export default function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState<Omit<Debt, 'id'>>({
    type: 'Piutang',
    contactName: '',
    amount: 0,
    status: 'Belum Lunas',
    createdAt: new Date(),
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'debts'), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt)));
        setLoading(false);
      },
      (error) => {
        console.error("Debts listen error:", error);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) return;
      await addDoc(collection(db, 'debts'), {
        ...formData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setFormData({ type: 'Piutang', contactName: '', amount: 0, status: 'Belum Lunas', createdAt: new Date() });
    } catch (error) {
      console.error("Error saving debt:", error);
    }
  };

  const toggleStatus = async (debt: Debt) => {
    try {
      await updateDoc(doc(db, 'debts', debt.id!), {
        status: debt.status === 'Lunas' ? 'Belum Lunas' : 'Lunas'
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      await deleteDoc(doc(db, 'debts', id));
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-300">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">Hutang & Piutang</h3>
          <p className="text-[10px] md:text-sm text-slate-400 font-medium">Monitoring cicilan supplier dan piutang pelanggan</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 md:gap-4">
          <div className="flex-1 bg-emerald-50 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-emerald-100">
            <p className="text-[8px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 leading-none">Piutang (Uang Masuk)</p>
            <p className="text-base md:text-xl font-black text-emerald-600 leading-none">Rp {debts.filter(d => d.type === 'Piutang' && d.status === 'Belum Lunas').reduce((acc, d) => acc + d.amount, 0).toLocaleString('id-ID')}</p>
          </div>
          <div className="flex-1 bg-rose-50 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border border-rose-100">
            <p className="text-[8px] md:text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 leading-none">Hutang (Uang Keluar)</p>
            <p className="text-base md:text-xl font-black text-rose-600 leading-none">Rp {debts.filter(d => d.type === 'Hutang' && d.status === 'Belum Lunas').reduce((acc, d) => acc + d.amount, 0).toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Batal' : 'Catat Baru'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-xl max-w-4xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis Catatan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'Piutang' })}
                    className={`py-3 md:py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-1 ${formData.type === 'Piutang' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md ring-1 ring-emerald-500' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-sm md:text-base">Piutang</span>
                    <span className="text-[7px] md:text-[8px] uppercase tracking-tighter opacity-70">Pelanggan Hutang</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'Hutang' })}
                    className={`py-3 md:py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-1 ${formData.type === 'Hutang' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md ring-1 ring-rose-500' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-sm md:text-base">Hutang</span>
                    <span className="text-[7px] md:text-[8px] uppercase tracking-tighter opacity-70">Kita Hutang</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Kontak</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm md:text-base"
                    placeholder="Nama orang/instansi"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-5 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal (Rp)</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-mono font-bold text-lg md:text-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Terkini</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-3.5 md:p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold text-sm md:text-base"
                >
                  <option value="Belum Lunas">Masih Belum Lunas</option>
                  <option value="Lunas">Selesai / Lunas</option>
                </select>
              </div>
              <button className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                Simpan Catatan
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {debts.map((debt) => (
          <div key={debt.id} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className={`h-1.5 md:h-2 ${debt.type === 'Piutang' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-5 md:mb-6">
                <div className="flex-1 mr-2">
                  <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                    {debt.type === 'Piutang' ? 'PIUTANG (PELANGGAN)' : 'HUTANG (SUPPLIER)'}
                  </p>
                  <h4 className="text-lg md:text-xl font-black text-slate-900 truncate">{debt.contactName}</h4>
                </div>
                <button 
                  onClick={() => toggleStatus(debt)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black tracking-widest transition-all shrink-0 ${
                    debt.status === 'Lunas' 
                    ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-600 border border-amber-200 animate-pulse'
                  }`}
                >
                  {debt.status.toUpperCase()}
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl md:rounded-2xl border border-slate-100">
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Jumlah Nominal</span>
                  <p className="text-xl md:text-2xl font-black text-slate-900 font-mono">Rp {debt.amount.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-400 mt-4 md:px-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="truncate">DIBUAT PADA {debt.createdAt ? format(debt.createdAt.toDate(), 'dd MMM yyyy', { locale: localeId }).toUpperCase() : '-'}</span>
                </div>
              </div>
              <div className="mt-6 md:mt-8 flex gap-2">
                <button 
                  onClick={() => handleDelete(debt.id!)}
                  className="flex-1 py-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="text-[10px] font-bold uppercase">Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {debts.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium italic bg-white rounded-3xl border border-dashed border-slate-200">
            Belum ada catatan hutang piutang
          </div>
        )}
      </div>
    </div>
  );
}
