-- ============================================================================== 
-- FINAL PRODUCTION SCHEMA: Clarity OCR (Hybrid Firebase + Supabase)
-- Version: 1.0.0 (LOCKED)
-- Security Model: Firebase Auth + Supabase RLS (Trusting 'sub' claim)
-- Optimization: No-Join RLS (Denormalized firebase_uid)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pgcrypto";

-- 2. USERS TABLE (The Anchor)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text unique not null,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for RLS performance (CRITICAL)
create index idx_users_firebase_uid on public.users(firebase_uid);

-- RLS: USERS
alter table public.users enable row level security;
-- No Joins. No Exists. Pure logic.
create policy "RLS_Users_Select" on public.users for select using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Users_Insert" on public.users for insert with check (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Users_Update" on public.users for update using (firebase_uid = (auth.jwt() ->> 'sub'));


-- 3. DOCUMENTS TABLE
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null, -- FK for integrity
  firebase_uid text not null, -- DENORMALIZED FOR RLS
  file_name text not null,
  file_path text,
  status text check (status in ('processing', 'completed', 'failed')) default 'processing',
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_documents_firebase_uid on public.documents(firebase_uid);

-- RLS: DOCUMENTS (Zero Join)
alter table public.documents enable row level security;
create policy "RLS_Documents_Select" on public.documents for select using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Documents_Insert" on public.documents for insert with check (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Documents_Update" on public.documents for update using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Documents_Delete" on public.documents for delete using (firebase_uid = (auth.jwt() ->> 'sub'));


-- 4. PAGES TABLE
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  firebase_uid text not null, -- DENORMALIZED FOR RLS
  page_number integer not null,
  extracted_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_pages_firebase_uid on public.pages(firebase_uid);

-- RLS: PAGES
alter table public.pages enable row level security;
create policy "RLS_Pages_Select" on public.pages for select using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Pages_Insert" on public.pages for insert with check (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Pages_Delete" on public.pages for delete using (firebase_uid = (auth.jwt() ->> 'sub'));


-- 5. INVOICE ITEMS TABLE
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  firebase_uid text not null, -- DENORMALIZED FOR RLS
  description text,
  quantity numeric,
  price numeric,
  tax numeric,
  total numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_invoice_items_firebase_uid on public.invoice_items(firebase_uid);

-- RLS: INVOICE ITEMS
alter table public.invoice_items enable row level security;
create policy "RLS_Items_Select" on public.invoice_items for select using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Items_Insert" on public.invoice_items for insert with check (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Items_Delete" on public.invoice_items for delete using (firebase_uid = (auth.jwt() ->> 'sub'));


-- 6. EMBEDDINGS TABLE
create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade not null,
  firebase_uid text not null, -- DENORMALIZED FOR RLS
  content text,
  embedding vector(3072), -- Future-proof dimension (e.g. text-embedding-3-large)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_embeddings_firebase_uid on public.embeddings(firebase_uid);

-- RLS: EMBEDDINGS
alter table public.embeddings enable row level security;
create policy "RLS_Embeddings_Select" on public.embeddings for select using (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Embeddings_Insert" on public.embeddings for insert with check (firebase_uid = (auth.jwt() ->> 'sub'));
create policy "RLS_Embeddings_Delete" on public.embeddings for delete using (firebase_uid = (auth.jwt() ->> 'sub'));

-- 7. STORAGE POLICIES (Reference Only - Configure in Dashboard)
-- Bucket: 'private_bucket'
-- Path Structure: /{firebase_uid}/{document_id}/{filename}
-- Policy: (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
