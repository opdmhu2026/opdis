import React, { useState } from 'react';
import type { Task } from '../types';
import { isOverdue } from '../lib/utils';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PauseCircle, 
  XCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface EvaluationSummaryProps {
  tasks: Task[];
  onFilterByStatus?: (status: Task['status'] | 'all' | 'overdue') => void;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ tasks, onFilterByStatus }) => {
  const [isOpen, setIsOpen] = useState(true);

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const toDo = tasks.filter(t => t.status === 'to_do').length;
  const onHold = tasks.filter(t => t.status === 'on_hold').length;
  const cancelled = tasks.filter(t => t.status === 'cancelled').length;
  const overdueCount = tasks.filter(t => isOverdue(t.deadline, t.status)).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      {/* Header Panel */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-700">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Evaluasi & Rekap Harian OPD
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring progres tim, ketercapaian, dan pekerjaan tertunda
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-500">Tingkat Selesai: </span>
            <span className="text-sm font-bold text-emerald-600">{completionRate}%</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Grid Kartu Metrik Rekap (PRD 5.9) */}
      {isOpen && (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Total Task */}
          <div 
            onClick={() => onFilterByStatus?.('all')}
            className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Total Task</span>
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-slate-800">{total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Semua pekerjaan</div>
          </div>

          {/* Selesai */}
          <div 
            onClick={() => onFilterByStatus?.('completed')}
            className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 hover:border-emerald-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-emerald-700 text-xs font-medium mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700">{completed}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">{completionRate}% tercapai</div>
          </div>

          {/* In Progress */}
          <div 
            onClick={() => onFilterByStatus?.('in_progress')}
            className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 hover:border-blue-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-blue-700 text-xs font-medium mb-1">
              <span>In Progress</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-blue-700">{inProgress}</div>
            <div className="text-[10px] text-blue-600/80 mt-0.5">Sedang berjalan</div>
          </div>

          {/* To Do */}
          <div 
            onClick={() => onFilterByStatus?.('to_do')}
            className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 hover:border-amber-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-amber-800 text-xs font-medium mb-1">
              <span>To Do</span>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-amber-800">{toDo}</div>
            <div className="text-[10px] text-amber-700/80 mt-0.5">Belum dimulai</div>
          </div>

          {/* On Hold */}
          <div 
            onClick={() => onFilterByStatus?.('on_hold')}
            className="p-3 bg-orange-50/70 rounded-xl border border-orange-200 hover:border-orange-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-orange-700 text-xs font-medium mb-1">
              <span>On Hold</span>
              <PauseCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-orange-700">{onHold}</div>
            <div className="text-[10px] text-orange-600/80 mt-0.5">Tertunda sementara</div>
          </div>

          {/* Cancelled */}
          <div 
            onClick={() => onFilterByStatus?.('cancelled')}
            className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 hover:border-rose-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-rose-700 text-xs font-medium mb-1">
              <span>Cancelled</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-extrabold text-rose-700">{cancelled}</div>
            <div className="text-[10px] text-rose-600/80 mt-0.5">Dibatalkan</div>
          </div>

          {/* Melewati Deadline (Overdue) */}
          <div 
            onClick={() => onFilterByStatus?.('overdue')}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              overdueCount > 0 
                ? 'bg-red-50 border-red-300 hover:border-red-400 text-red-700' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium mb-1">
              <span>Overdue</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
            </div>
            <div className="text-xl font-extrabold">{overdueCount}</div>
            <div className="text-[10px] mt-0.5">Lewat jadwal</div>
          </div>
        </div>
      )}
    </div>
  );
};
