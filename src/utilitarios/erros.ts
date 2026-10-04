import { alertar } from './alerta';

type ErroComCodigo = { message?: string; code?: string };

/** Transforma erros do Supabase/rede em mensagens amigáveis em português. */
export function mensagemDeErro(erro: unknown): string {
  const { message = '', code } = (erro ?? {}) as ErroComCodigo;

  if (/network request failed|failed to fetch|fetch failed|network/i.test(message)) {
    return 'Sem conexão com a internet. Verifique e tente de novo.';
  }
  if (code === '23505' && /categorias/.test(message)) {
    return 'Já existe uma categoria com esse nome.';
  }
  if (code === '23505') return 'Já existe um produto com esse código de barras.';
  if (code === '23503' && /categoria/.test(message)) {
    return 'Essa categoria foi excluída. Escolha outra.';
  }
  if (code === '42501' || /row-level security/i.test(message)) {
    return 'Acesso negado. Saia e entre de novo com o código da equipe.';
  }
  return message || 'Algo deu errado. Tente de novo.';
}

export function mostrarErro(erro: unknown, titulo = 'Ops!') {
  alertar(titulo, mensagemDeErro(erro));
}
