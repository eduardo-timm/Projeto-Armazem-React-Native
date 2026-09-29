import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { apagarFoto, enviarFoto, listarFotosPerfil, salvarFotoPerfil } from './banco/banco';
import type { ClienteSupabase } from './banco/supabase';
import { useSessao, type Usuario } from './sessao';

type Fotos = Partial<Record<Usuario, string>>;

type ValorPerfis = {
  /** Caminho no Storage da foto de perfil da pessoa, ou null se ela não tiver foto. */
  fotoDe: (usuario: Usuario) => string | null;
  /** Busca de novo as fotos de todos (ex.: no "puxar para atualizar"). */
  recarregar: () => Promise<void>;
  /** Envia uma foto local (de `escolherFoto`) como foto de perfil, ou remove com null. */
  trocarFoto: (usuario: Usuario, uriLocal: string | null) => Promise<void>;
};

const SEM_FOTOS: Fotos = {};

const ContextoPerfis = createContext<ValorPerfis | null>(null);

/**
 * Fotos de perfil da equipe, compartilhadas por todos (tabela `perfis` no Supabase).
 * Fica dentro do ProvedorSessao: carrega ao entrar, ao voltar do segundo plano e no `recarregar`.
 */
export function ProvedorPerfis({ children }: { children: ReactNode }) {
  const { db, acesso } = useSessao();
  // Guarda de qual cliente vieram as fotos: ao trocar de espaço (equipe/teste) elas somem na hora.
  const [carregadas, setCarregadas] = useState<{ db: ClienteSupabase | null; fotos: Fotos }>({
    db: null,
    fotos: {},
  });
  const fotos = carregadas.db === db ? carregadas.fotos : SEM_FOTOS;

  const recarregar = useCallback(async () => {
    if (!db) return;
    // Sem internet: os avatares continuam com a inicial (ou com a última foto carregada).
    await listarFotosPerfil(db).then((novas) => setCarregadas({ db, fotos: novas }), () => {});
  }, [db]);

  useEffect(() => {
    if (!db) return;
    let ativo = true;
    const buscar = () =>
      listarFotosPerfil(db).then(
        (novas) => ativo && setCarregadas({ db, fotos: novas }),
        () => {}
      );
    buscar();
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') buscar();
    });
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, [db]);

  const trocarFoto = useCallback(
    async (usuario: Usuario, uriLocal: string | null) => {
      if (!db || !acesso) return;
      const antiga = fotos[usuario] ?? null;
      const nova = uriLocal ? await enviarFoto(db, acesso, uriLocal, 'perfis') : null;
      try {
        await salvarFotoPerfil(db, usuario, nova);
      } catch (e) {
        void apagarFoto(db, nova);
        throw e;
      }
      setCarregadas((atuais) => {
        const proximas = atuais.db === db ? { ...atuais.fotos } : {};
        if (nova) proximas[usuario] = nova;
        else delete proximas[usuario];
        return { db, fotos: proximas };
      });
      void apagarFoto(db, antiga);
    },
    [db, acesso, fotos]
  );

  const fotoDe = useCallback((usuario: Usuario) => fotos[usuario] ?? null, [fotos]);

  const valor = useMemo(
    () => ({ fotoDe, recarregar, trocarFoto }),
    [fotoDe, recarregar, trocarFoto]
  );

  return <ContextoPerfis.Provider value={valor}>{children}</ContextoPerfis.Provider>;
}

export function usePerfis() {
  const contexto = useContext(ContextoPerfis);
  if (!contexto) throw new Error('usePerfis precisa estar dentro de <ProvedorPerfis>');
  return contexto;
}
