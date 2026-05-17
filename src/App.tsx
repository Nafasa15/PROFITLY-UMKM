import { useState, useEffect } from 'react';
import { 
  auth 
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Wallet, 
  HandCoins, 
  ClipboardCheck,
  LogOut,
  ChevronRight,
  Bell,
  AlertTriangle,
  X as CloseIcon,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from './types';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import DebtManagement from './components/DebtManagement';
import StockOpname from './components/StockOpname';

type Page = 'dashboard' | 'products' | 'sales' | 'expenses' | 'debts' | 'stock';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Real-time stock monitoring for notifications
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      const lowStock = allProducts.filter(p => p.stock <= (p.minStockThreshold || 5));
      setLowStockProducts(lowStock);
    });
    return unsub;
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as const, label: 'Master Barang', icon: Package },
    { id: 'sales' as const, label: 'Penjualan', icon: ShoppingCart },
    { id: 'expenses' as const, label: 'Biaya Ops', icon: Wallet },
    { id: 'debts' as const, label: 'Hutang/Piutang', icon: HandCoins },
    { id: 'stock' as const, label: 'Stok Opname', icon: ClipboardCheck },
  ];

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans text-slate-800 bg-[#f8fafc]">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-slate-900 flex-col border-r border-slate-200 z-20 shadow-xl">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">P</div>
          <h1 className="text-white font-bold tracking-tight text-xl">PROFITLY <span className="text-emerald-400 font-medium text-lg">UMKM</span></h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <button
              id={`nav-${item.id}`}
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full p-3.5 rounded-xl flex items-center gap-3.5 transition-all duration-200 group ${
                currentPage === item.id 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span className="font-semibold tracking-wide">{item.label}</span>
              {currentPage === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div id="user-profile-card" className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-1">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-8 h-8 rounded-lg border border-slate-600" alt="Avatar" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400 truncate">Admin Toko</p>
                <p className="text-sm text-white font-bold truncate">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </p>
              </div>
            </div>
          </div>
          <button 
            id="logout-button"
            onClick={handleLogout}
            className="w-full p-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl flex items-center gap-3 transition-colors text-sm font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-4 md:px-10 flex items-center justify-between z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-lg shadow-emerald-500/20">P</div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {menuItems.find(m => m.id === currentPage)?.label}
              </h2>
              <p className="hidden md:block text-xs font-medium text-slate-400 mt-0.5">Kelola data keuangan UMKM Anda secara realtime</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            {/* Notification Bell */}
            <div className="relative group">
              <button className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all relative ${lowStockProducts.length > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                <Bell className={`w-4 h-4 md:w-5 md:h-5 ${lowStockProducts.length > 0 ? 'animate-bounce' : ''}`} />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 md:w-4 md:h-4 bg-rose-500 text-white flex items-center justify-center rounded-full text-[7px] md:text-[8px] font-black border-2 border-white translate-x-1/3 -translate-y-1/3">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>
              
              {/* Notification Tooltip/Dropdown */}
              <div className="absolute right-0 top-full mt-4 w-72 md:w-80 bg-white border border-slate-200 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-6 hidden group-hover:block transition-all z-50">
                <h4 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-rose-500" />
                  Peringatan Stok
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {lowStockProducts.length === 0 ? (
                    <p className="text-[10px] md:text-xs text-slate-400 font-medium italic py-4 text-center">Semua stok terpantau aman.</p>
                  ) : (
                    lowStockProducts.map(p => (
                      <div key={p.id} className="p-3 md:p-4 bg-rose-50/50 rounded-xl md:rounded-2xl border border-rose-100 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] md:text-xs font-bold text-rose-900">{p.name}</p>
                          <p className="text-[9px] md:text-[10px] text-rose-500 font-medium">Sisa: {p.stock} (Min: {p.minStockThreshold})</p>
                        </div>
                        <button 
                          onClick={() => setCurrentPage('products')}
                          className="px-2 md:px-3 py-1 md:py-1.5 bg-rose-500 text-white text-[8px] md:text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-rose-600 transition-colors"
                        >
                          Restok
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status Sistem</p>
              <div className="flex items-center gap-1.5 justify-end">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600">Sinkronisasi Aktif</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="md:hidden p-2.5 bg-slate-50 text-slate-400 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div id="content-area" className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 pb-24 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'products' && <Products />}
              {currentPage === 'sales' && <Sales />}
              {currentPage === 'expenses' && <Expenses />}
              {currentPage === 'debts' && <DebtManagement />}
              {currentPage === 'stock' && <StockOpname />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-30 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] rounded-t-[2rem]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 w-12 h-12 rounded-2xl transition-all duration-300 ${
                currentPage === item.id 
                ? 'text-emerald-600 scale-110' 
                : 'text-slate-400'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${currentPage === item.id ? 'bg-emerald-50 text-emerald-600 shadow-sm' : ''}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${currentPage === item.id ? 'text-emerald-600' : 'text-slate-400 opacity-80'}`}>
                {item.id === 'dashboard' ? 'Home' : item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
