import React, { useState } from 'react';
import type { Profile, UserRole } from '../types';
import { db } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  X, 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Check, 
  Shield, 
  HardHat, 
  UserCheck, 
  Eye,
  AlertCircle
} from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  currentProfile: Profile | null;
  onProfileUpdated: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  profiles,
  currentProfile,
  onProfileUpdated
}) => {
  if (!isOpen) return null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('1234');
  const [role, setRole] = useState<UserRole>('trainer');
  const [department, setDepartment] = useState('Operational People Development');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPin('1234');
    setRole('trainer');
    setDepartment('Operational People Development');
    setEditingId(null);
    setIsAddingNew(false);
    setError('');
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setName(p.name);
    setEmail(p.email);
    setPin(p.pin || '1234');
    setRole(p.role);
    setDepartment(p.department);
    setIsAddingNew(false);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama anggota wajib diisi!');
      return;
    }

    try {
      const targetId = editingId || crypto.randomUUID();
      const updatedProfile: Profile = {
        id: targetId,
        name: name.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@pst-mhu.com`,
        role,
        department: department.trim() || 'Operational People Development',
        pin: pin.trim() || '1234'
      };

      // 1. Simpan ke database lokal Dexie
      await db.profiles.put(updatedProfile);

      // 2. Jika Supabase terhubung, simpan ke Cloud
      if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').upsert(updatedProfile);
      }

      resetForm();
      onProfileUpdated();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data pengguna');
    }
  };

  const handleDelete = async (id: string, profileName: string) => {
    if (confirm(`Yakin ingin menghapus anggota "${profileName}"?`)) {
      await db.profiles.delete(id);
      if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').delete().eq('id', id);
      }
      onProfileUpdated();
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'sect_head':
        return { label: 'Sect Head', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield };
      case 'admin':
        return { label: 'Admin', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: UserCheck };
      case 'trainer':
        return { label: 'Trainer', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: HardHat };
      case 'observer':
        return { label: 'Observer', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Eye };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Manajemen Anggota Tim OPD
              </h2>
              <p className="text-xs text-slate-500">
                Kelola nama, jabatan/peran, dan spesialisasi tim PT. PST Site MHU
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Tombol Tambah Anggota Baru */}
          {!isAddingNew && !editingId && (
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">
                Total Anggota Terdaftar: {profiles.length} Orang
              </span>
              <button
                onClick={() => {
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Anggota Baru</span>
              </button>
            </div>
          )}

          {/* Form Tambah / Edit */}
          {(isAddingNew || editingId) && (
            <form onSubmit={handleSave} className="p-4 bg-slate-50 rounded-2xl border border-brand-200 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-800 text-sm">
                  {editingId ? 'Edit Data Anggota' : 'Form Tambah Anggota OPD Baru'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Batal
                </button>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dedi Kurniawan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
                  />
                </div>

                {/* Peran / Hak Akses (PRD Section 3) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Peran / Jabatan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
                  >
                    <option value="sect_head">Sect Head (Pimpinan)</option>
                    <option value="admin">Admin (Pengelola Task)</option>
                    <option value="trainer">Trainer (Pelaksana Lapangan)</option>
                    <option value="observer">Observer (Pemantau)</option>
                  </select>
                </div>

                {/* Departemen / Spesialisasi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Spesialisasi / Departemen
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: OPD - Trainer Hauler"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Kerja <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="nama@pst-mhu.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
                  />
                </div>

                {/* PIN Login (4-6 Digit) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PIN Login Cepat <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Contoh: 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400">PIN untuk login trainer di lapangan</span>
                </div>
              </div>

              {/* Tombol Simpan Form */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-bold transition flex items-center space-x-1 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Tambahkan'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tabel / Daftar Anggota Tim */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {profiles.map((p) => {
              const roleInfo = getRoleBadge(p.role);
              const RoleIcon = roleInfo.icon;
              const isCurrentUser = currentProfile?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition ${
                    isCurrentUser 
                      ? 'bg-brand-50/50 border-brand-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-extrabold flex items-center justify-center text-sm shadow-inner shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Anda
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${roleInfo.color}`}>
                          <RoleIcon className="w-2.5 h-2.5" />
                          <span>{roleInfo.label}</span>
                        </span>
                        <span className="text-[10px] bg-slate-100 font-mono font-bold text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          PIN: {p.pin || '1234'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.department} • <span className="text-slate-400">{p.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Tombol Aksi Edit & Hapus */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => startEdit(p)}
                      title="Edit Nama / Jabatan"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Hapus Anggota"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Perubahan otomatis tersimpan di HP/Device Anda.</span>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
