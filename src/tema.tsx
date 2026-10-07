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

/**
 * Paleta "Modernist": tinta sobre fundo claro e um único vermelho de destaque.
 * O vermelho é para a ação principal e pequenas ênfases; o resto é tinta e linhas.
 */
const coresClaras = {
  primaria: '#EC3013',
  /** Fundo de blocos vermelhos grandes (contraste melhor com texto branco). */
  primariaEscura: '#DD2B0F',
  primariaPressionada: '#AE1800',
  /** Vermelho para TEXTO e ícones pequenos sobre o fundo (legível). */
  primariaForte: '#AE1800',
  destaque: '#EC3013',
  // Mantidos para quem ainda usa LinearGradient: agora são cor chapada.
  gradiente: ['#DD2B0F', '#DD2B0F'] as Gradiente,
  gradienteScanner: ['#DD2B0F', '#DD2B0F'] as Gradiente,

  fundo: '#F3F2F2',
  superficie: '#EAE9E9',
  superficieSuave: '#EAE7E7',
  /** Linha fina (1px) entre itens. */
  borda: '#C9C8C7',
  /** Linha forte (2px) entre seções. */
  divisor: '#A09E9D',

  texto: '#201E1D',
  textoSuave: '#605D5D',
  textoSobrePrimaria: '#FFFFFF',

  sucesso: '#201E1D',
  sucessoFundo: '#EAE7E7',
  alerta: '#7C1405',
  alertaFundo: '#FFF2EF',
  perigo: '#AE1800',
  perigoFundo: '#FFE0D9',
  esgotadoFundo: '#AE1800',
  esgotadoTexto: '#FFFFFF',
};

export type Cores = typeof coresClaras;

const coresEscuras: Cores = {
  primaria: '#EC3013',
  primariaEscura: '#DD2B0F',
  primariaPressionada: '#AE1800',
  primariaForte: '#FF9783',
  destaque: '#EC3013',
  gradiente: ['#DD2B0F', '#DD2B0F'],
  gradienteScanner: ['#DD2B0F', '#DD2B0F'],

  fundo: '#181716',
  superficie: '#262422',
  superficieSuave: '#2D2B2B',
  borda: '#3E3B3A',
  divisor: '#6E6B6A',

  texto: '#F3F2F2',
  textoSuave: '#BAB6B6',
  textoSobrePrimaria: '#FFFFFF',

  sucesso: '#F3F2F2',
  sucessoFundo: '#2D2B2B',
  alerta: '#FFC4B8',
  alertaFundo: '#4D170E',
  perigo: '#FF9783',
  perigoFundo: '#4D170E',
  esgotadoFundo: '#EC3013',
  esgotadoTexto: '#FFFFFF',
};

/** Cantos "suaves". Para voltar ao visual reto do Modernist, zere os três primeiros. */
export const raio = { pequeno: 6, medio: 10, grande: 16, pilula: 999 };

/** Espessura das linhas: fina entre itens, forte entre seções. */
export const linha = { fina: 1, forte: 2 };

/** Archivo (carregada no _layout). Com fonte personalizada não use fontWeight. */
export const fonte = {
  normal: 'Archivo_400Regular',
  media: 'Archivo_600SemiBold',
  forte: 'Archivo_800ExtraBold',
} as const;

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

// Nada "flutua" neste visual: a sombra é mínima e só aparece em painéis por cima da tela.
const TEMAS: Record<Esquema, Tema> = {
  claro: {
    esquema: 'claro',
    cores: coresClaras,
    sombra: {
      shadowColor: '#2D2B2B',
      shadowOpacity: 0.14,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  },
  escuro: {
    esquema: 'escuro',
    cores: coresEscuras,
    sombra: {
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
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
