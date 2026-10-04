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
  Cartao,
  EstadoCarregamento,
  EstadoVazio,
  SeloSituacao,
  type NomeIcone,
} from '../../componentes/ui';
import { useCarregarAoFocar } from '../../hooks/useCarregarAoFocar';
import { useSessaoAtiva, type Usuario } from '../../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../../tema';
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
              <Ionicons name="create-outline" size={24} color={cores.primaria} />
            </Pressable>
          ),
        }}
      />

      <Cartao estilo={{ alignItems: 'center', gap: 8 }}>
        {produto.caminho_foto ? (
          <FotoProduto foto={produto.caminho_foto} estilo={estilos.foto} />
        ) : null}
        <SeloSituacao situacao={obterSituacao(produto)} />
        <Text style={estilos.quantidade}>{produto.quantidade}</Text>
        <Text style={estilos.rotuloQuantidade}>unidades em stock</Text>
        <Text style={estilos.rotuloMinimo}>Mínimo: {produto.quantidade_minima}</Text>
      </Cartao>

      <Cartao estilo={{ gap: espaco(4) }}>
        <Text style={estilos.tituloCartao}>Movimentar stock</Text>
        <View style={estilos.seletor}>
          <BotaoPasso icone="remove" aoPressionar={() => alterarQuantidade(-1)} />
          <TextInput
            value={quantidadeMovimento}
            onChangeText={(t) => setQuantidadeMovimento(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            style={estilos.campoQuantidade}
            selectTextOnFocus
          />
          <BotaoPasso icone="add" aoPressionar={() => alterarQuantidade(1)} />
        </View>
        <View style={{ flexDirection: 'row', gap: espaco(3) }}>
          <Botao
            titulo="Saída"
            icone="arrow-down"
            variante="perigo"
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
      </Cartao>

      <Cartao estilo={{ gap: espaco(3) }}>
        <Text style={estilos.tituloCartao}>Informações</Text>
        <LinhaInfo icone="barcode-outline" rotulo="Código" valor={produto.codigo_barras ?? '—'} />
        <LinhaInfo icone="pricetag-outline" rotulo="Categoria" valor={produto.categoria ?? '—'} />
        <LinhaInfo icone="cash-outline" rotulo="Preço" valor={formatarMoeda(produto.preco_unitario)} />
        <LinhaInfo
          icone="wallet-outline"
          rotulo="Valor em stock"
          valor={formatarMoeda(produto.preco_unitario * produto.quantidade)}
        />
        {produto.descricao ? <Text style={estilos.descricao}>{produto.descricao}</Text> : null}
      </Cartao>

      <Cartao estilo={{ gap: espaco(3) }}>
        <Text style={estilos.tituloCartao}>Histórico</Text>
        {historico.length === 0 ? (
          <Text style={estilos.semHistorico}>Nenhuma entrada ou saída ainda.</Text>
        ) : (
          historico.map((m) => <LinhaHistorico key={m.id} movimentacao={m} />)
        )}
      </Cartao>

      <Botao
        titulo="Excluir produto"
        icone="trash-outline"
        variante="fantasma"
        aoPressionar={() => confirmarExclusao(produto.nome)}
      />
    </ScrollView>
  );
}

function BotaoPasso({ icone, aoPressionar }: { icone: 'add' | 'remove'; aoPressionar: () => void }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable onPress={aoPressionar} style={estilos.botaoPasso}>
      <Ionicons name={icone} size={24} color={cores.primaria} />
    </Pressable>
  );
}

function LinhaInfo({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={estilos.linhaInfo}>
      <Ionicons name={icone} size={18} color={cores.textoSuave} />
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
      <Avatar nome={m.usuario as Usuario} tamanho={32} />
      <View style={{ flex: 1 }}>
        <Text style={estilos.textoHistorico}>
          <Text style={{ fontWeight: '700' }}>{m.usuario}</Text>
          {entrada ? ' deu entrada' : ' deu saída'}
        </Text>
        <Text style={estilos.dataHistorico}>{formatarDataHora(m.criado_em)}</Text>
      </View>
      <Text style={[estilos.qtdHistorico, { color: entrada ? cores.sucesso : cores.perigo }]}>
        {entrada ? '+' : '−'}
        {m.quantidade}
      </Text>
    </View>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  conteudo: { padding: espaco(5), gap: espaco(4), paddingBottom: espaco(12) },
  foto: { width: 180, height: 180, borderRadius: raio.grande, marginBottom: espaco(2) },
  quantidade: { fontSize: 56, fontWeight: '800', color: cores.texto, letterSpacing: -2 },
  rotuloQuantidade: { fontSize: 14, color: cores.textoSuave, marginTop: -8 },
  rotuloMinimo: { fontSize: 12, color: cores.textoSuave },
  tituloCartao: { fontSize: 16, fontWeight: '800', color: cores.texto },
  seletor: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  botaoPasso: {
    width: 54,
    height: 54,
    borderRadius: raio.medio,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoQuantidade: {
    flex: 1,
    height: 54,
    borderRadius: raio.medio,
    backgroundColor: cores.superficieSuave,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: cores.texto,
  },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rotuloInfo: { color: cores.textoSuave, fontSize: 14 },
  valorInfo: { flex: 1, textAlign: 'right', color: cores.texto, fontSize: 14, fontWeight: '600' },
  descricao: { color: cores.textoSuave, fontSize: 14, lineHeight: 20 },
  semHistorico: { color: cores.textoSuave, fontSize: 14 },
  linhaHistorico: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  textoHistorico: { color: cores.texto, fontSize: 14 },
  dataHistorico: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  qtdHistorico: { fontSize: 16, fontWeight: '800' },
});
