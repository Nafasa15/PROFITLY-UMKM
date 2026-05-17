import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';
import { Sale, Expense, Product } from '../types';
import { format, startOfDay, subDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Banknote, Package, ShoppingCart, Wallet, BarChart3 } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    // Recent sales for the list
    const salesQuery = query(collection(db, 'sales'), where('userId', '==', uid), orderBy('date', 'desc'), limit(10));
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setRecentSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });

    // Stats and Chart data fetch
    const fetchFullData = async () => {
      try {
        const salesQueryAll = query(collection(db, 'sales'), where('userId', '==', uid));
        const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', uid));
        const productsQuery = query(collection(db, 'products'), where('userId', '==', uid));

        const [salesSnap, expensesSnap, productsSnap] = await Promise.all([
          getDocs(salesQueryAll),
          getDocs(expensesQuery),
          getDocs(productsQuery)
        ]);

        setAllSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
        setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullData();
    return () => unsubSales();
  }, []);

  // Stats calculations
  const totalSalesRevenue = allSales.reduce((acc, s) => acc + s.totalSale, 0); 
  const totalModal = allSales.reduce((acc, s) => acc + s.totalCost, 0);
  const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
  const labaBersih = totalSalesRevenue - totalModal - totalExp;
  const marginProfit = totalSalesRevenue > 0 ? (labaBersih / totalSalesRevenue) * 100 : 0;

  // Chart data preparation (Last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySales = allSales.filter(s => {
        const saleDate = s.date?.toDate() || new Date();
        return isSameDay(saleDate, date);
      });
      
      data.push({
        name: format(date, 'eee', { locale: id }),
        total: daySales.reduce((acc, s) => acc + s.totalSale, 0),
        profit: daySales.reduce((acc, s) => acc + s.totalProfit, 0),
      });
    }
    return data;
  }, [allSales]);

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5" /></div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Total Penjualan</p>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Rp {totalSalesRevenue.toLocaleString('id-ID')}</h3>
          <div className="flex items-center gap-1.5 mt-3 md:mt-4 text-emerald-600 font-bold text-[10px] md:text-xs">
            <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Aktif Terpantau</span>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Package className="w-4 h-4 md:w-5 md:h-5" /></div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Modal (HPP)</p>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Rp {totalModal.toLocaleString('id-ID')}</h3>
          <p className="text-[10px] md:text-xs text-slate-400 mt-3 md:mt-4 font-medium italic">HPP kumulatif</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Wallet className="w-4 h-4 md:w-5 md:h-5" /></div>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Operasional</p>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-rose-500 tracking-tight">Rp {totalExp.toLocaleString('id-ID')}</h3>
          <div className="flex items-center gap-1.5 mt-3 md:mt-4 text-slate-400 font-medium text-[10px] md:text-xs">
            <span>Listrik, Gaji, Sewa</span>
          </div>
        </div>

        <div className="bg-emerald-600 p-6 md:p-8 rounded-3xl border border-emerald-700 shadow-xl shadow-emerald-500/20">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="p-2 bg-emerald-500 text-white rounded-lg"><Banknote className="w-4 h-4 md:w-5 md:h-5" /></div>
            <p className="text-[10px] md:text-xs font-bold text-emerald-100 uppercase tracking-widest">Laba Bersih</p>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Rp {labaBersih.toLocaleString('id-ID')}</h3>
          <div className="mt-3 md:mt-4 inline-block px-3 py-1 bg-emerald-500/30 text-emerald-50 rounded-full text-[10px] font-bold border border-emerald-400/20">
            Margin: {marginProfit.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div>
            <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              Mingguan
            </h4>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium">Performa 7 hari terakhir</p>
          </div>
        </div>
        <div className="h-[200px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '10px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <div>
              <h4 className="font-bold text-slate-900 text-base md:text-lg">Penjualan Terbaru</h4>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Profit per item realtime</p>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[400px] md:max-h-[500px] custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[500px] md:min-w-full">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] md:text-[10px] tracking-widest border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 md:px-8 py-3 md:py-4 font-bold">Produk</th>
                  <th className="px-4 md:px-8 py-3 md:py-4 font-bold text-center">Qty</th>
                  <th className="px-4 md:px-8 py-3 md:py-4 font-bold">Metode</th>
                  <th className="px-6 md:px-8 py-3 md:py-4 font-bold text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">Belum ada transaksi penjualan</td></tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 md:px-8 py-4 md:py-5">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors text-xs md:text-sm">{sale.productName}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-medium">{format(sale.date?.toDate() || new Date(), 'dd MMM', { locale: id })}</p>
                      </td>
                      <td className="px-4 md:px-8 py-4 md:py-5 text-center font-bold text-slate-600 bg-slate-50/30 text-xs">{sale.quantity}</td>
                      <td className="px-4 md:px-8 py-4 md:py-5">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] md:text-[10px] font-bold tracking-wider ${
                          sale.paymentMethod === 'TRANSFER' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {sale.paymentMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-4 md:py-5 text-right font-bold font-mono text-emerald-600 text-xs md:text-sm">
                        +Rp {sale.totalProfit.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="space-y-6 md:space-y-8 pb-4">
          <div className="bg-white border border-slate-200 rounded-[1.5rem] md:rounded-3xl p-6 md:p-8 shadow-sm">
            <h4 className="text-base md:text-lg font-bold text-slate-900 mb-5 md:mb-6">Distribusi Biaya</h4>
            <div className="space-y-5 md:space-y-6">
              {[
                { label: 'Sewa Toko', key: 'Sewa Toko' },
                { label: 'Gaji Pegawai', key: 'Gaji' },
                { label: 'Listrik & Air', key: 'Listrik' },
                { label: 'Lainnya', key: 'Lainnya' }
              ].map((item, i) => {
                const amount = expenses.filter(e => e.category === item.key).reduce((acc, e) => acc + e.amount, 0);
                const percentage = totalExp > 0 ? (amount / totalExp) * 100 : 0;
                const colors = ['bg-slate-400', 'bg-emerald-400', 'bg-blue-400', 'bg-purple-400'];
                return (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase tracking-wider">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="text-slate-900 font-mono">Rp {amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="h-1.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[i % colors.length]} transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] md:rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-500 text-white rounded-lg"><TrendingDown className="w-4 h-4" /></div>
              <h4 className="text-base md:text-lg font-bold text-rose-900">Peringatan Stok</h4>
            </div>
            <div className="space-y-3">
              {products.filter(p => p.stock <= (p.minStockThreshold || 5)).slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-rose-200">
                  <span className="text-[10px] md:text-xs font-bold text-rose-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[10px] text-rose-400 font-bold uppercase">Min: {p.minStockThreshold || 5}</span>
                    <span className="text-[10px] md:text-xs font-black text-rose-500 bg-rose-100 px-2 py-0.5 rounded">{p.stock}</span>
                  </div>
                </div>
              ))}
              {products.filter(p => p.stock <= (p.minStockThreshold || 5)).length === 0 && (
                <p className="text-[10px] md:text-xs text-rose-600 font-medium p-2 text-center">Stok barang dalam posisi aman.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
