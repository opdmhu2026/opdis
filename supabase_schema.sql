-- ==============================================================
-- SCHEMA DATABASE OPDIS (OPERATION PEOPLE DEVELOPMENT INFO SYSTEM)
-- PT. PST SITE MHU - DATABASE SUPABASE (POSTGRESQL)
-- ==============================================================

-- 1. ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin', 'sect_head', 'trainer', 'observer');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('to_do', 'in_progress', 'on_hold', 'completed', 'cancelled');

-- 2. TABEL PROFILES (PENGGUNA & HAK AKSES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'trainer',
    department TEXT NOT NULL DEFAULT 'Operational People Development (OPD)',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger auto insert profile saat user signup di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'trainer'::user_role)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. TABEL TASKS (PEKERJAAN UTAMA)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    pic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    priority task_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'to_do',
    deadline TIMESTAMPTZ,
    completion_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk filter status dan performa query evaluasi harian
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_pic ON public.tasks(pic_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON public.tasks(updated_at);

-- 4. TABEL TASK_MEMBERS (ANGGOTA PENDUKUNG)
CREATE TABLE IF NOT EXISTS public.task_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(task_id, user_id)
);

-- 5. TABEL TASK_ATTACHMENTS (DOKUMENTASI FOTO / LAPORAN)
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INT,
    file_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (Bisa dibaca oleh seluruh anggota tim OPD yang login)
CREATE POLICY "Profiles can be viewed by authenticated users"
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tasks can be viewed by authenticated users"
    ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tasks can be created by authenticated users"
    ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Sesuai PRD Aturan Bisnis 6: Hanya PIC utama dan Admin yang berhak update status/progres
CREATE POLICY "Tasks can be updated by PIC or Admin"
    ON public.tasks FOR UPDATE TO authenticated
    USING (
        auth.uid() = pic_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'sect_head')
        )
    );

CREATE POLICY "Task members can be viewed by all"
    ON public.task_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Task members can be managed by creator, PIC, or Admin"
    ON public.task_members FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Attachments can be viewed by all"
    ON public.task_attachments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Attachments can be inserted by authenticated users"
    ON public.task_attachments FOR INSERT TO authenticated WITH CHECK (true);

-- 7. STORAGE BUCKET UNTUK LAMPIRAN
INSERT INTO storage.buckets (id, name, public) 
VALUES ('opdis-attachments', 'opdis-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public attachment download"
    ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'opdis-attachments');

CREATE POLICY "Authenticated user upload"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'opdis-attachments');
