-- =============================================================================
-- Armazém: acesso por código da equipe, espaço de teste e histórico de movimentações
--
-- Como funciona o acesso (sem login/senha):
--   * O app envia o cabeçalho HTTP `x-codigo-equipe` com o código digitado uma vez no celular.
--     Se o hash bater com o salvo em privado.configuracao → espaço 'equipe' (stock real).
--   * Ou envia `x-espaco: teste` → espaço 'teste' (stock separado, para apresentações).
--   * Sem nenhum dos dois → nenhum acesso.
-- Todas as linhas têm a coluna `espaco`, e o RLS só mostra/permite as do espaço atual.
-- =============================================================================

-- Configuração privada (fora do schema exposto pela API)
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.configuracao (
  chave text primary key,
  valor text not null
);

-- Normaliza o código: só letras/números, maiúsculo ("abcd-1234" == "ABCD1234")
create or replace function public.espaco_atual()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cabecalhos json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  codigo text := upper(regexp_replace(coalesce(cabecalhos->>'x-codigo-equipe', ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if codigo <> '' and exists (
    select 1
    from privado.configuracao
    where chave = 'hash_codigo_equipe'
      and valor = encode(extensions.digest(codigo, 'sha256'), 'hex')
  ) then
    return 'equipe';
  end if;

  if cabecalhos->>'x-espaco' = 'teste' then
    return 'teste';
  end if;

  return null;
end;
$$;

revoke all on function public.espaco_atual() from public;
grant execute on function public.espaco_atual() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- produtos
-- -----------------------------------------------------------------------------
alter table public.produtos
  add column espaco text not null default public.espaco_atual()
    constraint produtos_espaco_valido check (espaco in ('equipe', 'teste')),
  add column categoria text,
  add column quantidade_minima integer not null default 0
    constraint produtos_quantidade_minima_nao_negativa check (quantidade_minima >= 0),
  add constraint produtos_quantidade_nao_negativa check (quantidade >= 0);

-- Código de barras passa a ser opcional (cadastro manual) e único POR espaço
alter table public.produtos alter column codigo_barras drop not null;
alter table public.produtos drop constraint produtos_codigo_barras_key;
alter table public.produtos
  add constraint produtos_espaco_codigo_barras_key unique (espaco, codigo_barras);

create index if not exists produtos_espaco_nome_idx on public.produtos (espaco, nome);

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger produtos_atualizado_em
  before update on public.produtos
  for each row execute function public.tocar_atualizado_em();

-- -----------------------------------------------------------------------------
-- movimentacoes (histórico de entradas/saídas, com quem fez)
-- -----------------------------------------------------------------------------
alter table public.movimentacoes
  add column espaco text not null default public.espaco_atual()
    constraint movimentacoes_espaco_valido check (espaco in ('equipe', 'teste')),
  add column usuario text not null
    constraint movimentacoes_usuario_valido check (usuario in ('Eduardo', 'Tomás', 'Tiago', 'Teste'));

create index if not exists movimentacoes_produto_criado_idx
  on public.movimentacoes (produto_id, criado_em desc);

-- -----------------------------------------------------------------------------
-- RLS: troca o acesso aberto a qualquer um pelo acesso por espaço
-- -----------------------------------------------------------------------------
drop policy if exists "Permitir acesso ao app - produtos" on public.produtos;
drop policy if exists "Permitir acesso ao app - movimentacoes" on public.movimentacoes;

create policy "Acesso pelo espaço atual - produtos"
  on public.produtos for all
  to anon, authenticated
  using (espaco = (select public.espaco_atual()))
  with check (espaco = (select public.espaco_atual()));

create policy "Acesso pelo espaço atual - movimentacoes"
  on public.movimentacoes for all
  to anon, authenticated
  using (espaco = (select public.espaco_atual()))
  with check (espaco = (select public.espaco_atual()));

-- -----------------------------------------------------------------------------
-- RPCs usadas pelo app (security invoker: o RLS acima continua valendo)
-- -----------------------------------------------------------------------------

-- Entrada/saída atômica: atualiza a quantidade e grava o histórico juntos.
create or replace function public.registrar_movimentacao(
  p_produto_id uuid,
  p_tipo text,
  p_quantidade integer,
  p_usuario text
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  atual integer;
  nova integer;
begin
  if p_tipo not in ('entrada', 'saida') then
    raise exception 'Tipo de movimentação inválido';
  end if;
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade precisa ser maior que zero';
  end if;

  select quantidade into atual
  from public.produtos
  where id = p_produto_id
  for update;

  if not found then
    raise exception 'Produto não encontrado';
  end if;
  if p_tipo = 'saida' and atual < p_quantidade then
    raise exception 'Stock insuficiente: só há % unidade(s)', atual;
  end if;

  update public.produtos
  set quantidade = quantidade + case when p_tipo = 'entrada' then p_quantidade else -p_quantidade end
  where id = p_produto_id
  returning quantidade into nova;

  insert into public.movimentacoes (produto_id, tipo, quantidade, usuario)
  values (p_produto_id, p_tipo, p_quantidade, p_usuario);

  return nova;
end;
$$;

revoke all on function public.registrar_movimentacao(uuid, text, integer, text) from public;
grant execute on function public.registrar_movimentacao(uuid, text, integer, text) to anon, authenticated;

-- Resumo da tela inicial (só do espaço atual, por causa do RLS)
create or replace function public.resumo_stock()
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  select json_build_object(
    'totalProdutos', count(*),
    'totalUnidades', coalesce(sum(quantidade), 0),
    'stockBaixo', count(*) filter (where quantidade > 0 and quantidade <= quantidade_minima),
    'esgotados', count(*) filter (where quantidade <= 0),
    'valorTotal', coalesce(sum(quantidade * preco_unitario), 0)
  )
  from public.produtos;
$$;

revoke all on function public.resumo_stock() from public;
grant execute on function public.resumo_stock() to anon, authenticated;
