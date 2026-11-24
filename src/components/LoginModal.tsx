import React, { useState } from 'react';
import type { Profile } from '../types';
import { 
  HardHat, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  UserCheck,
  Delete
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  profiles: Profile[];
  onLoginSuccess: (profile: Profile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  profiles,
  onLoginSuccess
}) => {
  if (!isOpen) return null;

  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id || '');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedProfile = profiles.find(p => p.id === selectedId) || profiles[0];

  const handleNumpadClick = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      // Auto submit jika sudah 4 digit dan PIN cocok
      if (newPin.length >= 4) {
        verifyPin(newPin, selectedProfile);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (inputPin: string, profile?: Profile) => {
    const target = profile || selectedProfile;
    if (!target) return;

    const expectedPin = target.pin || (target.role === 'sect_head' ? '8888' : '1234');
    if (inputPin === expectedPin) {
      onLoginSuccess(target);
    } else if (inputPin.length >= 4) {
      setError('PIN salah! Coba periksa kembali.');
      // Reset PIN setelah sejenak
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col animate-fadeIn">
        {/* Header Branding */}
        <div className="bg-brand-900 px-6 py-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-700/40 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-brand-950 shadow-lg shadow-amber-500/20 mb-3">
            <HardHat className="w-8 h-8 text-brand-950" />
          </div>
          <h1 className="text-xl font-black tracking-wider">OPDIS</h1>
          <p className="text-xs text-amber-300 font-semibold mt-0.5">
            Operational People Development
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">PT. PST Site MHU</p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Step 1: Pilih Pengguna */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Pilih Akun Pengguna:
              </label>
              <div className="relative">
                <select
                  value={selectedId}
                  onChange={(e) => {
                    setSelectedId(e.target.value);
                    setPin('');
                    setError('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProfile && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>{selectedProfile.department}</span>
                  <span className="font-semibold text-brand-700 uppercase">{selectedProfile.role}</span>
                </div>
              )}
            </div>

            {/* Step 2: Masukkan PIN Dots */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Masukkan PIN (4 Digit):
                </label>
                <div className="flex items-center space-x-1 text-[11px] text-amber-600 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Offline Ready</span>
                </div>
              </div>

              {/* Tampilan Titik-Titik PIN */}
              <div className="flex justify-center space-x-3 my-3">
                {[0, 1, 2, 3].map(index => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'bg-brand-700 scale-110 shadow-sm shadow-brand-700/50'
                          : 'bg-slate-200 border border-slate-300'
                      }`}
                    />
                  );
                })}
              </div>

              {error && (
                <div className="p-2 bg-red-50 text-red-700 rounded-lg text-xs flex items-center justify-center space-x-1.5 border border-red-200 my-1 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Custom On-Screen Numpad (Sangat mudah dipakai di HP saat di lapangan) */}
            <div className="grid grid-cols-3 gap-2 pt-1 select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadClick(num)}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-brand-100 border border-slate-200/80 font-bold text-base text-slate-800 transition active:scale-95 flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}
              <div className="flex items-center justify-center text-[10px] text-slate-400 font-medium">
                PST-MHU
              </div>
              <button
                type="button"
                onClick={() => handleNumpadClick('0')}
                className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-brand-100 border border-slate-200/80 font-bold text-base text-slate-800 transition active:scale-95 flex items-center justify-center shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-700 font-bold transition active:scale-95 flex items-center justify-center shadow-sm"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Hint PIN Awal */}
            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400 block">
                PIN Default Trainer & Admin: <strong className="text-slate-600">1234</strong>
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                PIN Master Sect Head: <strong className="text-slate-600">8888</strong>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
