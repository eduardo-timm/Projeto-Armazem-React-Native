import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { SituacaoStock } from '../banco/banco';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../tema';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

type PropsBotao = {
  titulo: string;
  aoPressionar: () => void;
  icone?: NomeIcone;
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
};

/** Texto sempre alinhado à esquerda; o ícone vai no fim (no fantasma, antes do texto). */
export function Botao({
  titulo,
  aoPressionar,
  icone,
  variante = 'primario',
  carregando,
  desabilitado,
  estilo,
}: PropsBotao) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const paleta = {
    primario: {
      fundo: cores.primaria,
      pressionado: cores.primariaPressionada,
      frente: cores.textoSobrePrimaria,
      borda: cores.primaria,
    },
    secundario: { fundo: 'transparent', pressionado: cores.superficie, frente: cores.texto, borda: cores.divisor },
    perigo: { fundo: 'transparent', pressionado: cores.perigoFundo, frente: cores.primariaForte, borda: cores.divisor },
    fantasma: { fundo: 'transparent', pressionado: cores.superficie, frente: cores.primariaForte, borda: 'transparent' },
  }[variante];
  const fantasma = variante === 'fantasma';

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [
        estilos.botao,
        fantasma && estilos.botaoFantasma,
        {
          backgroundColor: pressed ? paleta.pressionado : paleta.fundo,
          borderColor: paleta.borda,
          opacity: desabilitado ? 0.45 : 1,
        },
        estilo,
      ]}>
      {fantasma && icone ? <Ionicons name={icone} size={18} color={paleta.frente} /> : null}
      <Text
        style={[estilos.textoBotao, { color: paleta.frente }, fantasma && { flex: 0 }]}
        numberOfLines={1}>
        {titulo}
      </Text>
      {carregando ? (
        <ActivityIndicator color={paleta.frente} />
      ) : !fantasma && icone ? (
        <Ionicons name={icone} size={20} color={paleta.frente} />
      ) : null}
    </Pressable>
  );
}

type PropsCampo = TextInputProps & {
  rotulo: string;
  icone?: NomeIcone;
  erro?: string;
};

export function Campo({ rotulo, icone, erro, style, onFocus, onBlur, ...propsInput }: PropsCampo) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const [focado, setFocado] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View
        style={[
          estilos.caixaCampo,
          focado && { borderColor: cores.primaria },
          erro && { borderColor: cores.primariaForte },
        ]}>
        {icone && <Ionicons name={icone} size={18} color={cores.textoSuave} />}
        <TextInput
          placeholderTextColor={cores.textoSuave}
          selectionColor={cores.primaria}
          style={[estilos.campo, style]}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          {...propsInput}
        />
      </View>
      {erro ? (
        <View style={estilos.linhaErro}>
          <Ionicons name="alert-circle" size={14} color={cores.primariaForte} />
          <Text style={estilos.erro}>{erro}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Rótulo pequeno em caixa alta que abre cada seção. */
export function Rotulo({ children, estilo }: { children: ReactNode; estilo?: StyleProp<TextStyle> }) {
  const estilos = useEstilos(criarEstilos);
  return <Text style={[estilos.rotuloSecao, estilo]}>{children}</Text>;
}

/** Linha forte (2px) entre seções. */
export function Divisor({ estilo }: { estilo?: StyleProp<ViewStyle> }) {
  const estilos = useEstilos(criarEstilos);
  return <View style={[estilos.divisor, estilo]} />;
}

function infoSituacao(situacao: SituacaoStock, cores: Tema['cores']) {
  return {
    ok: { rotulo: 'Em stock', frente: cores.texto, fundo: cores.superficieSuave },
    baixo: { rotulo: 'Stock baixo', frente: cores.alerta, fundo: cores.alertaFundo },
    esgotado: { rotulo: 'Esgotado', frente: cores.esgotadoTexto, fundo: cores.esgotadoFundo },
  }[situacao];
}

export function SeloSituacao({ situacao }: { situacao: SituacaoStock }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const info = infoSituacao(situacao, cores);
  return (
    <View style={[estilos.selo, { backgroundColor: info.fundo }]}>
      <Text style={[estilos.textoSelo, { color: info.frente }]}>{info.rotulo}</Text>
    </View>
  );
}

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  const estilos = useEstilos(criarEstilos);
  return <View style={[estilos.cartao, estilo]}>{children}</View>;
}

export function EstadoVazio({
  icone,
  titulo,
  mensagem,
  acao,
}: {
  icone: NomeIcone;
  titulo: string;
  mensagem: string;
  acao?: ReactNode;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.vazio}>
      <Ionicons name={icone} size={36} color={cores.primariaForte} />
      <Text style={estilos.tituloVazio}>{titulo}</Text>
      <Text style={estilos.mensagemVazio}>{mensagem}</Text>
      {acao}
    </View>
  );
}

/** Carregando (primeira vez) ou erro com botão para tentar de novo. */
export function EstadoCarregamento({
  erro,
  aoTentarDeNovo,
}: {
  erro: string | null;
  aoTentarDeNovo: () => void;
}) {
  const { cores } = useTema();
  if (!erro) {
    return (
      <View style={{ padding: espaco(10), alignItems: 'flex-start' }}>
        <ActivityIndicator color={cores.primaria} />
      </View>
    );
  }
  return (
    <EstadoVazio
      icone="cloud-offline-outline"
      titulo="Não foi possível carregar"
      mensagem={erro}
      acao={
        <Botao
          titulo="Tentar de novo"
          icone="refresh"
          aoPressionar={aoTentarDeNovo}
          estilo={{ marginTop: 10, alignSelf: 'stretch' }}
        />
      }
    />
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  botao: {
    height: 54,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    paddingHorizontal: espaco(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botaoFantasma: { height: 44, paddingHorizontal: espaco(1), alignSelf: 'flex-start', gap: 8 },
  textoBotao: { flex: 1, fontSize: 16, fontFamily: fonte.forte },
  rotulo: { fontSize: 12, fontFamily: fonte.media, color: cores.textoSuave },
  rotuloSecao: {
    fontSize: 11,
    fontFamily: fonte.media,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: cores.textoSuave,
  },
  divisor: { height: linha.forte, backgroundColor: cores.divisor },
  caixaCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: cores.divisor,
    borderRadius: raio.medio,
    paddingHorizontal: espaco(3),
    minHeight: 52,
  },
  campo: { flex: 1, fontSize: 16, fontFamily: fonte.normal, color: cores.texto, paddingVertical: 12 },
  linhaErro: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  erro: { color: cores.primariaForte, fontSize: 12, fontFamily: fonte.media },
  selo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.pequeno,
    alignSelf: 'flex-start',
  },
  textoSelo: { fontSize: 11, fontFamily: fonte.media, letterSpacing: 0.2 },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(5),
  },
  vazio: { alignItems: 'flex-start', padding: espaco(6), gap: 10 },
  tituloVazio: { fontSize: 22, fontFamily: fonte.forte, color: cores.texto },
  mensagemVazio: { fontSize: 14, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 20 },
});
