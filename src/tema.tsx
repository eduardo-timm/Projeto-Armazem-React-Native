import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import { Armazenamento } from './utilitarios/armazenamento';

type Gradiente = readonly [string, string];

const coresClaras = {
  primaria: '#3E8E68',
  primariaEscura: '#2F7354',
  destaque: '#7FD1A8',
  gradiente: ['#3A8763', '#5D9C7B'] as Gradiente,
  gradienteScanner: ['#3B8A87', '#4A7FA0'] as Gradiente,

  fundo: '#F3F6F4',
  superficie: '#FFFFFF',
  superficieSuave: '#E9EFEB',
  borda: '#DCE4DF',

  texto: '#16231C',
  textoSuave: '#63746A',
  textoSobrePrimaria: '#FFFFFF',

  sucesso: '#16A34A',
  sucessoFundo: '#DCFCE7',
  alerta: '#D97706',
  alertaFundo: '#FEF3C7',
  perigo: '#DC2626',
  perigoFundo: '#FEE2E2',
};

export type Cores = typeof coresClaras;

const coresEscuras: Cores = {
  primaria: '#4FA27B',
  primariaEscura: '#3E8E68',
  destaque: '#8EDCB4',
  gradiente: ['#2F6E52', '#46836A'],
  gradienteScanner: ['#2E6F6D', '#3A6485'],

  fundo: '#0E1411',
  superficie: '#161E1A',
  superficieSuave: '#1F2A24',
  borda: '#2A3730',

  texto: '#EEF3F0',
  textoSuave: '#9AABA1',
  textoSobrePrimaria: '#FFFFFF',

  sucesso: '#4ADE80',
  sucessoFundo: 'rgba(74,222,128,0.15)',
  alerta: '#FBBF24',
  alertaFundo: 'rgba(251,191,36,0.15)',
  perigo: '#F87171',
  perigoFundo: 'rgba(248,113,113,0.15)',
};

export const raio = { pequeno: 10, medio: 16, grande: 24, pilula: 999 };

/** Escala de espaçamento em múltiplos de 4 (espaco(4) = 16). */
export const espaco = (n: number) => n * 4;

export type Esquema = 'claro' | 'escuro';
/** O que o usuário escolheu. "sistema" segue o modo do celular. */
export type PreferenciaTema = 'sistema' | Esquema;

export type Tema = {
  esquema: Esquema;
  cores: Cores;
  sombra: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
    elevation: number;
  };
};

const TEMAS: Record<Esquema, Tema> = {
  claro: {
    esquema: 'claro',
    cores: coresClaras,
    sombra: {
      shadowColor: '#1C3327',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },
  escuro: {
    esquema: 'escuro',
    cores: coresEscuras,
    sombra: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
};

const CHAVE_PREFERENCIA = 'preferencia-tema';

function lerPreferenciaSalva(): PreferenciaTema {
  try {
    const salvo = Armazenamento.getItemSync(CHAVE_PREFERENCIA);
    if (salvo === 'claro' || salvo === 'escuro' || salvo === 'sistema') return salvo;
  } catch {
    // Sem preferência salva: segue o sistema.
  }
  return 'sistema';
}

/** Força o modo em tudo que é nativo (alertas, teclado, barra de status) ou volta a seguir o sistema. */
function aplicarNoSistema(preferencia: PreferenciaTema) {
  // Na web não existe setColorScheme; lá o tema é só o do app (calculado no ProvedorTema).
  if (Platform.OS === 'web') return;
  Appearance.setColorScheme(
    preferencia === 'sistema' ? 'unspecified' : preferencia === 'claro' ? 'light' : 'dark'
  );
}

type ValorContexto = Tema & {
  preferencia: PreferenciaTema;
  definirPreferencia: (p: PreferenciaTema) => void;
  alternarEsquema: () => void;
};

const ContextoTema = createContext<ValorContexto | null>(null);

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferenciaSalva);

  useEffect(() => {
    aplicarNoSistema(preferencia);
  }, [preferencia]);

  // Com setColorScheme aplicado, useColorScheme já devolve o modo efetivo.
  const esquemaSistema = useColorScheme();
  const esquema: Esquema =
    preferencia === 'sistema' ? (esquemaSistema === 'dark' ? 'escuro' : 'claro') : preferencia;

  const definirPreferencia = useCallback((p: PreferenciaTema) => {
    setPreferencia(p);
    Armazenamento.setItemSync(CHAVE_PREFERENCIA, p);
  }, []);

  const alternarEsquema = useCallback(
    () => definirPreferencia(esquema === 'escuro' ? 'claro' : 'escuro'),
    [esquema, definirPreferencia]
  );

  const valor = useMemo(
    () => ({ ...TEMAS[esquema], preferencia, definirPreferencia, alternarEsquema }),
    [esquema, preferencia, definirPreferencia, alternarEsquema]
  );

  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export function useTema() {
  const contexto = useContext(ContextoTema);
  if (!contexto) throw new Error('useTema precisa estar dentro de <ProvedorTema>');
  return contexto;
}

/**
 * Cria os estilos da tela a partir do tema atual e recria só quando o tema muda.
 * Uso: declare `const criarEstilos = (t: Tema) => StyleSheet.create({...})` FORA do componente
 * e dentro dele chame `const estilos = useEstilos(criarEstilos)`.
 */
export function useEstilos<T>(criar: (tema: Tema) => T): T {
  const tema = useTema();
  return useMemo(() => criar(tema), [criar, tema]);
}
