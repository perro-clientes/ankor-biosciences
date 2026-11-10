-- ════════════════════════════════════════════════════════════════════════════
-- Borrar un LOTE DE PRUEBA (SQL Editor). Uso excepcional.
--
-- La base no deja borrar lotes publicados ni versiones, a propósito: su URL
-- puede estar impresa. Este script apaga esas reglas solo dentro de la
-- transacción y solo para UN lote que cumpla todo esto:
--   - lo creó el panel (kind = 'template') con URL nueva (url_prefix = 'coa')
--   - tiene menos de 7 días
-- Nunca toca los 12 del sitio anterior.
--
-- Uso: reemplazar el file_name abajo y correr TODO el script.
-- Después: Storage → coa-pdfs → documents/<id que muestra el script> → borrar la carpeta.
-- ════════════════════════════════════════════════════════════════════════════

begin;

create temp table _target on commit drop as
select id, file_name
  from public.documents
 where file_name = 'lote-xii.pdf'          -- ← el lote de prueba a borrar
   and kind = 'template'
   and url_prefix = 'coa'
   and created_at > now() - interval '7 days';

do $$
declare
  n int;
  t record;
begin
  select count(*) into n from _target;
  if n <> 1 then
    raise exception 'No se borra nada: no hay un lote de prueba con ese nombre (template, /coa/, < 7 días).';
  end if;
  select * into t from _target;
  raise notice 'Borrando % (id %). Después borrá en Storage la carpeta documents/%/', t.file_name, t.id, t.id;
end $$;

-- Apagar las reglas solo durante esta transacción.
alter table public.documents disable trigger documents_no_delete_published;
alter table public.document_versions disable trigger document_versions_guard;
alter table public.audit_log disable trigger audit_log_append_only;

update public.documents set published_version_id = null where id in (select id from _target);
delete from public.audit_log where document_id in (select id from _target);
delete from public.document_versions where document_id in (select id from _target);
delete from public.documents where id in (select id from _target);

-- Ejecutar ahora los chequeos diferidos (si no, Postgres no deja reactivar).
set constraints all immediate;

-- Volver a prenderlas antes de cerrar.
alter table public.documents enable trigger documents_no_delete_published;
alter table public.document_versions enable trigger document_versions_guard;
alter table public.audit_log enable trigger audit_log_append_only;

commit;
