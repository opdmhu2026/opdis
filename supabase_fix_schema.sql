-- ==============================================================
-- SCRIPT PERBAIKAN SCHEMA DATABASE SUPABASE OPDIS (PIN AUTH)
-- Copy dan Paste script ini di Supabase -> SQL Editor -> Klik RUN
-- ==============================================================

-- 1. PASTIKAN ENUM TYPES SUDAH ADA
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'sect_head', 'trainer', 'observer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('to_do', 'in_progress', 'on_hold', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PERBAIKAN TABEL PROFILES (Lepas ketergantungan dari auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik TEXT,
    name TEXT NOT NULL,
    email TEXT,
    role user_role NOT NULL DEFAULT 'trainer',
    department TEXT NOT NULL DEFAULT 'Operational People Development',
    pin TEXT NOT NULL DEFAULT '1234',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tambahkan kolom pin dan nik jika tabel sudah terlanjur ada sebelumnya
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT NOT NULL DEFAULT '1234';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nik TEXT;

-- Lepas foreign key ke auth.users jika sebelumnya terkunci
DO $$ BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 3. PERBAIKAN TABEL TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID,
    pic_id UUID NOT NULL,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'to_do',
    deadline TIMESTAMPTZ,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Lepas foreign key pic_id ke profiles jika ada constraint ketat
DO $$ BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_pic_id_fkey;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 4. BUKA AKSES ROW LEVEL SECURITY (RLS) UNTUK ANON KEY
-- Karena kita memakai sistem PIN lokal yang cepat, Supabase diakses dengan Anon Key
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- Berikan izin akses penuh kepada role anon dan authenticated
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.tasks TO anon, authenticated;

-- ==============================================================
-- SELESAI! Sekarang Supabase siap menerima & mengirim data dari HP & PC.
-- ==============================================================
