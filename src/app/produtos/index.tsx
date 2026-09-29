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
import { espaco, raio, useEstilos, useTema, type Tema } from '../../tema';

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
              <Ionicons name="scan" size={24} color={cores.primaria} />
            </Pressable>
          ),
        }}
      />

      <View style={estilos.caixaPesquisa}>
        <Ionicons name="search" size={18} color={cores.textoSuave} />
        <TextInput
          value={pesquisa}
          onChangeText={setPesquisa}
          placeholder="Pesquisar nome, código ou categoria"
          placeholderTextColor={cores.textoSuave}
          style={estilos.campoPesquisa}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={estilos.filtros}>
        {FILTROS.map((f) => (
          <Pressable
            key={f.chave}
            onPress={() => setFiltro(f.chave)}
            style={[estilos.chip, filtro === f.chave && estilos.chipAtivo]}>
            <Text style={[estilos.textoChip, filtro === f.chave && estilos.textoChipAtivo]}>
              {f.rotulo}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={visiveis}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[estilos.lista, { paddingBottom: margens.bottom + 100 }]}
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
            acao={
              filtrando ? undefined : (
                <Botao
                  titulo="Escanear agora"
                  icone="scan"
                  aoPressionar={() => router.push('/escanear')}
                  estilo={{ marginTop: 10 }}
                />
              )
            }
          />
          )
        }
      />

      <Pressable
        onPress={() => router.push('/formulario-produto')}
        style={({ pressed }) => [
          estilos.botaoFlutuante,
          { bottom: margens.bottom + 20 },
          pressed && { transform: [{ scale: 0.95 }] },
        ]}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  caixaPesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: espaco(5),
    marginTop: espaco(2),
    paddingHorizontal: espaco(4),
    height: 50,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  campoPesquisa: { flex: 1, fontSize: 16, color: cores.texto },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: espaco(5),
    paddingVertical: espaco(4),
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficieSuave,
  },
  chipAtivo: { backgroundColor: cores.primaria },
  textoChip: { fontSize: 13, fontWeight: '600', color: cores.textoSuave },
  textoChipAtivo: { color: '#fff' },
  lista: { paddingHorizontal: espaco(5), gap: espaco(3) },
  botaoFlutuante: {
    position: 'absolute',
    right: espaco(5),
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
    shadowOpacity: 0.3,
  },
});
