-- =============================================================================
-- Armazém: foto de perfil de cada pessoa
--
-- Uma linha por pessoa e por espaço. A foto fica no mesmo bucket privado das fotos dos
-- produtos, numa subpasta do espaço: equipe/perfis/<arquivo>.jpg (ou teste/perfis/...).
-- O RLS do Storage já libera só a pasta do espaço atual (ver 20260928120000_fotos_produtos).
-- Em `caminho_foto` guardamos só o caminho dentro do bucket (não uma URL).
-- =============================================================================

create table public.perfis (
  espaco text not null default public.espaco_atual()
    constraint perfis_espaco_valido check (espaco in ('equipe', 'teste')),
  usuario text not null
    constraint perfis_usuario_valido check (usuario in ('Eduardo', 'Tomás', 'Tiago', 'Teste')),
  caminho_foto text
    constraint perfis_caminho_foto_do_espaco
      check (caminho_foto is null or split_part(caminho_foto, '/', 1) = espaco),
  atualizado_em timestamptz not null default now(),
  primary key (espaco, usuario)
);

comment on table public.perfis is 'Foto de perfil de cada pessoa, por espaço.';
comment on column public.perfis.caminho_foto is
  'Caminho da foto no bucket fotos-produtos (ex.: equipe/perfis/abc123.jpg). Null = sem foto.';

create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

alter table public.perfis enable row level security;

create policy "Acesso pelo espaço atual - perfis"
  on public.perfis for all
  to anon, authenticated
  using (espaco = (select public.espaco_atual()))
  with check (espaco = (select public.espaco_atual()));
