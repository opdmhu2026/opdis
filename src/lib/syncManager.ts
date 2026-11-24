import { db } from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Task } from '../types';

export class SyncManager {
  private static instance: SyncManager;
  private isSyncing = false;
  private listeners: ((online: boolean, unsyncedCount: number) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  public subscribe(callback: (online: boolean, unsyncedCount: number) => void) {
    this.listeners.push(callback);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private async notifyListeners() {
    const isOnline = navigator.onLine;
    const unsyncedCount = await db.syncQueue.count();
    this.listeners.forEach(cb => cb(isOnline, unsyncedCount));
  }

  private async handleNetworkChange() {
    await this.notifyListeners();
    if (navigator.onLine && isSupabaseConfigured) {
      this.syncNow();
    }
  }

  /**
   * Menyimpan task baru (Offline-First)
   */
  public async saveTask(task: Task, isNew = false): Promise<void> {
    // 1. Simpan ke database lokal IndexedDB terlebih dahulu (Instan di HP)
    await db.tasks.put(task);

    // 2. Tambahkan ke antrean sinkronisasi
    await db.syncQueue.put({
      id: crypto.randomUUID(),
      task_id: task.id,
      action: isNew ? 'CREATE' : 'UPDATE',
      payload: task,
      created_at: new Date().toISOString()
    });

    await this.notifyListeners();

    // 3. Jika sedang online dan Supabase aktif, langsung coba sinkronkan
    if (navigator.onLine && isSupabaseConfigured) {
      this.syncNow();
    }
  }

  /**
   * Mengubah status task (Hanya PIC atau Admin)
   */
  public async updateTaskStatus(taskId: string, newStatus: Task['status'], completionNotes?: string): Promise<void> {
    const task = await db.tasks.get(taskId);
    if (!task) return;

    task.status = newStatus;
    if (completionNotes !== undefined) {
      task.completion_notes = completionNotes;
    }
    task.updated_at = new Date().toISOString();
    task.is_synced = false;

    await db.tasks.put(task);

    await db.syncQueue.put({
      id: crypto.randomUUID(),
      task_id: task.id,
      action: 'STATUS_CHANGE',
      payload: { status: newStatus, completion_notes: task.completion_notes, updated_at: task.updated_at },
      created_at: new Date().toISOString()
    });

    await this.notifyListeners();

    if (navigator.onLine && isSupabaseConfigured) {
      this.syncNow();
    }
  }

  /**
   * Proses Sinkronisasi 2 Arah (Upload queue lokal & Tarik update dari cloud)
   */
  public async syncNow(): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) return { success: false, message: 'Sync sedang berjalan' };
    if (!navigator.onLine) return { success: false, message: 'Koneksi offline' };
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase URL/Key belum dikonfigurasi (Mode Lokal Aktif)' };
    }

    this.isSyncing = true;
    try {
      // 1. Flush antrean lokal ke Supabase
      const queueItems = await db.syncQueue.toArray();

      for (const item of queueItems) {
        if (item.action === 'CREATE' || item.action === 'UPDATE') {
          const { error } = await supabase
            .from('tasks')
            .upsert({
              id: item.payload.id,
              title: item.payload.title,
              description: item.payload.description,
              pic_id: item.payload.pic_id,
              priority: item.payload.priority,
              status: item.payload.status,
              deadline: item.payload.deadline,
              completion_notes: item.payload.completion_notes,
              updated_at: item.payload.updated_at
            });

          if (!error) {
            await db.tasks.update(item.task_id, { is_synced: true });
            await db.syncQueue.delete(item.id);
          }
        } else if (item.action === 'STATUS_CHANGE') {
          const { error } = await supabase
            .from('tasks')
            .update({
              status: item.payload.status,
              completion_notes: item.payload.completion_notes,
              updated_at: item.payload.updated_at
            })
            .eq('id', item.task_id);

          if (!error) {
            await db.tasks.update(item.task_id, { is_synced: true });
            await db.syncQueue.delete(item.id);
          }
        }
      }

      // 2. Tarik update terbaru dari Supabase ke lokal IndexedDB
      const { data: cloudTasks, error: pullError } = await supabase
        .from('tasks')
        .select('*');

      if (!pullError && cloudTasks) {
        for (const t of cloudTasks) {
          const local = await db.tasks.get(t.id);
          // Jika tidak ada konflik antrean lokal, update data lokal
          const hasPendingQueue = queueItems.some(q => q.task_id === t.id);
          if (!hasPendingQueue) {
            await db.tasks.put({
              ...t,
              is_synced: true
            });
          }
        }
      }

      await this.notifyListeners();
      return { success: true, message: 'Sinkronisasi berhasil!' };
    } catch (err: any) {
      console.error('Gagal sync:', err);
      return { success: false, message: err?.message || 'Gagal sinkronisasi' };
    } finally {
      this.isSyncing = false;
      await this.notifyListeners();
    }
  }
}

export const syncManager = SyncManager.getInstance();
