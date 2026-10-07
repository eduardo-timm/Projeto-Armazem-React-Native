import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { combinaComPesquisa, listarProdutos, obterSituacao } from '../../banco/banco';
import { CartaoProduto } from '../../componentes/CartaoProduto';
import { Botao, EstadoCarregamento, EstadoVazio } from '../../componentes/ui';
import { useCarregarAoFocar } from '../../hooks/useCarregarAoFocar';
import { useSessaoAtiva } from '../../sessao';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../../tema';

type Filtro = 'todos' | 'alerta' | 'ok';

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'alerta', rotulo: 'Baixo / esgotado' },
  { chave: 'ok', rotulo: 'Em stock' },
];

export default function TelaProdutos() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db } = useSessaoAtiva();
  const margens = useSafeAreaInsets();
  const parametros = useLocalSearchParams<{ filtro?: Filtro }>();
  const [pesquisa, setPesquisa] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(parametros.filtro ?? 'todos');

  const { dados: produtos, erro, carregando, atualizando, atualizar, recarregar } =
    useCarregarAoFocar(useCallback(() => listarProdutos(db), [db]));

  const visiveis = useMemo(
    () =>
      (produtos ?? []).filter((p) => {
        if (!combinaComPesquisa(p, pesquisa)) return false;
        const situacao = obterSituacao(p);
        if (filtro === 'alerta') return situacao !== 'ok';
        if (filtro === 'ok') return situacao === 'ok';
        return true;
      }),
    [produtos, pesquisa, filtro]
  );

  const filtrando = pesquisa !== '' || filtro !== 'todos';

  return (
    <View style={estilos.tela}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/escanear')} hitSlop={10}>
              <Ionicons name="scan" size={24} color={cores.primariaForte} />
            </Pressable>
          ),
        }}
      />
      <View style={estilos.regua} />

      <View style={estilos.topo}>
        <View style={estilos.caixaPesquisa}>
          <Ionicons name="search" size={18} color={cores.textoSuave} />
          <TextInput
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Pesquisar nome, código ou categoria"
            placeholderTextColor={cores.textoSuave}
            selectionColor={cores.primaria}
            style={estilos.campoPesquisa}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <View style={estilos.filtros}>
          {FILTROS.map((f, i) => {
            const ativo = filtro === f.chave;
            return (
              <Pressable
                key={f.chave}
                onPress={() => setFiltro(f.chave)}
                style={({ pressed }) => [
                  estilos.filtro,
                  i > 0 && estilos.separadorFiltro,
                  ativo && { backgroundColor: cores.primaria },
                  pressed && !ativo && { backgroundColor: cores.superficie },
                ]}>
                <Text
                  style={[estilos.textoFiltro, ativo && { color: cores.textoSobrePrimaria }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  {f.rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visiveis}
        keyExtractor={(item) => String(item.id)}
        style={estilos.lista}
        contentContainerStyle={{ paddingBottom: espaco(4) }}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.primaria} />
        }
        renderItem={({ item }) => (
          <CartaoProduto
            produto={item}
            aoPressionar={() =>
              router.push({ pathname: '/produtos/[id]', params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={
          carregando || (erro && !produtos) ? (
            <EstadoCarregamento erro={erro} aoTentarDeNovo={recarregar} />
          ) : (
            <EstadoVazio
              icone="cube-outline"
              titulo={filtrando ? 'Nada encontrado' : 'Nenhum produto ainda'}
              mensagem={
                filtrando
                  ? 'Tente outra pesquisa ou filtro.'
                  : 'Escaneie um código de barras ou adicione um produto manualmente.'
              }
            />
          )
        }
      />

      <View style={[estilos.barra, { paddingBottom: margens.bottom + espaco(3) }]}>
        <Botao
          titulo="Escanear"
          icone="scan"
          variante="secundario"
          aoPressionar={() => router.push('/escanear')}
          estilo={{ flex: 1 }}
        />
        <Botao
          titulo="Novo produto"
          icone="add"
          aoPressionar={() => router.push('/formulario-produto')}
          estilo={{ flex: 1.4 }}
        />
      </View>
    </View>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  regua: { height: linha.forte, backgroundColor: cores.divisor },
  topo: { paddingHorizontal: espaco(4), paddingTop: espaco(3.5), paddingBottom: espaco(3), gap: espaco(2.5) },
  caixaPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: espaco(3),
    height: 48,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    borderColor: cores.divisor,
    backgroundColor: cores.superficie,
  },
  campoPesquisa: { flex: 1, fontSize: 15, fontFamily: fonte.normal, color: cores.texto },
  filtros: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: cores.divisor,
    borderRadius: raio.medio,
    overflow: 'hidden',
  },
  filtro: { flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: espaco(3) },
  separadorFiltro: { borderLeftWidth: 1.5, borderLeftColor: cores.divisor },
  textoFiltro: { fontSize: 13, fontFamily: fonte.media, color: cores.texto },
  lista: { flex: 1, borderTopWidth: linha.forte, borderTopColor: cores.divisor },
  barra: {
    flexDirection: 'row',
    gap: espaco(2),
    paddingHorizontal: espaco(4),
    paddingTop: espaco(3),
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    backgroundColor: cores.fundo,
  },
});
