-- =============================================
-- OCR PROJECT — FULL DATABASE SCHEMA & STORAGE POLICIES
-- Project: izvomjscbqfjnxwxcgnd
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLE: documents
-- =============================================
create table if not exists public.documents (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade,
  file_name         text not null,
  file_type         text,
  file_url          text,
  file_size         integer,
  extracted_text    text,
  summary           text,
  checklist         jsonb default '[]'::jsonb,
  structured_data   jsonb,
  chat_history      jsonb default '[]'::jsonb,
  ocr_engine        text default 'Tesseract',
  confidence        integer,
  word_count        integer default 0,
  language          text default 'en',
  is_handwriting    boolean default false,
  tags              text[] default '{}',
  is_starred        boolean default false,
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now()
);

-- =============================================
-- TABLE: document_pages
-- =============================================
create table if not exists public.document_pages (
  id               uuid default gen_random_uuid() primary key,
  document_id      uuid references public.documents(id) on delete cascade,
  page_number      integer not null,
  extracted_text   text,
  confidence       integer,
  page_image_url   text,
  created_at       timestamp with time zone default now()
);

-- =============================================
-- TABLE: user_settings
-- =============================================
create table if not exists public.user_settings (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade unique,
  default_language text default 'en-US',
  handwriting_mode boolean default false,
  auto_save        boolean default true,
  tts_rate         float default 1.0,
  tts_pitch        float default 1.0,
  created_at       timestamp with time zone default now(),
  updated_at       timestamp with time zone default now()
);

-- =============================================
-- AUTO UPDATE updated_at on row change
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
alter table public.documents      enable row level security;
alter table public.document_pages enable row level security;
alter table public.user_settings  enable row level security;

-- Documents policies
create policy "select_own_documents" on public.documents for select using (auth.uid() = user_id);
create policy "insert_own_documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "update_own_documents" on public.documents for update using (auth.uid() = user_id);
create policy "delete_own_documents" on public.documents for delete using (auth.uid() = user_id);

-- Document pages policies
create policy "select_own_pages" on public.document_pages for select using (
  exists (select 1 from public.documents d where d.id = document_pages.document_id and d.user_id = auth.uid())
);
create policy "insert_own_pages" on public.document_pages for insert with check (
  exists (select 1 from public.documents d where d.id = document_pages.document_id and d.user_id = auth.uid())
);
create policy "delete_own_pages" on public.document_pages for delete using (
  exists (select 1 from public.documents d where d.id = document_pages.document_id and d.user_id = auth.uid())
);

-- User settings policies
create policy "select_own_settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "insert_own_settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "update_own_settings" on public.user_settings for update using (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_documents_user_id on public.documents(user_id);
create index if not exists idx_documents_created_at on public.documents(created_at desc);
create index if not exists idx_documents_ocr_engine on public.documents(ocr_engine);
create index if not exists idx_document_pages_doc_id on public.document_pages(document_id);
create index if not exists idx_user_settings_user_id on public.user_settings(user_id);


-- =============================================
-- STORAGE BUCKET POLICIES
-- Requirements: 
-- 1. Create a Bucket named 'documents' in Supabase Storage dashboard manually.
-- 2. Make it a Public Bucket.
-- 3. Then, the policies below will protect insertions/deletions.
-- =============================================

-- Ensure the bucket exists (If created manually via dashboard, this can be skipped)
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict do nothing;

create policy "storage_insert_own" on storage.objects for insert with check (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "storage_select_own" on storage.objects for select using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "storage_delete_own" on storage.objects for delete using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
