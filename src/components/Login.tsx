import { Car, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const handleLogin = () => {
    const dummyUser = {
      uid: 'user_123',
      displayName: 'Administrateur',
      email: 'admin@t1000.mg'
    };
    localStorage.setItem('fleet_user', JSON.stringify(dummyUser));
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#829379] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#D9A057] blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-[#E2DDD1] p-10 rounded-3xl shadow-xl relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#829379] rounded-2xl flex items-center justify-center mb-8 shadow-inner shadow-black/10">
            <Car className="text-white w-8 h-8" />
          </div>
          
          <h1 className="text-4xl font-bold text-[#2D2A26] tracking-tight mb-2">T-1000 Admin</h1>
          <p className="text-[#70695E] font-medium mb-12">
            Gestion de flotte simplifiée.
          </p>

          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#F0EDE4] text-[#2D2A26] py-4 px-6 rounded-xl font-bold border border-[#E2DDD1] hover:bg-[#EAE6DB] transition-all active:scale-95 shadow-sm"
          >
            <UserIcon className="w-5 h-5 text-[#829379]" />
            Accéder au tableau de bord
          </button>
          
          <p className="mt-8 text-[#9A9388] text-[10px] font-bold uppercase tracking-widest">
            Mode Utilisation Personnelle
          </p>
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 text-[#70695E] text-[10px] font-bold tracking-widest uppercase opacity-40">
        © 2026 T-1000 FLEET MANAGEMENT
      </div>
    </div>
  );
}
