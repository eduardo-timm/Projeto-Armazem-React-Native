-- =============================================================================
-- Armazém: foto do produto
--
-- A foto fica no Storage, no bucket PRIVADO `fotos-produtos`, numa pasta por espaço:
--   equipe/<arquivo>.jpg  ou  teste/<arquivo>.jpg
-- O RLS do Storage usa o mesmo `espaco_atual()` das tabelas (cabeçalhos x-codigo-equipe /
-- x-espaco), então cada espaço só lê, envia e apaga as fotos da própria pasta.
-- Em `produtos.caminho_foto` guardamos só o caminho dentro do bucket (não uma URL).
-- =============================================================================

alter table public.produtos
  add column caminho_foto text
    constraint produtos_caminho_foto_do_espaco
      check (caminho_foto is null or split_part(caminho_foto, '/', 1) = espaco);

comment on column public.produtos.caminho_foto is
  'Caminho da foto no bucket fotos-produtos (ex.: equipe/abc123.jpg). Null = sem foto.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-produtos', 'fotos-produtos', false, 5242880, array['image/jpeg']);

-- Sem política de UPDATE: cada foto nova ganha um nome novo (a antiga é apagada pelo app).
create policy "Fotos: ler do espaço atual"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'fotos-produtos'
    and (storage.foldername(name))[1] = (select public.espaco_atual())
  );

create policy "Fotos: enviar no espaço atual"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'fotos-produtos'
    and (storage.foldername(name))[1] = (select public.espaco_atual())
  );

create policy "Fotos: apagar do espaço atual"
  on storage.objects for delete
  to anon, authenticated
  using (
    bucket_id = 'fotos-produtos'
    and (storage.foldername(name))[1] = (select public.espaco_atual())
  );
