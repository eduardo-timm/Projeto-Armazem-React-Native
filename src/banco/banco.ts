import type { Usuario } from '../sessao';
import { mensagemDeErro } from '../utilitarios/erros';
import { BUCKET_FOTOS, espacoDoAcesso, type Acesso, type ClienteSupabase } from './supabase';
import type { Database } from './tipos-supabase';

export type Produto = Database['public']['Tables']['produtos']['Row'];
export type Movimentacao = Database['public']['Tables']['movimentacoes']['Row'];
export type TipoMovimentacao = 'entrada' | 'saida';

export type DadosProduto = {
  nome: string;
  codigo_barras: string | null;
  categoria: string | null;
  descricao: string | null;
  quantidade_minima: number;
  preco_unitario: number;
  /** Caminho da foto no Storage (ver `enviarFoto`). null = sem foto. */
  caminho_foto: string | null;
};

export type SituacaoStock = 'ok' | 'baixo' | 'esgotado';

export type ResumoStock = {
  totalProdutos: number;
  totalUnidades: number;
  stockBaixo: number;
  esgotados: number;
  valorTotal: number;
};

/** Resposta do Supabase: devolve os dados ou lança um erro com mensagem amigável. */
function verificar<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw new Error(mensagemDeErro(error));
  return data;
}

function limpar(dados: DadosProduto) {
  return {
    nome: dados.nome.trim(),
    codigo_barras: dados.codigo_barras?.trim() || null,
    categoria: dados.categoria?.trim() || null,
    descricao: dados.descricao?.trim() || null,
    quantidade_minima: dados.quantidade_minima,
    preco_unitario: dados.preco_unitario,
    caminho_foto: dados.caminho_foto,
  };
}

export function obterSituacao(p: Pick<Produto, 'quantidade' | 'quantidade_minima'>): SituacaoStock {
  if (p.quantidade <= 0) return 'esgotado';
  if (p.quantidade <= p.quantidade_minima) return 'baixo';
  return 'ok';
}

/** Todos os produtos do espaço atual. A pesquisa é feita no celular (ver `combinaComPesquisa`). */
export async function listarProdutos(db: ClienteSupabase) {
  return verificar(await db.from('produtos').select('*').order('nome'));
}

/** Texto sem acentos e em minúsculas, para pesquisas ("Feijão" → "feijao"). */
export function normalizarTexto(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Pesquisa sem diferenciar maiúsculas nem acentos ("feijao" encontra "Feijão"). */
export function combinaComPesquisa(produto: Produto, pesquisa: string) {
  const termo = normalizarTexto(pesquisa.trim());
  if (!termo) return true;
  return [produto.nome, produto.codigo_barras, produto.categoria].some(
    (campo) => campo && normalizarTexto(campo).includes(termo)
  );
}

export async function buscarProduto(db: ClienteSupabase, id: string) {
  return verificar(await db.from('produtos').select('*').eq('id', id).maybeSingle());
}

export async function buscarPorCodigo(db: ClienteSupabase, codigo: string) {
  return verificar(
    await db.from('produtos').select('*').eq('codigo_barras', codigo.trim()).maybeSingle()
  );
}

/** Cria o produto e, se tiver quantidade inicial, registra como entrada no histórico. */
export async function criarProduto(
  db: ClienteSupabase,
  dados: DadosProduto,
  quantidadeInicial: number,
  usuario: Usuario
) {
  const produto = verificar(
    await db.from('produtos').insert(limpar(dados)).select('id').single()
  );
  if (!produto) throw new Error('Não foi possível criar o produto.');
  if (quantidadeInicial > 0) {
    await registrarMovimentacao(db, produto.id, 'entrada', quantidadeInicial, usuario);
  }
  return produto.id;
}

/** Atualiza os dados do produto. A quantidade só muda por entrada/saída (fica no histórico). */
export async function atualizarProduto(db: ClienteSupabase, id: string, dados: DadosProduto) {
  verificar(await db.from('produtos').update(limpar(dados)).eq('id', id));
}

/** Entrada ou saída atômica no banco. Devolve a nova quantidade. */
export async function registrarMovimentacao(
  db: ClienteSupabase,
  produtoId: string,
  tipo: TipoMovimentacao,
  quantidade: number,
  usuario: Usuario
) {
  return verificar(
    await db.rpc('registrar_movimentacao', {
      p_produto_id: produtoId,
      p_tipo: tipo,
      p_quantidade: quantidade,
      p_usuario: usuario,
    })
  );
}

export async function listarMovimentacoes(db: ClienteSupabase, produtoId: string, limite = 20) {
  return verificar(
    await db
      .from('movimentacoes')
      .select('*')
      .eq('produto_id', produtoId)
      .order('criado_em', { ascending: false })
      .limit(limite)
  ) as Movimentacao[];
}

/** Exclui o produto (o histórico vai junto) e depois a foto dele no Storage. */
export async function excluirProduto(db: ClienteSupabase, id: string) {
  const excluidos = verificar(
    await db.from('produtos').delete().eq('id', id).select('caminho_foto')
  );
  for (const { caminho_foto } of excluidos ?? []) void apagarFoto(db, caminho_foto);
}

/**
 * Envia uma foto local (JPEG já reduzido por `escolherFoto`) para a pasta do espaço atual
 * (ou para uma subpasta dela, ex.: "perfis"). Devolve o caminho a salvar em `caminho_foto`.
 * Cada envio ganha um nome novo, assim o cache das imagens nunca mostra uma foto antiga.
 */
export async function enviarFoto(
  db: ClienteSupabase,
  acesso: Acesso,
  uriLocal: string,
  subpasta?: string
) {
  const nome = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const pasta = subpasta ? `${espacoDoAcesso(acesso)}/${subpasta}` : espacoDoAcesso(acesso);
  const caminho = `${pasta}/${nome}`;
  const conteudo = await fetch(uriLocal).then((resposta) => resposta.arrayBuffer());
  verificar(
    await db.storage.from(BUCKET_FOTOS).upload(caminho, conteudo, { contentType: 'image/jpeg' })
  );
  return caminho;
}

/** Apaga uma foto do Storage. Não lança erro: se falhar, o arquivo só fica sobrando lá. */
export async function apagarFoto(db: ClienteSupabase, caminho: string | null) {
  if (!caminho) return;
  try {
    await db.storage.from(BUCKET_FOTOS).remove([caminho]);
  } catch {
    // Ignorado de propósito (ver acima).
  }
}

/** Caminho da foto de perfil de cada pessoa do espaço atual (quem não tem foto não aparece). */
export async function listarFotosPerfil(db: ClienteSupabase) {
  const perfis = verificar(await db.from('perfis').select('usuario, caminho_foto'));
  const fotos: Partial<Record<Usuario, string>> = {};
  for (const { usuario, caminho_foto } of perfis ?? []) {
    if (caminho_foto) fotos[usuario as Usuario] = caminho_foto;
  }
  return fotos;
}

/** Salva (ou remove, com null) o caminho da foto de perfil da pessoa. */
export async function salvarFotoPerfil(
  db: ClienteSupabase,
  usuario: Usuario,
  caminho: string | null
) {
  verificar(
    await db
      .from('perfis')
      .upsert({ usuario, caminho_foto: caminho }, { onConflict: 'espaco,usuario' })
  );
}

export type Categoria = { nome: string; totalProdutos: number };

/** Categorias do espaço atual (em ordem alfabética), com quantos produtos cada uma tem. */
export async function listarCategorias(db: ClienteSupabase): Promise<Categoria[]> {
  const linhas = verificar(await db.from('categorias').select('nome, produtos(count)'));
  return (linhas ?? [])
    .map(({ nome, produtos }) => ({ nome, totalProdutos: produtos[0]?.count ?? 0 }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

/** Cria a categoria e devolve o nome salvo. */
export async function criarCategoria(db: ClienteSupabase, nome: string) {
  const criada = verificar(
    await db.from('categorias').insert({ nome: nome.trim() }).select('nome').single()
  );
  if (!criada) throw new Error('Não foi possível criar a categoria.');
  return criada.nome;
}

/** Renomeia a categoria. Os produtos dela passam a usar o nome novo (on update cascade). */
export async function renomearCategoria(db: ClienteSupabase, nomeAtual: string, nomeNovo: string) {
  verificar(await db.from('categorias').update({ nome: nomeNovo.trim() }).eq('nome', nomeAtual));
  return nomeNovo.trim();
}

/** Exclui a categoria. Os produtos dela ficam sem categoria (on delete set null). */
export async function excluirCategoria(db: ClienteSupabase, nome: string) {
  verificar(await db.from('categorias').delete().eq('nome', nome));
}

export type ItemLista = Database['public']['Tables']['itens_lista']['Row'];

/** Itens da lista de compras: primeiro os que faltam comprar, depois os comprados. */
export async function listarItensLista(db: ClienteSupabase) {
  return verificar(
    await db
      .from('itens_lista')
      .select('*')
      .order('comprado')
      .order('criado_em', { ascending: true })
  );
}

export async function criarItemLista(
  db: ClienteSupabase,
  texto: string,
  anotacao: string | null,
  usuario: Usuario
) {
  const criado = verificar(
    await db
      .from('itens_lista')
      .insert({ texto: texto.trim(), anotacao: anotacao?.trim() || null, criado_por: usuario })
      .select('*')
      .single()
  );
  if (!criado) throw new Error('Não foi possível adicionar o item.');
  return criado;
}

export async function editarItemLista(
  db: ClienteSupabase,
  id: string,
  texto: string,
  anotacao: string | null
) {
  verificar(
    await db
      .from('itens_lista')
      .update({ texto: texto.trim(), anotacao: anotacao?.trim() || null })
      .eq('id', id)
  );
}

/** Marca ou desmarca como comprado (guardando quem marcou). */
export async function marcarItemLista(
  db: ClienteSupabase,
  id: string,
  comprado: boolean,
  usuario: Usuario
) {
  verificar(
    await db
      .from('itens_lista')
      .update({ comprado, comprado_por: comprado ? usuario : null })
      .eq('id', id)
  );
}

export async function excluirItemLista(db: ClienteSupabase, id: string) {
  verificar(await db.from('itens_lista').delete().eq('id', id));
}

/** Apaga de uma vez todos os itens já comprados. */
export async function limparItensComprados(db: ClienteSupabase) {
  verificar(await db.from('itens_lista').delete().eq('comprado', true));
}

export async function obterResumo(db: ClienteSupabase): Promise<ResumoStock> {
  return verificar(await db.rpc('resumo_stock')) as ResumoStock;
}
