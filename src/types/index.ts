export type UserRole = 'admin' | 'sect_head' | 'trainer' | 'observer';

export type TaskStatus = 'to_do' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  local_base64?: string; // Cache lokal jika offline
  created_at: string;
}

export interface Task {
  id: string; // UUID
  title: string;
  description?: string;
  created_by?: string;
  pic_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relasi & Offline Helper
  pic?: Profile;
  member_ids?: string[]; // Anggota pendukung
  attachments?: TaskAttachment[];
  
  // Offline sync flags
  is_synced: boolean; // false jika dibuat/diedit saat offline
}

export interface SyncQueueItem {
  id: string;
  task_id: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DELETE';
  payload: any;
  created_at: string;
}
