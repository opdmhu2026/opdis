import React, { useEffect, useState } from 'react';
import { syncManager } from '../lib/syncManager';
import { isSupabaseConfigured } from '../lib/supabase';
import { Wifi, WifiOff, RefreshCw, HardHat, UserCheck, Users, LogOut, Shield } from 'lucide-react';
import type { Profile } from '../types';

interface NavbarProps {
  currentProfile: Profile | null;
  profiles: Profile[];
  onOpenTeamModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProfile,
  profiles,
  onOpenTeamModal,
  onLogout
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((online, count) => {
      setIsOnline(online);
      setUnsyncedCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncManager.syncNow();
    setIsSyncing(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-brand-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Site Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-brand-900 shadow-inner font-black text-lg">
            <HardHat className="w-6 h-6 text-brand-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider">OPDIS</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                PWA Site MHU
              </span>
            </div>
            <p className="text-xs text-slate-300">Operational People Development • PT. PST</p>
          </div>
        </div>

        {/* Sync Status & Active Profile Selector */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status Offline/Online Pill */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            title={isOnline ? 'Klik untuk sinkronisasi' : 'Aplikasi berjalan dalam mode offline'}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isOnline
                ? unsyncedCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>
              {isOnline
                ? unsyncedCount > 0
                  ? `${unsyncedCount} Perlu Sync`
                  : isSupabaseConfigured
                  ? 'Online Cloud'
                  : 'Lokal PWA'
                : 'Mode Offline'}
            </span>
            <RefreshCw
              className={`w-3 h-3 ml-1 text-slate-300 ${isSyncing ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Informasi Pengguna Terverifikasi (PIN-Authenticated RBAC) */}
          {currentProfile && (
            <div className="flex items-center space-x-2 bg-brand-900/90 pl-2.5 pr-2 py-1.5 rounded-xl border border-brand-700/80">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-brand-950 font-black text-xs flex items-center justify-center shrink-0">
                {currentProfile.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold leading-tight truncate max-w-[120px]">
                  {currentProfile.name}
                </span>
                <span className="text-[10px] text-amber-300 uppercase font-semibold">
                  {currentProfile.role.replace('_', ' ')}
                </span>
              </div>

              {/* Tombol Logout / Ganti Akun */}
              <button
                onClick={onLogout}
                title="Keluar / Ganti Akun (PIN)"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-brand-800 transition ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tombol Bagian Admin / Kelola Tim OPD (Hanya muncul untuk Admin & Sect Head!) */}
          {(currentProfile?.role === 'admin' || currentProfile?.role === 'sect_head') && (
            <button
              onClick={onOpenTeamModal}
              title="Kelola & Ganti Nama Anggota Tim OPD"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-brand-950 font-bold text-xs transition shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Kelola Tim</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
