import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import type { SituacaoStock } from '../banco/banco';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';

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
    primario: { fundo: cores.primaria, frente: cores.textoSobrePrimaria },
    secundario: { fundo: cores.superficieSuave, frente: cores.texto },
    perigo: { fundo: cores.perigoFundo, frente: cores.perigo },
    fantasma: { fundo: 'transparent', frente: cores.primaria },
  }[variante];

  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado || carregando}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: paleta.fundo, opacity: desabilitado ? 0.5 : pressed ? 0.85 : 1 },
        pressed && { transform: [{ scale: 0.98 }] },
        estilo,
      ]}>
      {carregando ? (
        <ActivityIndicator color={paleta.frente} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={20} color={paleta.frente} />}
          <Text style={[estilos.textoBotao, { color: paleta.frente }]}>{titulo}</Text>
        </>
      )}
    </Pressable>
  );
}

type PropsCampo = TextInputProps & {
  rotulo: string;
  icone?: NomeIcone;
  erro?: string;
};

export function Campo({ rotulo, icone, erro, style, ...propsInput }: PropsCampo) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={[estilos.caixaCampo, erro && { borderColor: cores.perigo }]}>
        {icone && <Ionicons name={icone} size={18} color={cores.textoSuave} />}
        <TextInput
          placeholderTextColor={cores.textoSuave}
          style={[estilos.campo, style]}
          {...propsInput}
        />
      </View>
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

function infoSituacao(situacao: SituacaoStock, cores: Tema['cores']) {
  return {
    ok: { rotulo: 'Em stock', frente: cores.sucesso, fundo: cores.sucessoFundo },
    baixo: { rotulo: 'Stock baixo', frente: cores.alerta, fundo: cores.alertaFundo },
    esgotado: { rotulo: 'Esgotado', frente: cores.perigo, fundo: cores.perigoFundo },
  }[situacao];
}

export function SeloSituacao({ situacao }: { situacao: SituacaoStock }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const info = infoSituacao(situacao, cores);
  return (
    <View style={[estilos.selo, { backgroundColor: info.fundo }]}>
      <View style={[estilos.ponto, { backgroundColor: info.frente }]} />
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
      <View style={estilos.iconeVazio}>
        <Ionicons name={icone} size={36} color={cores.primaria} />
      </View>
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
      <View style={{ padding: espaco(10), alignItems: 'center' }}>
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
          estilo={{ marginTop: 10 }}
        />
      }
    />
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  botao: {
    height: 54,
    borderRadius: raio.medio,
    paddingHorizontal: espaco(5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  textoBotao: { fontSize: 16, fontWeight: '700' },
  rotulo: { fontSize: 13, fontWeight: '600', color: cores.textoSuave, marginLeft: 4 },
  caixaCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.medio,
    paddingHorizontal: espaco(4),
    minHeight: 52,
  },
  campo: { flex: 1, fontSize: 16, color: cores.texto, paddingVertical: 12 },
  erro: { color: cores.perigo, fontSize: 12, marginLeft: 4 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.pilula,
    alignSelf: 'flex-start',
  },
  ponto: { width: 6, height: 6, borderRadius: 3 },
  textoSelo: { fontSize: 12, fontWeight: '700' },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(5),
    ...sombra,
  },
  vazio: { alignItems: 'center', padding: espaco(8), gap: 10 },
  iconeVazio: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tituloVazio: { fontSize: 18, fontWeight: '700', color: cores.texto },
  mensagemVazio: { fontSize: 14, color: cores.textoSuave, textAlign: 'center', lineHeight: 20 },
});
