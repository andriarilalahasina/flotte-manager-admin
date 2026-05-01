import React, { useState } from 'react';
import { Lock, Delete, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CORRECT_PIN = '5704';

export default function PinEntry({ onVerified }: { onVerified: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          onVerified();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-[#F9F7F2] z-[100] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          <div className="w-16 h-16 bg-[#2D2A26] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#2D2A26] uppercase tracking-tighter">Accès Sécurisé</h2>
          <p className="text-[#70695E] text-xs font-medium uppercase tracking-widest mt-1">Entrez votre code PIN</p>
        </motion.div>

        {/* Pin Dots */}
        <div className="flex justify-center gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? "bg-[#829379] border-[#829379] scale-110" 
                  : "bg-transparent border-[#D9D4C7]"
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-xl font-bold text-[#2D2A26] border border-[#E2DDD1] active:bg-[#F0EDE4] transition-colors shadow-sm"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-full aspect-square bg-white rounded-2xl flex items-center justify-center text-xl font-bold text-[#2D2A26] border border-[#E2DDD1] active:bg-[#F0EDE4] transition-colors shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square bg-[#F0EDE4] rounded-2xl flex items-center justify-center text-[#70695E] border border-[#E2DDD1] active:bg-[#EAE6DB] transition-colors"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
