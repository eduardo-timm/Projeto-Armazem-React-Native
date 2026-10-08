-- =============================================================================
-- Armazém: lista de compras (e anotações) compartilhada pela equipe
--
-- Uma linha por item, separada por espaço (equipe / teste) com o mesmo RLS das outras tabelas.
-- Cada item tem um texto curto ("Arroz 5 kg"), uma anotação opcional ("marca X, só se estiver
-- em promoção") e pode ser marcado como comprado. Guardamos quem adicionou e quem marcou.
-- =============================================================================

create table public.itens_lista (
  id uuid primary key default gen_random_uuid(),
  espaco text not null default public.espaco_atual()
    constraint itens_lista_espaco_valido check (espaco in ('equipe', 'teste')),
  texto text not null
    constraint itens_lista_texto_valido check (texto = btrim(texto) and char_length(texto) between 1 and 120),
  anotacao text
    constraint itens_lista_anotacao_valida check (anotacao is null or char_length(anotacao) between 1 and 500),
  comprado boolean not null default false,
  criado_por text not null
    constraint itens_lista_criado_por_valido check (criado_por in ('Eduardo', 'Tomás', 'Tiago', 'Teste')),
  comprado_por text
    constraint itens_lista_comprado_por_valido check (comprado_por in ('Eduardo', 'Tomás', 'Tiago', 'Teste')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.itens_lista is 'Lista de compras e anotações da equipe, por espaço.';
comment on column public.itens_lista.comprado_por is 'Quem marcou como comprado. Null = ainda não comprado.';

create index itens_lista_espaco_idx on public.itens_lista (espaco, comprado, criado_em);

create trigger itens_lista_atualizado_em
  before update on public.itens_lista
  for each row execute function public.tocar_atualizado_em();

alter table public.itens_lista enable row level security;

create policy "Acesso pelo espaço atual - itens_lista"
  on public.itens_lista for all
  to anon, authenticated
  using (espaco = (select public.espaco_atual()))
  with check (espaco = (select public.espaco_atual()));
