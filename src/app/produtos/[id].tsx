import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  buscarProduto,
  excluirProduto,
  listarMovimentacoes,
  obterSituacao,
  registrarMovimentacao,
  type Movimentacao,
  type TipoMovimentacao,
} from '../../banco/banco';
import { Avatar } from '../../componentes/Avatar';
import { FotoProduto } from '../../componentes/FotoProduto';
import {
  Botao,
  EstadoCarregamento,
  EstadoVazio,
  Rotulo,
  SeloSituacao,
  type NomeIcone,
} from '../../componentes/ui';
import { useCarregarAoFocar } from '../../hooks/useCarregarAoFocar';
import { useSessaoAtiva, type Usuario } from '../../sessao';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../../tema';
import { alertar } from '../../utilitarios/alerta';
import { mostrarErro } from '../../utilitarios/erros';
import { converterInteiro, formatarDataHora, formatarMoeda } from '../../utilitarios/formatacao';

export default function TelaDetalhesProduto() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db, usuario } = useSessaoAtiva();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quantidadeMovimento, setQuantidadeMovimento] = useState('1');
  const [movimentando, setMovimentando] = useState<TipoMovimentacao | null>(null);

  const { dados, erro, atualizando, atualizar, recarregar } = useCarregarAoFocar(
    useCallback(async () => {
      const [produto, historico] = await Promise.all([
        buscarProduto(db, id),
        listarMovimentacoes(db, id),
      ]);
      return { produto, historico };
    }, [db, id])
  );

  if (!dados) return <EstadoCarregamento erro={erro} aoTentarDeNovo={recarregar} />;

  const { produto, historico } = dados;
  if (!produto) {
    return (
      <EstadoVazio
        icone="alert-circle-outline"
        titulo="Produto não encontrado"
        mensagem="Ele pode ter sido excluído por outra pessoa da equipe."
      />
    );
  }

  async function movimentar(tipo: TipoMovimentacao) {
    const n = Math.max(1, converterInteiro(quantidadeMovimento));
    setMovimentando(tipo);
    try {
      await registrarMovimentacao(db, id, tipo, n, usuario);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await recarregar();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, tipo === 'saida' ? 'Não foi possível dar saída' : 'Não foi possível dar entrada');
    } finally {
      setMovimentando(null);
    }
  }

  function confirmarExclusao(nome: string) {
    alertar('Excluir produto', `Deseja excluir "${nome}"? O histórico dele também será apagado.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirProduto(db, id);
            router.back();
          } catch (e) {
            mostrarErro(e);
          }
        },
      },
    ]);
  }

  const alterarQuantidade = (delta: number) =>
    setQuantidadeMovimento(String(Math.max(1, converterInteiro(quantidadeMovimento) + delta)));

  const inicial = produto.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.primaria} />
      }>
      <Stack.Screen
        options={{
          title: produto.nome,
          headerRight: () => (
            <Pressable
              hitSlop={10}
              onPress={() =>
                router.push({ pathname: '/formulario-produto', params: { id: produto.id } })
              }>
              <Ionicons name="create-outline" size={24} color={cores.primariaForte} />
            </Pressable>
          ),
        }}
      />
      <View style={estilos.regua} />

      <View style={estilos.heroi}>
        <View style={{ flex: 1, gap: 6 }}>
          <SeloSituacao situacao={obterSituacao(produto)} />
          <Text style={estilos.quantidade} numberOfLines={1} adjustsFontSizeToFit>
            {produto.quantidade}
          </Text>
          <Text style={estilos.rotuloQuantidade}>
            unidades em stock · mínimo {produto.quantidade_minima}
          </Text>
        </View>
        {produto.caminho_foto ? (
          <FotoProduto foto={produto.caminho_foto} estilo={estilos.foto} />
        ) : (
          <View style={estilos.foto}>
            <Text style={estilos.inicial}>{inicial}</Text>
          </View>
        )}
      </View>

      <View style={estilos.grade}>
        <Celula rotulo="Preço unitário" valor={formatarMoeda(produto.preco_unitario)} />
        <View style={estilos.divisorVertical} />
        <Celula
          rotulo="Valor em stock"
          valor={formatarMoeda(produto.preco_unitario * produto.quantidade)}
        />
      </View>

      <View style={estilos.secao}>
        <Rotulo>Movimentar stock</Rotulo>
        <View style={estilos.seletor}>
          <BotaoPasso icone="remove" aoPressionar={() => alterarQuantidade(-1)} />
          <TextInput
            value={quantidadeMovimento}
            onChangeText={(t) => setQuantidadeMovimento(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            selectionColor={cores.primaria}
            style={estilos.campoQuantidade}
            selectTextOnFocus
          />
          <BotaoPasso icone="add" aoPressionar={() => alterarQuantidade(1)} />
        </View>
        <View style={{ flexDirection: 'row', gap: espaco(2) }}>
          <Botao
            titulo="Saída"
            icone="arrow-down"
            variante="secundario"
            aoPressionar={() => movimentar('saida')}
            carregando={movimentando === 'saida'}
            desabilitado={movimentando !== null}
            estilo={{ flex: 1 }}
          />
          <Botao
            titulo="Entrada"
            icone="arrow-up"
            aoPressionar={() => movimentar('entrada')}
            carregando={movimentando === 'entrada'}
            desabilitado={movimentando !== null}
            estilo={{ flex: 1 }}
          />
        </View>
      </View>

      <View style={estilos.secao}>
        <Rotulo>Informações</Rotulo>
        <View>
          <LinhaInfo icone="barcode-outline" rotulo="Código" valor={produto.codigo_barras ?? '—'} />
          <LinhaInfo icone="pricetag-outline" rotulo="Categoria" valor={produto.categoria ?? '—'} />
          <LinhaInfo icone="cash-outline" rotulo="Preço" valor={formatarMoeda(produto.preco_unitario)} />
        </View>
        {produto.descricao ? <Text style={estilos.descricao}>{produto.descricao}</Text> : null}
      </View>

      <View style={estilos.secao}>
        <Rotulo>Histórico</Rotulo>
        {historico.length === 0 ? (
          <Text style={estilos.semHistorico}>Nenhuma entrada ou saída ainda.</Text>
        ) : (
          <View>
            {historico.map((m) => (
              <LinhaHistorico key={m.id} movimentacao={m} />
            ))}
          </View>
        )}
      </View>

      <View style={estilos.rodape}>
        <Botao
          titulo="Excluir produto"
          icone="trash-outline"
          variante="fantasma"
          aoPressionar={() => confirmarExclusao(produto.nome)}
        />
      </View>
    </ScrollView>
  );
}

function Celula({ rotulo, valor }: { rotulo: string; valor: string }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.celula}>
      <Text style={estilos.rotuloCelula}>{rotulo}</Text>
      <Text style={estilos.valorCelula} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
    </View>
  );
}

function BotaoPasso({ icone, aoPressionar }: { icone: 'add' | 'remove'; aoPressionar: () => void }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.botaoPasso, pressed && { backgroundColor: cores.superficie }]}>
      <Ionicons name={icone} size={24} color={cores.texto} />
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.linhaInfo}>
      <Ionicons name={icone} size={17} color={cores.texto} />
      <Text style={estilos.rotuloInfo}>{rotulo}</Text>
      <Text style={estilos.valorInfo} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

function LinhaHistorico({ movimentacao: m }: { movimentacao: Movimentacao }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const entrada = m.tipo === 'entrada';
  return (
    <View style={estilos.linhaHistorico}>
      <Avatar nome={m.usuario as Usuario} tamanho={34} />
      <View style={{ flex: 1 }}>
        <Text style={estilos.textoHistorico}>
          <Text style={{ fontFamily: fonte.forte }}>{m.usuario}</Text>
          {entrada ? ' deu entrada' : ' deu saída'}
        </Text>
        <Text style={estilos.dataHistorico}>{formatarDataHora(m.criado_em)}</Text>
      </View>
      <Text style={[estilos.qtdHistorico, { color: entrada ? cores.texto : cores.primariaForte }]}>
        {entrada ? '+' : '−'}
        {m.quantidade}
      </Text>
    </View>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  conteudo: { paddingBottom: espaco(12) },
  regua: { height: linha.forte, backgroundColor: cores.divisor },
  heroi: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: espaco(4),
    paddingHorizontal: espaco(5),
    paddingTop: espaco(5),
    paddingBottom: espaco(4.5),
  },
  quantidade: { fontSize: 104, lineHeight: 100, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -5 },
  rotuloQuantidade: { fontSize: 14, fontFamily: fonte.normal, color: cores.textoSuave },
  foto: {
    width: 96,
    height: 96,
    borderRadius: raio.grande,
    backgroundColor: cores.superficie,
    justifyContent: 'flex-end',
    padding: 8,
    overflow: 'hidden',
  },
  inicial: { fontSize: 40, lineHeight: 42, fontFamily: fonte.forte, color: cores.texto },
  grade: { flexDirection: 'row', borderTopWidth: linha.forte, borderTopColor: cores.divisor },
  celula: { flex: 1, paddingHorizontal: espaco(5), paddingVertical: espaco(3.5), gap: 2 },
  divisorVertical: { width: linha.forte, backgroundColor: cores.divisor },
  rotuloCelula: { fontSize: 12, fontFamily: fonte.normal, color: cores.textoSuave },
  valorCelula: { fontSize: 20, fontFamily: fonte.forte, color: cores.texto },
  secao: {
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    padding: espaco(5),
    gap: espaco(3),
  },
  seletor: {
    flexDirection: 'row',
    borderWidth: linha.forte,
    borderColor: cores.divisor,
    borderRadius: raio.medio,
    overflow: 'hidden',
  },
  botaoPasso: { width: 60, height: 58, alignItems: 'center', justifyContent: 'center' },
  campoQuantidade: {
    flex: 1,
    height: 58,
    borderLeftWidth: linha.forte,
    borderRightWidth: linha.forte,
    borderColor: cores.divisor,
    backgroundColor: cores.superficie,
    textAlign: 'center',
    fontSize: 28,
    fontFamily: fonte.forte,
    color: cores.texto,
  },
  linhaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: linha.fina,
    borderBottomColor: cores.borda,
  },
  rotuloInfo: { color: cores.textoSuave, fontSize: 14, fontFamily: fonte.normal },
  valorInfo: { flex: 1, textAlign: 'right', color: cores.texto, fontSize: 14, fontFamily: fonte.media },
  descricao: { color: cores.textoSuave, fontSize: 14, fontFamily: fonte.normal, lineHeight: 20 },
  semHistorico: { color: cores.textoSuave, fontSize: 14, fontFamily: fonte.normal },
  linhaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    paddingVertical: 10,
    borderBottomWidth: linha.fina,
    borderBottomColor: cores.borda,
  },
  textoHistorico: { color: cores.texto, fontSize: 14, fontFamily: fonte.normal },
  dataHistorico: { color: cores.textoSuave, fontSize: 12, fontFamily: fonte.normal, marginTop: 2 },
  qtdHistorico: { fontSize: 18, fontFamily: fonte.forte },
  rodape: { paddingHorizontal: espaco(4), paddingTop: espaco(2) },
});
