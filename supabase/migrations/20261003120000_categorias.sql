-- =============================================================================
-- Armazém: categorias cadastradas (escolher da lista em vez de digitar)
--
-- Uma linha por categoria e por espaço. O produto continua guardando o NOME da categoria em
-- `produtos.categoria`, mas agora com chave estrangeira (espaco, categoria) → categorias:
--   * renomear a categoria atualiza todos os produtos dela (on update cascade);
--   * excluir a categoria deixa os produtos dela sem categoria (on delete set null).
-- Nomes iguais ignorando maiúsculas ("Água" e "água") não são permitidos no mesmo espaço.
-- =============================================================================

create table public.categorias (
  espaco text not null default public.espaco_atual()
    constraint categorias_espaco_valido check (espaco in ('equipe', 'teste')),
  nome text not null
    constraint categorias_nome_valido check (nome = btrim(nome) and char_length(nome) between 1 and 40),
  criado_em timestamptz not null default now(),
  primary key (espaco, nome)
);

comment on table public.categorias is 'Categorias de produto, por espaço.';

create unique index categorias_espaco_nome_minusculo_key on public.categorias (espaco, lower(nome));

alter table public.categorias enable row level security;

create policy "Acesso pelo espaço atual - categorias"
  on public.categorias for all
  to anon, authenticated
  using (espaco = (select public.espaco_atual()))
  with check (espaco = (select public.espaco_atual()));

-- Categorias que já estavam digitadas nos produtos viram categorias cadastradas.
update public.produtos set categoria = nullif(btrim(categoria), '') where categoria is not null;

insert into public.categorias (espaco, nome)
select distinct on (espaco, lower(categoria)) espaco, categoria
from public.produtos
where categoria is not null
order by espaco, lower(categoria), categoria
on conflict do nothing;

-- Grafias diferentes da mesma categoria ("agua"/"Agua") passam a usar o nome cadastrado.
update public.produtos p
set categoria = c.nome
from public.categorias c
where c.espaco = p.espaco
  and lower(c.nome) = lower(p.categoria)
  and p.categoria <> c.nome;

alter table public.produtos
  add constraint produtos_categoria_fkey
    foreign key (espaco, categoria) references public.categorias (espaco, nome)
    on update cascade
    on delete set null (categoria);

create index produtos_espaco_categoria_idx on public.produtos (espaco, categoria);
