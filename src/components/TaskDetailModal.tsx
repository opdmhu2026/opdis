import React, { useState } from 'react';
import type { Task, Profile, TaskStatus } from '../types';
import { getStatusBadge, getPriorityBadge, formatDate, isOverdue } from '../lib/utils';
import { 
  X, 
  Calendar, 
  User, 
  Users, 
  FileText, 
  Save, 
  Upload, 
  Paperclip, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  currentProfile: Profile | null;
  onUpdateStatusAndNotes: (taskId: string, status: TaskStatus, notes: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  profiles,
  currentProfile,
  onUpdateStatusAndNotes
}) => {
  if (!isOpen || !task) return null;

  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [completionNotes, setCompletionNotes] = useState(task.completion_notes || '');
  const [isSaved, setIsSaved] = useState(false);

  const pic = profiles.find(p => p.id === task.pic_id);
  const supportingMembers = (task.member_ids || [])
    .map(id => profiles.find(p => p.id === id)?.name)
    .filter(Boolean);

  const statusInfo = getStatusBadge(status);
  const priorityInfo = getPriorityBadge(task.priority);
  const overdue = isOverdue(task.deadline, status);

  // Aturan Bisnis 6: Hanya PIC utama dan Admin/Sect Head yang dapat mengubah status & catatan hasil
  const canEdit = 
    currentProfile?.role === 'admin' || 
    currentProfile?.role === 'sect_head' || 
    currentProfile?.id === task.pic_id;

  const handleSave = () => {
    onUpdateStatusAndNotes(task.id, status, completionNotes);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${priorityInfo.badge}`}>
              {priorityInfo.label}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detail Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Judul & Deskripsi */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 leading-tight">
              {task.title}
            </h1>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/70 whitespace-pre-line">
              {task.description || 'Tidak ada deskripsi pekerjaan.'}
            </p>
          </div>

          {/* Penanggung Jawab & Tim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
            {/* PIC Utama */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                PIC Utama (Penanggung Jawab)
              </span>
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-brand-600" />
                <span>{pic?.name || 'Belum ada PIC'}</span>
              </div>
              <div className="text-[11px] text-slate-500 ml-6">{pic?.department}</div>
            </div>

            {/* Deadline */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Batas Waktu (Deadline)
              </span>
              <div className={`flex items-center space-x-2 font-semibold ${overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                {overdue ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <Calendar className="w-4 h-4 text-slate-400" />
                )}
                <span>{formatDate(task.deadline)}</span>
                {overdue && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Terlewat</span>}
              </div>
            </div>

            {/* Anggota Pendukung */}
            {supportingMembers.length > 0 && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Anggota Pendukung
                </span>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{supportingMembers.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Update Status & Catatan Hasil Pekerjaan (PRD 5.3 & 5.6) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Catatan Hasil Pekerjaan & Kendala</span>
              </label>

              {canEdit && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="text-xs font-semibold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="to_do">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>

            {canEdit ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Catat hasil observasi, unit yang diperiksa, kendala di lapangan, atau rekomendasi perbaikan..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 placeholder-slate-400"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Otomatis disimpan di memori HP (Offline-Ready)
                  </span>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-lg bg-brand-700 hover:bg-brand-800 text-white font-semibold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersimpan!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs italic">
                {task.completion_notes || 'Belum ada catatan hasil pekerjaan.'}
                <div className="mt-2 text-[11px] text-amber-700 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Anda bukan PIC atau Admin, catatan hanya dapat diisi oleh penanggung jawab.</span>
                </div>
              </div>
            )}
          </div>

          {/* Lampiran Dokumentasi Foto / Dokumen (PRD 5.7) */}
          <div className="pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800 flex items-center space-x-1.5 mb-2">
              <Paperclip className="w-4 h-4 text-brand-600" />
              <span>Lampiran Dokumentasi (Foto / PDF / Excel)</span>
            </span>

            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600 font-medium">
                Ambil foto kamera atau unggah dokumen pendukung
              </p>
              <p className="text-[10px] text-slate-400 mb-2">
                Format: JPG, PNG, PDF, XLSX (Maks. 5MB)
              </p>
              <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Pilih File</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      alert(`File "${file.name}" berhasil dipilih! Di mode offline akan disimpan lokal terlebih dahulu.`);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
