import React from 'react';
import type { Task, Profile, TaskStatus } from '../types';
import { getStatusBadge, getPriorityBadge, formatDate, isOverdue } from '../lib/utils';
import { 
  Calendar, 
  User, 
  Users, 
  FileText, 
  AlertTriangle, 
  CloudOff, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  profiles: Profile[];
  currentProfile: Profile | null;
  onOpenDetail: (task: Task) => void;
  onQuickStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  profiles,
  currentProfile,
  onOpenDetail,
  onQuickStatusChange
}) => {
  const statusInfo = getStatusBadge(task.status);
  const priorityInfo = getPriorityBadge(task.priority);
  const overdue = isOverdue(task.deadline, task.status);

  const pic = profiles.find(p => p.id === task.pic_id);
  const supportingMembers = (task.member_ids || [])
    .map(id => profiles.find(p => p.id === id)?.name)
    .filter(Boolean);

  // Aturan Bisnis 6: Hanya PIC utama dan Admin/Sect Head yang dapat mengubah status
  const canUpdateStatus = 
    currentProfile?.role === 'admin' || 
    currentProfile?.role === 'sect_head' || 
    currentProfile?.id === task.pic_id;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-4 sm:p-5 flex flex-col justify-between relative group">
      <div>
        {/* Baris Atas: Badge Prioritas, Status, & Offline Indicator */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            {/* Prioritas */}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.badge}`}>
              {priorityInfo.label}
            </span>

            {/* Status Saat Ini */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>

            {/* Indikator Offline Sync */}
            {!task.is_synced && (
              <span className="flex items-center space-x-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
                <CloudOff className="w-2.5 h-2.5 text-amber-600" />
                <span>Belum Sync</span>
              </span>
            )}
          </div>

          {/* Tombol Buka Detail */}
          <button
            onClick={() => onOpenDetail(task)}
            className="text-slate-400 hover:text-brand-600 transition p-1"
            title="Lihat Detail Task"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Judul Task */}
        <h3 
          onClick={() => onOpenDetail(task)}
          className="font-bold text-slate-900 text-sm sm:text-base leading-snug cursor-pointer hover:text-brand-700 transition mb-2"
        >
          {task.title}
        </h3>

        {/* Deskripsi Singkat */}
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Catatan Hasil Pekerjaan (Jika ada) */}
        {task.completion_notes && (
          <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 flex items-start space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="line-clamp-1 italic">
              Hasil: {task.completion_notes}
            </span>
          </div>
        )}
      </div>

      {/* Bagian Bawah: PIC, Tim, Deadline & Quick Action */}
      <div className="border-t border-slate-100 pt-3 mt-1 flex flex-col gap-2.5">
        {/* Info PIC & Member */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-1">
          {/* PIC Utama */}
          <div className="flex items-center space-x-1.5 font-medium">
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-[10px]">
              {pic?.name.charAt(0) || 'P'}
            </div>
            <span>
              PIC: <strong className="text-slate-800">{pic?.name || 'Belum ditentukan'}</strong>
            </span>
          </div>

          {/* Deadline */}
          <div className={`flex items-center space-x-1 font-medium ${overdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            {overdue ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{formatDate(task.deadline)}</span>
          </div>
        </div>

        {/* Anggota Pendukung */}
        {supportingMembers.length > 0 && (
          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="truncate">Tim: {supportingMembers.join(', ')}</span>
          </div>
        )}

        {/* Quick Status Control (Sesuai Hak Akses Aturan Bisnis 6) */}
        <div className="flex items-center justify-between pt-1">
          {canUpdateStatus ? (
            <div className="flex items-center space-x-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Ubah Status:</span>
              <select
                value={task.status}
                onChange={(e) => onQuickStatusChange(task, e.target.value as TaskStatus)}
                className="w-full text-xs font-medium py-1 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
              >
                <option value="to_do">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 italic">
              <ShieldAlert className="w-3 h-3 text-slate-400" />
              <span>Hanya PIC/Admin yang dapat ubah status</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
