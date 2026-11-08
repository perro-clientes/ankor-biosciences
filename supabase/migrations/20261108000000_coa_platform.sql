-- ════════════════════════════════════════════════════════════════════════════
-- Ankor Bio — plataforma de COAs: esquema, RLS, triggers y bucket.
-- Correr UNA vez en el SQL Editor de Supabase (o con `supabase db push`).
--
-- Regla de fondo: documents.file_name es lo que está impreso en el QR.
-- Es único, case-sensitive e inmutable. Las versiones nunca se borran.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ─── Tipos ──────────────────────────────────────────────────────────────────

create type public.document_kind as enum ('legacy', 'template', 'upload');
create type public.document_status as enum ('pendiente', 'borrador', 'publicado');
create type public.app_role as enum ('admin', 'editor');

-- ─── Roles de usuario ───────────────────────────────────────────────────────
-- Registro cerrado: solo entra quien un admin invitó y tiene fila acá.

create table public.user_roles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now()
);

-- Helpers para RLS. security definer: leen user_roles sin depender de sus políticas.
create function public.current_role_name()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select role from public.user_roles where user_id = auth.uid()
$$;

create function public.has_any_role()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid())
$$;

create function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  )
$$;

-- ─── Plantillas del COA ─────────────────────────────────────────────────────

create table public.templates (
  id               uuid primary key default gen_random_uuid(),
  version          integer not null unique check (version > 0),
  footnotes        text not null default '',
  analytes_default jsonb not null default '[]'::jsonb
                   check (jsonb_typeof(analytes_default) = 'array'),
  active           boolean not null default false,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id)
);

-- Una sola plantilla activa a la vez.
create unique index templates_one_active on public.templates (active) where active;

-- ─── Documentos: uno por URL de QR ──────────────────────────────────────────

create table public.documents (
  id                   uuid primary key default gen_random_uuid(),
  -- Exactamente el patrón que acepta la ruta /private-info/[file].
  file_name            text not null unique
                       check (file_name ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,199}\.pdf$'
                              and position('..' in file_name) = 0),
  label                text not null check (length(trim(label)) > 0),
  kind                 public.document_kind not null,
  status               public.document_status not null default 'pendiente',
  published_version_id uuid,
  created_by           uuid references auth.users (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ─── Versiones: historial completo, nunca se borra ──────────────────────────

create table public.document_versions (
  id               uuid primary key default gen_random_uuid(),
  document_id      uuid not null references public.documents (id) on delete restrict,
  version          integer not null check (version > 0),
  -- Campos del COA (plantilla). null para legacy y uploads.
  data             jsonb,
  template_version integer references public.templates (version),
  -- PDF en Storage: documents/<document_id>/v<version>.pdf (bucket coa-pdfs).
  pdf_path         text unique,
  sha256           text check (sha256 ~ '^[0-9a-f]{64}$'),
  size_bytes       integer check (size_bytes > 0),
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id),
  published_at     timestamptz,
  published_by     uuid references auth.users (id),
  unique (document_id, version),
  -- Una versión publicable tiene su PDF completo.
  constraint document_versions_published_has_pdf check (
    published_at is null
    or (pdf_path is not null and sha256 is not null and size_bytes is not null)
  )
);

create index document_versions_document_id on public.document_versions (document_id);

alter table public.documents
  add constraint documents_published_version_fk
  foreign key (published_version_id) references public.document_versions (id)
  deferrable initially deferred;

-- ─── Audit log ──────────────────────────────────────────────────────────────

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor       uuid references auth.users (id),
  action      text not null,
  document_id uuid references public.documents (id),
  version_id  uuid references public.document_versions (id),
  details     jsonb,
  at          timestamptz not null default now()
);

create index audit_log_document_id on public.audit_log (document_id, at desc);

-- ════════════════════════════════════════════════════════════════════════════
-- Triggers
-- ════════════════════════════════════════════════════════════════════════════

-- file_name inmutable: está impreso en packaging.
create function public.documents_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.file_name is distinct from old.file_name then
    raise exception 'file_name es inmutable (% → %)', old.file_name, new.file_name
      using errcode = 'check_violation';
  end if;
  if new.kind is distinct from old.kind then
    raise exception 'kind es inmutable' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end
$$;

create trigger documents_guard
  before update on public.documents
  for each row execute function public.documents_guard();

-- Un documento con versiones publicadas no se borra (su URL está impresa).
create function public.documents_no_delete_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.published_version_id is not null then
    raise exception 'No se puede borrar un documento publicado (%)', old.file_name
      using errcode = 'check_violation';
  end if;
  return old;
end
$$;

create trigger documents_no_delete_published
  before delete on public.documents
  for each row execute function public.documents_no_delete_published();

-- published_version_id debe ser una versión publicada del mismo documento.
create function public.documents_check_published_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v record;
begin
  if new.published_version_id is null then
    return new;
  end if;
  select document_id, published_at into v
    from public.document_versions where id = new.published_version_id;
  if not found or v.document_id <> new.id then
    raise exception 'published_version_id no pertenece a este documento'
      using errcode = 'foreign_key_violation';
  end if;
  if v.published_at is null then
    raise exception 'La versión % no está publicada', new.published_version_id
      using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create constraint trigger documents_check_published_version
  after insert or update of published_version_id on public.documents
  deferrable initially deferred
  for each row execute function public.documents_check_published_version();

-- Las versiones nunca se borran. Una vez publicadas, su contenido es inmutable.
create function public.document_versions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Las versiones de documentos nunca se borran'
      using errcode = 'check_violation';
  end if;
  if new.document_id is distinct from old.document_id
     or new.version is distinct from old.version then
    raise exception 'document_id y version son inmutables' using errcode = 'check_violation';
  end if;
  if old.published_at is not null and (
       new.data is distinct from old.data
       or new.template_version is distinct from old.template_version
       or new.pdf_path is distinct from old.pdf_path
       or new.sha256 is distinct from old.sha256
       or new.size_bytes is distinct from old.size_bytes
       or new.published_at is distinct from old.published_at
       or new.published_by is distinct from old.published_by) then
    raise exception 'Una versión publicada no se modifica: creá una versión nueva'
      using errcode = 'check_violation';
  end if;
  return new;
end
$$;

create trigger document_versions_guard
  before update or delete on public.document_versions
  for each row execute function public.document_versions_guard();

-- El audit log es de solo agregar.
create function public.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log es de solo agregar' using errcode = 'check_violation';
end
$$;

create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.audit_log_append_only();

-- ════════════════════════════════════════════════════════════════════════════
-- RLS: solo usuarios autenticados con rol. La ruta pública /private-info usa
-- la service role key (no pasa por RLS) y nunca la sesión del usuario.
-- Sin políticas de DELETE: nadie borra desde el cliente.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.user_roles        enable row level security;
alter table public.templates         enable row level security;
alter table public.documents         enable row level security;
alter table public.document_versions enable row level security;
alter table public.audit_log         enable row level security;

-- anon no tiene nada que hacer en estas tablas.
revoke all on public.user_roles, public.templates, public.documents,
              public.document_versions, public.audit_log from anon;
revoke execute on function public.current_role_name(), public.has_any_role(),
                           public.is_admin() from anon, public;
grant execute on function public.current_role_name(), public.has_any_role(),
                          public.is_admin() to authenticated, service_role;

-- user_roles: cada uno ve su fila; el admin ve y administra todas.
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy user_roles_admin_insert on public.user_roles
  for insert to authenticated with check ((select public.is_admin()));
create policy user_roles_admin_update on public.user_roles
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- templates: leen editores y admins; solo admin escribe.
create policy templates_select on public.templates
  for select to authenticated using ((select public.has_any_role()));
create policy templates_admin_insert on public.templates
  for insert to authenticated with check ((select public.is_admin()));
create policy templates_admin_update on public.templates
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- documents: editores y admins leen, crean y actualizan.
create policy documents_select on public.documents
  for select to authenticated using ((select public.has_any_role()));
create policy documents_insert on public.documents
  for insert to authenticated with check ((select public.has_any_role()));
create policy documents_update on public.documents
  for update to authenticated
  using ((select public.has_any_role())) with check ((select public.has_any_role()));

-- document_versions: ídem (los triggers impiden borrar y editar publicadas).
create policy document_versions_select on public.document_versions
  for select to authenticated using ((select public.has_any_role()));
create policy document_versions_insert on public.document_versions
  for insert to authenticated with check ((select public.has_any_role()));
create policy document_versions_update on public.document_versions
  for update to authenticated
  using ((select public.has_any_role())) with check ((select public.has_any_role()));

-- audit_log: leen editores y admins; cada uno agrega solo a su nombre.
create policy audit_log_select on public.audit_log
  for select to authenticated using ((select public.has_any_role()));
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check ((select public.has_any_role()) and actor = (select auth.uid()));

-- ════════════════════════════════════════════════════════════════════════════
-- Storage: bucket privado para los PDFs. Sin políticas sobre storage.objects:
-- solo la service role (servidor) lee y escribe. Nadie recibe URLs del bucket.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coa-pdfs', 'coa-pdfs', false, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ════════════════════════════════════════════════════════════════════════════
-- Plantilla inicial (v1). Las notas al pie se cargan en la tarea 8 a partir
-- del COA del Lote X.
-- ════════════════════════════════════════════════════════════════════════════

insert into public.templates (version, footnotes, analytes_default, active)
values (
  1,
  '',
  '["CBC","CBD","CBDA","CBDV","CBG","CBGA","CBL","CBN","CBT","Δ-8-THC","Δ-9-THC","THCA","THCV","Total THC","Total CBD","Total Cannabinoids"]'::jsonb,
  true
);

commit;
