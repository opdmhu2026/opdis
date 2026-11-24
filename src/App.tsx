import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialProfilesIfEmpty } from './lib/db';
import { syncManager } from './lib/syncManager';
import { isSupabaseConfigured } from './lib/supabase';
import type { Task, Profile, TaskStatus, TaskPriority } from './types';
import { Navbar } from './components/Navbar';
import { EvaluationSummary } from './components/EvaluationSummary';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { LoginModal } from './components/LoginModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Layers, 
  CheckCircle,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { isOverdue } from './lib/utils';

export function App() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [picFilter, setPicFilter] = useState<string>('all');

  // Load live reactive queries from Dexie.js (Offline-First)
  const tasks = useLiveQuery(() => db.tasks.orderBy('updated_at').reverse().toArray()) || [];
  const profiles = useLiveQuery(() => db.profiles.toArray()) || [];

  // Inisialisasi awal & Cek Sesi Login Offline
  useEffect(() => {
    seedInitialProfilesIfEmpty().then(async () => {
      // Otomatis tarik & sinkron data terbaru dari Supabase saat aplikasi dibuka
      if (navigator.onLine && isSupabaseConfigured) {
        syncManager.syncNow().catch((err) => console.warn('Auto-sync init error:', err));
      }

      const allProfiles = await db.profiles.toArray();
      const savedUserId = localStorage.getItem('opdis_logged_in_user_id');
      if (savedUserId) {
        const found = allProfiles.find(p => p.id === savedUserId);
        if (found) {
          setCurrentProfile(found);
          setIsLoginModalOpen(false);
          return;
        }
      }
      // Jika belum login, buka modal login PIN
      setIsLoginModalOpen(true);
    });
  }, []);

  const handleLoginSuccess = (profile: Profile) => {
    localStorage.setItem('opdis_logged_in_user_id', profile.id);
    setCurrentProfile(profile);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('opdis_logged_in_user_id');
    setCurrentProfile(null);
    setIsLoginModalOpen(true);
  };

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    // 1. Search Query (Judul atau deskripsi)
    const matchSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Status Filter
    let matchStatus = true;
    if (statusFilter === 'overdue') {
      matchStatus = isOverdue(task.deadline, task.status);
    } else if (statusFilter !== 'all') {
      matchStatus = task.status === statusFilter;
    }

    // 3. Priority Filter
    const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    // 4. PIC Filter
    const matchPic = picFilter === 'all' || task.pic_id === picFilter;

    return matchSearch && matchStatus && matchPriority && matchPic;
  });

  // Handler Simpan Task Baru
  const handleSaveTask = async (taskData: Partial<Task>) => {
    await syncManager.saveTask(taskData as Task, true);
  };

  // Handler Ubah Status Cepat dari Card
  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await syncManager.updateTaskStatus(task.id, newStatus);
  };

  // Handler Update Status & Catatan dari Modal Detail
  const handleUpdateStatusAndNotes = async (taskId: string, newStatus: TaskStatus, notes: string) => {
    await syncManager.updateTaskStatus(taskId, newStatus, notes);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        status: newStatus,
        completion_notes: notes
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-20 sm:pb-10">
      {/* 1. Navigation Bar */}
      <Navbar
        currentProfile={currentProfile}
        profiles={profiles}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-5 sm:px-6 w-full flex-1">
        {/* Banner Petunjuk Khusus Pengguna iPhone / PWA */}
        <div className="mb-5 bg-gradient-to-r from-brand-900 to-brand-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-amber-300">Tips Pengguna iPhone (iOS):</span>
              <p className="text-slate-200 text-xs mt-0.5">
                Buka di Safari &gt; Tap tombol <strong>Share</strong> (ikon kotak panah ke atas) &gt; Pilih <strong>"Add to Home Screen"</strong> agar aplikasi bisa dibuka offline di pit tanpa sinyal!
              </p>
            </div>
          </div>
        </div>

        {/* 2. Evaluasi Harian & Rekap (PRD Section 5.9) */}
        <EvaluationSummary
          tasks={tasks}
          onFilterByStatus={(st) => setStatusFilter(st)}
        />

        {/* 3. Bar Filter & Aksi Tambah Task */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Kolom Pencarian */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pekerjaan, aktivitas, atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 placeholder-slate-400 bg-slate-50/50"
            />
          </div>

          {/* Filter Dropdown Grup */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Semua Status</option>
              <option value="to_do">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">⚠️ Overdue (Terlambat)</option>
            </select>

            {/* Filter Prioritas */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">Semua Prioritas</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Filter PIC */}
            <select
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[140px]"
            >
              <option value="all">Semua PIC</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Tombol Buat Task (Desktop - Tidak muncul untuk Observer) */}
            {currentProfile?.role !== 'observer' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Task</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Daftar Kartu Task (Grid Layout) */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Tidak ada task yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Coba ubah kata kunci pencarian atau reset filter di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                profiles={profiles}
                currentProfile={currentProfile}
                onOpenDetail={(t) => {
                  setSelectedTask(t);
                  setIsDetailModalOpen(true);
                }}
                onQuickStatusChange={handleQuickStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (+) Khusus Mobile iPhone/Android (Kecuali Observer) */}
      {currentProfile?.role !== 'observer' && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="sm:hidden fixed right-5 bottom-6 z-30 w-14 h-14 bg-brand-700 hover:bg-brand-800 text-white rounded-full shadow-lg shadow-brand-900/40 flex items-center justify-center font-bold transition-transform active:scale-95"
          title="Buat Task Baru"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Modal Buat Task */}
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveTask}
        profiles={profiles}
        currentProfile={currentProfile}
      />

      {/* Modal Detail & Catatan Pekerjaan */}
      <TaskDetailModal
        isOpen={isDetailModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        profiles={profiles}
        currentProfile={currentProfile}
        onUpdateStatusAndNotes={handleUpdateStatusAndNotes}
      />

      {/* Modal Manajemen Tim & Anggota OPD (Admin) */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        profiles={profiles}
        currentProfile={currentProfile}
        onProfileUpdated={async () => {
          const allProfiles = await db.profiles.toArray();
          if (allProfiles.length > 0 && (!currentProfile || !allProfiles.some(p => p.id === currentProfile.id))) {
            setCurrentProfile(allProfiles[0]);
          }
        }}
      />

      {/* Modal Login Autentikasi PIN Cepat (Offline-Ready) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        profiles={profiles}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
