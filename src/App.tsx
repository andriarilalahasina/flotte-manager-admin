import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Receipt,
  Bell, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { cn } from './lib/utils';

// Pages - to be created
import Dashboard from './components/Dashboard';
import Vehicles from './components/Vehicles';
import Drivers from './components/Drivers';
import Assignments from './components/Assignments';
import Payments from './components/Payments';
import Expenses from './components/Expenses';
import Login from './components/Login';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Véhicules', icon: Car, path: '/vehicles' },
  { label: 'Chauffeurs', icon: Users, path: '/drivers' },
  { label: 'Assignations', icon: CalendarCheck, path: '/assignments' },
  { label: 'Paiements', icon: DollarSign, path: '/payments' },
  { label: 'Frais Généraux', icon: Receipt, path: '/expenses' },
];

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-[#F0EDE4] text-[#4A453E] z-50 lg:translate-x-0 transition-none",
          "border-r border-[#E2DDD1]"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#829379] rounded-xl flex items-center justify-center text-white font-black text-lg">
              T
            </div>
            <h1 className="text-lg font-black tracking-tight text-[#2D2A26] uppercase">T-1000 flotte admin</h1>
          </div>
          <button onClick={onClose} className="lg:hidden text-[#70695E]">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-[#E2DDD1] text-[#2D2A26] font-medium shadow-sm" 
                    : "text-[#70695E] hover:bg-[#EAE6DB] hover:text-[#2D2A26]"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-[#829379]" : "text-[#9A9388]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-[#E2DDD1]/50 p-4 rounded-xl border border-[#D9D4C7] text-xs mb-4">
            <p className="font-semibold text-[#2D2A26] mb-1">Mode Hors-ligne</p>
            <p className="text-[#70695E]">Utilisation du stockage local</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('fleet_user');
              window.location.reload();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-[#70695E] hover:text-[#D97757] transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 lg:pl-72">
        <header className="h-16 bg-white/50 border-b border-[#E2DDD1] flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#70695E]"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h2 className="text-lg font-medium text-[#2D2A26] hidden md:block">Gestion de Flotte</h2>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

import PinEntry from './components/PinEntry';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('fleet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full"
        />
      </div>
    );
  }

  if (!isPinVerified) {
    return <PinEntry onVerified={() => setIsPinVerified(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        
        <Route 
          path="/*" 
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/vehicles" element={<Vehicles />} />
                  <Route path="/drivers" element={<Drivers />} />
                  <Route path="/assignments" element={<Assignments />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/expenses" element={<Expenses />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}
