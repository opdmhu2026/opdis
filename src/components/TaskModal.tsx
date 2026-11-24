import React, { useState } from 'react';
import type { Task, Profile, TaskPriority, TaskStatus } from '../types';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  profiles: Profile[];
  currentProfile: Profile | null;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  profiles,
  currentProfile,
  initialTask
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [picId, setPicId] = useState(initialTask?.pic_id || currentProfile?.id || profiles[0]?.id || '');
  const [memberIds, setMemberIds] = useState<string[]>(initialTask?.member_ids || []);
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || 'medium');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'to_do');
  const [deadline, setDeadline] = useState(
    initialTask?.deadline ? initialTask.deadline.split('T')[0] : ''
  );
  const [error, setError] = useState('');

  const handleMemberToggle = (id: string) => {
    if (memberIds.includes(id)) {
      setMemberIds(memberIds.filter(m => m !== id));
    } else {
      setMemberIds([...memberIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Judul pekerjaan wajib diisi!');
      return;
    }
    if (!picId) {
      setError('PIC utama wajib dipilih!');
      return;
    }

    onSave({
      id: initialTask?.id || crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      pic_id: picId,
      member_ids: memberIds,
      priority,
      status,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      created_by: initialTask?.created_by || currentProfile?.id,
      created_at: initialTask?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_synced: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialTask ? 'Edit Task Pekerjaan' : 'Tambah Task Baru (OPD)'}
            </h2>
            <p className="text-xs text-slate-500">PT. PST Site MHU - Operational People Development</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Judul Task */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Judul Pekerjaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Observasi Speed Hauler HD 785 Area Disposal"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Deskripsi Pekerjaan <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan detail aktivitas, lokasi pit, atau target pengamatan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 placeholder-slate-400 resize-none"
            />
          </div>

          {/* PIC Utama (1 Orang Sesuai PRD) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              PIC Utama <span className="text-red-500">*</span>
            </label>
            <select
              value={picId}
              onChange={(e) => setPicId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.department} ({p.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Anggota Pendukung (Multiple Selection) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Anggota Pendukung <span className="text-slate-400 font-normal">(Bisa lebih dari 1)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {profiles
                .filter(p => p.id !== picId)
                .map(p => {
                  const isSelected = memberIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleMemberToggle(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-brand-50 border-brand-300 text-brand-800' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                        {isSelected ? '✓' : '+'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Grid Prioritas & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
              >
                <option value="high">High (Mendesak)</option>
                <option value="medium">Medium (Normal)</option>
                <option value="low">Low (Bisa ditunda)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Pekerjaan
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Batas Waktu (Deadline) <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
              />
            </div>
          </div>

          {/* Tombol Simpan */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold shadow-md shadow-brand-700/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Task</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
