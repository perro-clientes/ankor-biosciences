-- ════════════════════════════════════════════════════════════════════════════
-- Ruta pública por documento: /private-info/ (los 12 del sitio anterior) o
-- /coa/ (lotes nuevos). Queda fija al crear el documento, igual que file_name:
-- la URL completa es lo que está impreso en el QR.
-- Correr en el SQL Editor ANTES de deployar el código que usa url_prefix.
-- ════════════════════════════════════════════════════════════════════════════

begin;

alter table public.documents
  add column url_prefix text not null default 'coa'
  check (url_prefix in ('private-info', 'coa'));

-- Los documentos existentes (los 12 legacy y cualquier lote creado antes de
-- esta migración) mantienen la URL que ya tienen: /private-info/.
update public.documents set url_prefix = 'private-info';

-- file_name, kind y url_prefix son inmutables.
create or replace function public.documents_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.file_name is distinct from old.file_name then
    raise exception 'file_name es inmutable (% → %)', old.file_name, new.file_name
      using errcode = 'check_violation';
  end if;
  if new.url_prefix is distinct from old.url_prefix then
    raise exception 'url_prefix es inmutable (% → %)', old.url_prefix, new.url_prefix
      using errcode = 'check_violation';
  end if;
  if new.kind is distinct from old.kind then
    raise exception 'kind es inmutable' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end
$$;

commit;
