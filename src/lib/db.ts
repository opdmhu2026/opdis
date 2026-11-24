import Dexie, { type Table } from 'dexie';
import type { Task, Profile, SyncQueueItem, TaskAttachment } from '../types';

export class OpdisDatabase extends Dexie {
  tasks!: Table<Task, string>;
  profiles!: Table<Profile, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  attachments!: Table<TaskAttachment, string>;

  constructor() {
    super('OpdisDatabase_MHU');
    this.version(1).stores({
      tasks: 'id, status, pic_id, priority, deadline, is_synced, updated_at',
      profiles: 'id, role, name, email',
      syncQueue: 'id, action, task_id, created_at',
      attachments: 'id, task_id'
    });
  }
}

export const db = new OpdisDatabase();

// Inisialisasi Mock Data Anggota Tim OPD jika lokal masih kosong
export async function seedInitialProfilesIfEmpty() {
  const count = await db.profiles.count();
  if (count === 0) {
    const initialProfiles: Profile[] = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nik: 'PST-001',
        name: 'Ahmad Fauzi',
        email: 'ahmad.fauzi@pst-mhu.com',
        role: 'sect_head',
        department: 'Operational People Development',
        pin: '8888' // Master PIN Sect Head
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        nik: 'PST-002',
        name: 'Siti Rahma',
        email: 'siti.rahma@pst-mhu.com',
        role: 'admin',
        department: 'Operational People Development',
        pin: '1234'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        nik: 'PST-003',
        name: 'Budi Santoso',
        email: 'budi.santoso@pst-mhu.com',
        role: 'trainer',
        department: 'OPD - Trainer Hauler',
        pin: '1234'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        nik: 'PST-004',
        name: 'Dedi Kurniawan',
        email: 'dedi.kurniawan@pst-mhu.com',
        role: 'trainer',
        department: 'OPD - Trainer Excavator',
        pin: '1234'
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        nik: 'PST-005',
        name: 'Agus Setiawan',
        email: 'agus.setiawan@pst-mhu.com',
        role: 'trainer',
        department: 'OPD - Trainer Dozer',
        pin: '1234'
      }
    ];
    await db.profiles.bulkAdd(initialProfiles);
  } else {
    // Pastikan semua user existing punya PIN jika sebelumnya undefined
    const existingProfiles = await db.profiles.toArray();
    for (const p of existingProfiles) {
      if (!p.pin) {
        await db.profiles.update(p.id, {
          pin: p.role === 'sect_head' ? '8888' : '1234'
        });
      }
    }
  }

  // Seed contoh task awal jika database task kosong
  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    const sampleTasks: Task[] = [
      {
        id: 'a001-sample-task-001',
        title: 'Observasi Speed Hauler HD 785 Area Disposal Pit Barat',
        description: 'Monitoring kepatuhan kecepatan batas aman 40 km/jam pada turunan disposal.',
        pic_id: '33333333-3333-3333-3333-333333333333', // Budi
        member_ids: ['44444444-4444-4444-4444-444444444444'], // Dedi
        priority: 'high',
        status: 'in_progress',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        completion_notes: 'Sudah dilakukan pengecekan pada 12 unit, 2 operator diberikan coaching langsung.',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: true
      },
      {
        id: 'a002-sample-task-002',
        title: 'Skillup Refreshment Operator PC1250 Loading Time',
        description: 'Training optimasi siklus waktu penggalian untuk mencapai target pass match.',
        pic_id: '44444444-4444-4444-4444-444444444444', // Dedi
        member_ids: ['55555555-5555-5555-5555-555555555555'],
        priority: 'medium',
        status: 'to_do',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: true
      },
      {
        id: 'a003-sample-task-003',
        title: 'Rekap Absensi & Nilai Teori Test New Hire Batch 4',
        description: 'Input nilai tes pemahaman K3LH dan dasar operasional unit ke master sheet.',
        pic_id: '22222222-2222-2222-2222-222222222222', // Siti (Admin)
        priority: 'high',
        status: 'completed',
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        completion_notes: 'Seluruh nilai 15 kandidat sudah dimasukkan dan disetujui Sect Head.',
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        is_synced: true
      }
    ];
    await db.tasks.bulkAdd(sampleTasks);
  }
}
