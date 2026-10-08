import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  criarItemLista,
  editarItemLista,
  excluirItemLista,
  limparItensComprados,
  listarItensLista,
  marcarItemLista,
  type ItemLista,
} from '../banco/banco';
import { Botao, Campo, EstadoCarregamento, EstadoVazio } from '../componentes/ui';
import { useSessaoAtiva } from '../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';
import { alertar } from '../utilitarios/alerta';
import { mensagemDeErro, mostrarErro } from '../utilitarios/erros';

const TAMANHO_MAXIMO_TEXTO = 120;
const TAMANHO_MAXIMO_ANOTACAO = 500;

/** Lista de compras (e anotações) compartilhada pela equipe: marcar, editar e excluir itens. */
export default function TelaListaCompras() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db, usuario } = useSessaoAtiva();
  const margens = useSafeAreaInsets();
  const campoNovo = useRef<TextInput>(null);

  const [itens, setItens] = useState<ItemLista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [textoNovo, setTextoNovo] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  /** Item aberto no painel de edição (null = painel fechado). */
  const [editando, setEditando] = useState<ItemLista | null>(null);

  const carregar = useCallback(
    () =>
      listarItensLista(db)
        .then((lista) => {
          setItens(lista);
          setErro(null);
        })
        .catch((e) => setErro(mensagemDeErro(e))),
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function atualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  const secoes = useMemo(() => {
    const lista = itens ?? [];
    const pendentes = lista.filter((i) => !i.comprado);
    const comprados = lista.filter((i) => i.comprado);
    const resultado = [{ titulo: 'Para comprar', total: pendentes.length, data: pendentes }];
    if (comprados.length > 0) {
      resultado.push({ titulo: 'Comprados', total: comprados.length, data: comprados });
    }
    return resultado;
  }, [itens]);

  const totalComprados = secoes[1]?.total ?? 0;

  async function adicionar() {
    const texto = textoNovo.trim();
    if (!texto || adicionando) return;
    setAdicionando(true);
    try {
      const criado = await criarItemLista(db, texto, null, usuario);
      setItens((atuais) => [...(atuais ?? []), criado]);
      setTextoNovo('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      campoNovo.current?.focus();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, 'Não foi possível adicionar');
    } finally {
      setAdicionando(false);
    }
  }

  /** Marca/desmarca na hora e desfaz se o banco recusar. */
  async function alternarComprado(item: ItemLista) {
    const comprado = !item.comprado;
    const trocar = (valor: boolean) =>
      setItens((atuais) =>
        (atuais ?? []).map((i) =>
          i.id === item.id ? { ...i, comprado: valor, comprado_por: valor ? usuario : null } : i
        )
      );
    Haptics.selectionAsync();
    trocar(comprado);
    try {
      await marcarItemLista(db, item.id, comprado, usuario);
    } catch (e) {
      trocar(!comprado);
      mostrarErro(e, 'Não foi possível atualizar');
    }
  }

  function confirmarLimpeza() {
    alertar(
      'Limpar comprados?',
      totalComprados === 1
        ? 'O item já comprado vai sair da lista.'
        : `Os ${totalComprados} itens já comprados vão sair da lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await limparItensComprados(db);
              setItens((atuais) => (atuais ?? []).filter((i) => !i.comprado));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              mostrarErro(e, 'Não foi possível limpar');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={estilos.tela}>
      <Stack.Screen
        options={{
          headerRight: () =>
            totalComprados > 0 ? (
              <Pressable
                onPress={confirmarLimpeza}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Limpar itens comprados">
                <Text style={estilos.limpar}>Limpar comprados</Text>
              </Pressable>
            ) : null,
        }}
      />

      <View style={estilos.caixaNovo}>
        <TextInput
          ref={campoNovo}
          value={textoNovo}
          onChangeText={setTextoNovo}
          placeholder="Adicionar item ou anotação"
          placeholderTextColor={cores.textoSuave}
          style={estilos.campoNovo}
          maxLength={TAMANHO_MAXIMO_TEXTO}
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={adicionar}
        />
        <Pressable
          onPress={adicionar}
          disabled={!textoNovo.trim() || adicionando}
          accessibilityRole="button"
          accessibilityLabel="Adicionar à lista"
          style={({ pressed }) => [
            estilos.botaoAdicionar,
            { opacity: !textoNovo.trim() ? 0.5 : pressed ? 0.85 : 1 },
          ]}>
          {adicionando ? (
            <ActivityIndicator color={cores.textoSobrePrimaria} />
          ) : (
            <Ionicons name="add" size={26} color={cores.textoSobrePrimaria} />
          )}
        </Pressable>
      </View>

      <SectionList
        sections={itens && itens.length > 0 ? secoes : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[estilos.lista, { paddingBottom: margens.bottom + espaco(10) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.primaria} />
        }
        renderSectionHeader={({ section }) => (
          <Text style={estilos.secao}>
            {section.titulo} · {section.total}
          </Text>
        )}
        renderItem={({ item }) => (
          <LinhaItem
            item={item}
            aoMarcar={() => alternarComprado(item)}
            aoEditar={() => setEditando(item)}
          />
        )}
        ListEmptyComponent={
          itens === null ? (
            <EstadoCarregamento erro={erro} aoTentarDeNovo={carregar} />
          ) : (
            <EstadoVazio
              icone="cart-outline"
              titulo="Lista vazia"
              mensagem="Escreva acima o que precisa comprar ou anotar. A lista é compartilhada com a equipe."
            />
          )
        }
      />

      <Modal
        visible={editando !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditando(null)}>
        {editando && (
          <PainelEdicao
            item={editando}
            aoFechar={() => setEditando(null)}
            aoSalvar={(texto, anotacao) => {
              setItens((atuais) =>
                (atuais ?? []).map((i) => (i.id === editando.id ? { ...i, texto, anotacao } : i))
              );
              setEditando(null);
            }}
            aoExcluir={() => {
              setItens((atuais) => (atuais ?? []).filter((i) => i.id !== editando.id));
              setEditando(null);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

function LinhaItem({
  item,
  aoMarcar,
  aoEditar,
}: {
  item: ItemLista;
  aoMarcar: () => void;
  aoEditar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const quem = item.comprado
    ? `Comprado${item.comprado_por ? ` por ${item.comprado_por}` : ''}`
    : `Adicionado por ${item.criado_por}`;

  return (
    <View style={[estilos.item, item.comprado && estilos.itemComprado]}>
      <Pressable
        onPress={aoMarcar}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.comprado }}
        accessibilityLabel={item.texto}
        style={estilos.marcador}>
        <Ionicons
          name={item.comprado ? 'checkmark-circle' : 'ellipse-outline'}
          size={28}
          color={item.comprado ? cores.sucesso : cores.textoSuave}
        />
      </Pressable>
      <Pressable
        onPress={aoEditar}
        style={({ pressed }) => [estilos.conteudoItem, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityHint="Editar ou excluir">
        <Text style={[estilos.textoItem, item.comprado && estilos.textoComprado]}>{item.texto}</Text>
        {item.anotacao ? (
          <Text style={estilos.anotacao} numberOfLines={3}>
            {item.anotacao}
          </Text>
        ) : null}
        <Text style={estilos.quem}>{quem}</Text>
      </Pressable>
      <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
    </View>
  );
}

function PainelEdicao({
  item,
  aoFechar,
  aoSalvar,
  aoExcluir,
}: {
  item: ItemLista;
  aoFechar: () => void;
  aoSalvar: (texto: string, anotacao: string | null) => void;
  aoExcluir: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db } = useSessaoAtiva();
  const margens = useSafeAreaInsets();
  const [texto, setTexto] = useState(item.texto);
  const [anotacao, setAnotacao] = useState(item.anotacao ?? '');
  const [ocupado, setOcupado] = useState(false);

  async function salvar() {
    const textoLimpo = texto.trim();
    if (!textoLimpo) return;
    setOcupado(true);
    try {
      await editarItemLista(db, item.id, textoLimpo, anotacao);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      aoSalvar(textoLimpo, anotacao.trim() || null);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, 'Não foi possível salvar');
      setOcupado(false);
    }
  }

  function confirmarExclusao() {
    alertar(`Excluir "${item.texto}"?`, 'O item sai da lista de todo mundo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          try {
            await excluirItemLista(db, item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            aoExcluir();
          } catch (e) {
            mostrarErro(e, 'Não foi possível excluir');
            setOcupado(false);
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={estilos.painel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.cabecalhoPainel}>
        <Text style={estilos.tituloPainel}>Editar item</Text>
        {ocupado && <ActivityIndicator color={cores.primaria} />}
        <Pressable onPress={aoFechar} hitSlop={10} accessibilityRole="button">
          <Text style={estilos.fechar}>Fechar</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ gap: espaco(4), paddingBottom: margens.bottom + espaco(6) }}
        keyboardShouldPersistTaps="handled">
        <Campo
          rotulo="Item"
          icone="cart-outline"
          value={texto}
          onChangeText={setTexto}
          maxLength={TAMANHO_MAXIMO_TEXTO}
          placeholder="Ex.: Arroz 5 kg"
          returnKeyType="done"
          erro={texto.trim() ? undefined : 'Escreva o item.'}
        />
        <Campo
          rotulo="Anotação (opcional)"
          icone="document-text-outline"
          value={anotacao}
          onChangeText={setAnotacao}
          maxLength={TAMANHO_MAXIMO_ANOTACAO}
          placeholder="Ex.: marca, quantidade, onde comprar…"
          multiline
          style={estilos.campoAnotacao}
        />
        <Text style={estilos.quemPainel}>
          Adicionado por {item.criado_por}
          {item.comprado && item.comprado_por ? ` · comprado por ${item.comprado_por}` : ''}
        </Text>
        <Botao
          titulo="Salvar"
          icone="checkmark"
          aoPressionar={salvar}
          carregando={ocupado}
          desabilitado={!texto.trim()}
        />
        <Botao
          titulo="Excluir item"
          icone="trash-outline"
          variante="perigo"
          aoPressionar={confirmarExclusao}
          desabilitado={ocupado}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  limpar: { fontSize: 15, fontWeight: '700', color: cores.perigo },
  caixaNovo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(2),
    marginHorizontal: espaco(5),
    marginTop: espaco(2),
    paddingLeft: espaco(4),
    paddingRight: 6,
    minHeight: 56,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  campoNovo: { flex: 1, fontSize: 16, color: cores.texto, paddingVertical: 12 },
  botaoAdicionar: {
    width: 44,
    height: 44,
    borderRadius: raio.pequeno,
    backgroundColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: { paddingHorizontal: espaco(5), gap: espaco(2) },
  secao: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.textoSuave,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: espaco(5),
    marginBottom: espaco(1),
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    backgroundColor: cores.superficie,
    borderRadius: raio.medio,
    paddingLeft: espaco(3),
    paddingRight: espaco(3),
    minHeight: 60,
  },
  itemComprado: { opacity: 0.65 },
  marcador: { paddingVertical: espaco(3) },
  conteudoItem: { flex: 1, paddingVertical: espaco(3), gap: 2 },
  textoItem: { fontSize: 16, fontWeight: '600', color: cores.texto },
  textoComprado: { textDecorationLine: 'line-through', color: cores.textoSuave },
  anotacao: { fontSize: 14, color: cores.textoSuave, lineHeight: 19 },
  quem: { fontSize: 12, color: cores.textoSuave, marginTop: 2 },
  painel: { flex: 1, backgroundColor: cores.fundo, padding: espaco(5), gap: espaco(4) },
  cabecalhoPainel: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  tituloPainel: { flex: 1, fontSize: 22, fontWeight: '800', color: cores.texto },
  fechar: { fontSize: 16, fontWeight: '700', color: cores.primaria },
  campoAnotacao: { minHeight: 110, textAlignVertical: 'top' },
  quemPainel: { fontSize: 13, color: cores.textoSuave, marginLeft: 4 },
});
