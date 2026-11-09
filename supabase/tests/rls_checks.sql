-- ════════════════════════════════════════════════════════════════════════════
-- Chequeos de RLS y triggers. Correr en el SQL Editor DESPUÉS de la migración.
-- Todo pasa dentro de una transacción que termina en ROLLBACK: no deja datos.
-- Si algo falla, se corta con un error que dice qué chequeo no pasó.
-- Al final debe aparecer: "OK: todos los chequeos de RLS y triggers pasaron".
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- Usuarios de prueba (se descartan con el rollback).
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'admin-test@example.com'),
  ('00000000-0000-0000-0000-00000000e001', 'editor-test@example.com'),
  ('00000000-0000-0000-0000-00000000c001', 'sin-rol-test@example.com');
insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000a001', 'admin'),
  ('00000000-0000-0000-0000-00000000e001', 'editor');

-- Helper: falla si el SQL NO lanza error.
create function pg_temp.expect_error(label text, stmt text) returns void
language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok  %', label;
    return;
  end;
  raise exception 'FALLÓ: % (se esperaba un error y no hubo)', label;
end $$;

create function pg_temp.expect_count(label text, stmt text, expected bigint) returns void
language plpgsql as $$
declare n bigint;
begin
  execute stmt into n;
  if n is distinct from expected then
    raise exception 'FALLÓ: % (esperado %, obtenido %)', label, expected, n;
  end if;
  raise notice 'ok  %', label;
end $$;

-- Borrar con RLS y sin política de DELETE no da error: afecta 0 filas. Se verifica eso.
create function pg_temp.expect_kept(label text, del text, cnt text, expected bigint) returns void
language plpgsql as $$
declare n bigint;
begin
  execute del;
  execute cnt into n;
  if n is distinct from expected then
    raise exception 'FALLÓ: % (quedaron %, se esperaban %)', label, n, expected;
  end if;
  raise notice 'ok  %', label;
end $$;

grant execute on function pg_temp.expect_error(text, text),
  pg_temp.expect_count(text, text, bigint),
  pg_temp.expect_kept(text, text, text, bigint) to anon, authenticated;

-- ─── anon: sin acceso ───────────────────────────────────────────────────────
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select pg_temp.expect_error('anon no lee documents', 'select count(*) from public.documents');
select pg_temp.expect_error('anon no lee document_versions', 'select count(*) from public.document_versions');
select pg_temp.expect_error('anon no inserta documents',
  $$insert into public.documents (file_name, label, kind) values ('X-anon.pdf','x','template')$$);
reset role;

-- ─── autenticado sin rol: no ve ni escribe nada ─────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated"}';
select pg_temp.expect_count('sin rol no ve documents', 'select count(*) from public.documents', 0);
select pg_temp.expect_error('sin rol no inserta documents',
  $$insert into public.documents (file_name, label, kind) values ('X-sinrol.pdf','x','template')$$);
select pg_temp.expect_error('sin rol no se asigna un rol',
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000c001','admin')$$);
reset role;

-- ─── editor: flujo normal ───────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}';

insert into public.documents (id, file_name, label, kind, created_by) values
  ('10000000-0000-0000-0000-000000000001', 'Test-COA-LoteZZ-PDFforQrCode.pdf', 'Lote ZZ', 'template',
   '00000000-0000-0000-0000-00000000e001');
insert into public.document_versions
  (id, document_id, version, data, template_version, pdf_path, sha256, size_bytes,
   created_by, published_at, published_by)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1,
   '{"lot":"ZZ"}', 1, 'documents/10000000-0000-0000-0000-000000000001/v1.pdf',
   repeat('a', 64), 1234, '00000000-0000-0000-0000-00000000e001', now(),
   '00000000-0000-0000-0000-00000000e001');
update public.documents
   set published_version_id = '20000000-0000-0000-0000-000000000001', status = 'publicado'
 where id = '10000000-0000-0000-0000-000000000001';
set constraints all immediate;
set constraints all deferred;

select pg_temp.expect_count('editor ve su documento',
  $$select count(*) from public.documents where file_name = 'Test-COA-LoteZZ-PDFforQrCode.pdf'$$, 1);
select pg_temp.expect_count('editor ve la plantilla activa',
  'select count(*) from public.templates where active', 1);

-- Inmutabilidad
select pg_temp.expect_error('file_name es inmutable',
  $$update public.documents set file_name = 'Otro-PDFforQrCode.pdf'
     where id = '10000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_kept('editor no borra versiones',
  'delete from public.document_versions',
  'select count(*) from public.document_versions', 1);
select pg_temp.expect_error('una versión publicada no se modifica',
  $$update public.document_versions set sha256 = repeat('b', 64)
     where id = '20000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_kept('editor no borra documentos',
  'delete from public.documents',
  'select count(*) from public.documents', 1);
select pg_temp.expect_error('file_name con path traversal se rechaza',
  $$insert into public.documents (file_name, label, kind) values ('../x.pdf','x','template')$$);
select pg_temp.expect_error('file_name duplicado se rechaza',
  $$insert into public.documents (file_name, label, kind)
    values ('Test-COA-LoteZZ-PDFforQrCode.pdf','x','template')$$);
select pg_temp.expect_error('versión publicada sin PDF se rechaza',
  $$insert into public.document_versions (document_id, version, published_at)
    values ('10000000-0000-0000-0000-000000000001', 2, now())$$);

-- Borradores: una versión sin publicar sí se puede editar.
insert into public.document_versions (id, document_id, version, data, created_by) values
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 2,
   '{"lot":"ZZ","draft":true}', '00000000-0000-0000-0000-00000000e001');
update public.document_versions set data = '{"lot":"ZZ","draft":"editado"}'
 where id = '20000000-0000-0000-0000-000000000002';
select pg_temp.expect_count('el borrador se editó',
  $$select count(*) from public.document_versions
     where id = '20000000-0000-0000-0000-000000000002' and data->>'draft' = 'editado'$$, 1);

-- No se puede publicar un borrador sin PDF ni apuntar a la versión de otro documento.
select pg_temp.expect_error('published_version_id a un borrador se rechaza',
  $q$do $d$ begin
      update public.documents set published_version_id = '20000000-0000-0000-0000-000000000002'
       where id = '10000000-0000-0000-0000-000000000001';
      set constraints all immediate;
    end $d$$q$);
set constraints all deferred;

-- Permisos de admin
select pg_temp.expect_error('editor no crea plantillas',
  $$insert into public.templates (version) values (99)$$);
select pg_temp.expect_error('editor no asigna roles',
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000c001','editor')$$);
select pg_temp.expect_error('editor no escribe audit a nombre de otro',
  $$insert into public.audit_log (actor, action) values ('00000000-0000-0000-0000-00000000a001','publish')$$);
insert into public.audit_log (actor, action, document_id) values
  ('00000000-0000-0000-0000-00000000e001', 'publish', '10000000-0000-0000-0000-000000000001');
select pg_temp.expect_kept('editor no borra el audit log',
  'delete from public.audit_log', 'select count(*) from public.audit_log', 1);
reset role;

-- ─── admin ──────────────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}';
insert into public.templates (version) values (99);
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000c001', 'editor');
select pg_temp.expect_count('admin ve todos los roles', 'select count(*) from public.user_roles', 3);
reset role;

-- ─── Triggers aun sin RLS (como la service role del servidor) ──────────────
select pg_temp.expect_error('trigger: ninguna versión se borra, ni con service role',
  $$delete from public.document_versions where id = '20000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_error('trigger: un documento publicado no se borra, ni con service role',
  $$delete from public.documents where id = '10000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_error('trigger: file_name inmutable, ni con service role',
  $$update public.documents set file_name = 'Otro-PDFforQrCode.pdf'
     where id = '10000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_error('trigger: url_prefix inmutable, ni con service role',
  $$update public.documents set url_prefix = 'private-info'
     where id = '10000000-0000-0000-0000-000000000001'$$);
select pg_temp.expect_count('documento nuevo usa /coa/ por defecto',
  $$select count(*) from public.documents
     where id = '10000000-0000-0000-0000-000000000001' and url_prefix = 'coa'$$, 1);
select pg_temp.expect_error('url_prefix inválido se rechaza',
  $$insert into public.documents (file_name, label, kind, url_prefix)
    values ('otro.pdf','x','template','docs')$$);
select pg_temp.expect_error('trigger: audit_log de solo agregar, ni con service role',
  'delete from public.audit_log');

-- ─── Storage ────────────────────────────────────────────────────────────────
select pg_temp.expect_count('bucket coa-pdfs privado',
  $$select count(*) from storage.buckets where id = 'coa-pdfs' and public = false$$, 1);

do $$ begin raise notice 'OK: todos los chequeos de RLS y triggers pasaron'; end $$;

rollback;
