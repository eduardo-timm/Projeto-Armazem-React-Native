import Armazenamento from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { criarClienteSupabase, type Acesso, type ClienteSupabase } from './banco/supabase';
import { mensagemDeErro } from './utilitarios/erros';

export const USUARIOS_EQUIPE = ['Eduardo', 'Tomás', 'Tiago'] as const;
export type Usuario = (typeof USUARIOS_EQUIPE)[number] | 'Teste';

const CHAVE_ACESSO = 'sessao-acesso';
const CHAVE_USUARIO = 'sessao-usuario';

function ler<T>(chave: string): T | null {
  try {
    const valor = Armazenamento.getItemSync(chave);
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown) {
  if (valor === null) Armazenamento.removeItemSync(chave);
  else Armazenamento.setItemSync(chave, JSON.stringify(valor));
}

type ValorSessao = {
  /** null = ainda não digitou o código nem escolheu o modo teste neste celular */
  acesso: Acesso | null;
  /** Quem está usando agora (no modo teste é sempre "Teste") */
  usuario: Usuario | null;
  /** Cliente do Supabase já configurado para o acesso atual */
  db: ClienteSupabase | null;
  /** Valida o código no banco e, se estiver certo, salva neste celular. Lança erro se inválido. */
  entrarComCodigo: (codigo: string) => Promise<void>;
  entrarComoTeste: () => void;
  escolherUsuario: (usuario: Usuario) => void;
  trocarUsuario: () => void;
  /** Esquece o código/modo teste deste celular. */
  sair: () => void;
};

const ContextoSessao = createContext<ValorSessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [acesso, setAcesso] = useState<Acesso | null>(() => ler<Acesso>(CHAVE_ACESSO));
  const [usuarioSalvo, setUsuarioSalvo] = useState<Usuario | null>(() => ler<Usuario>(CHAVE_USUARIO));

  const db = useMemo(() => (acesso ? criarClienteSupabase(acesso) : null), [acesso]);
  const usuario: Usuario | null = acesso?.tipo === 'teste' ? 'Teste' : usuarioSalvo;

  const entrarComCodigo = useCallback(async (codigo: string) => {
    const acessoNovo: Acesso = { tipo: 'equipe', codigo: codigo.trim().toUpperCase() };
    const { data, error } = await criarClienteSupabase(acessoNovo).rpc('espaco_atual');
    if (error) throw new Error(mensagemDeErro(error));
    if (data !== 'equipe') throw new Error('Código da equipe incorreto. Confira e tente de novo.');
    gravar(CHAVE_ACESSO, acessoNovo);
    setAcesso(acessoNovo);
  }, []);

  const entrarComoTeste = useCallback(() => {
    const acessoNovo: Acesso = { tipo: 'teste' };
    gravar(CHAVE_ACESSO, acessoNovo);
    setAcesso(acessoNovo);
  }, []);

  const escolherUsuario = useCallback((novo: Usuario) => {
    gravar(CHAVE_USUARIO, novo);
    setUsuarioSalvo(novo);
  }, []);

  const trocarUsuario = useCallback(() => {
    gravar(CHAVE_USUARIO, null);
    setUsuarioSalvo(null);
  }, []);

  const sair = useCallback(() => {
    gravar(CHAVE_ACESSO, null);
    gravar(CHAVE_USUARIO, null);
    setAcesso(null);
    setUsuarioSalvo(null);
  }, []);

  const valor = useMemo(
    () => ({
      acesso,
      usuario,
      db,
      entrarComCodigo,
      entrarComoTeste,
      escolherUsuario,
      trocarUsuario,
      sair,
    }),
    [acesso, usuario, db, entrarComCodigo, entrarComoTeste, escolherUsuario, trocarUsuario, sair]
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao() {
  const contexto = useContext(ContextoSessao);
  if (!contexto) throw new Error('useSessao precisa estar dentro de <ProvedorSessao>');
  return contexto;
}

/**
 * Para telas que só abrem depois do "Quem é você?" (as rotas protegidas do _layout).
 * Garante que `db` e `usuario` existem.
 */
export function useSessaoAtiva() {
  const sessao = useSessao();
  if (!sessao.db || !sessao.usuario || !sessao.acesso) {
    throw new Error('useSessaoAtiva usado fora das telas protegidas');
  }
  return { ...sessao, db: sessao.db, usuario: sessao.usuario, acesso: sessao.acesso };
}
