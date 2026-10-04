import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  criarCategoria,
  excluirCategoria,
  listarCategorias,
  normalizarTexto,
  renomearCategoria,
  type Categoria,
} from '../banco/banco';
import { useSessaoAtiva } from '../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';
import { alertar } from '../utilitarios/alerta';
import { mensagemDeErro, mostrarErro } from '../utilitarios/erros';
import { Botao, EstadoCarregamento, type NomeIcone } from './ui';

const TAMANHO_MAXIMO_NOME = 40;

/**
 * Campo de categoria do formulário: abre uma lista com as categorias cadastradas para
 * escolher, criar, renomear ou excluir (as categorias são compartilhadas pela equipe).
 */
export function SeletorCategoria({
  categoria,
  aoMudar,
}: {
  categoria: string | null;
  aoMudar: (categoria: string | null) => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const [aberto, setAberto] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.rotulo}>Categoria</Text>
      <Pressable
        onPress={() => setAberto(true)}
        style={({ pressed }) => [estilos.caixaCampo, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={`Categoria: ${categoria ?? 'sem categoria'}. Toque para escolher`}>
        <Ionicons name="pricetag-outline" size={18} color={cores.textoSuave} />
        <Text style={[estilos.valorCampo, !categoria && { color: cores.textoSuave }]} numberOfLines={1}>
          {categoria ?? 'Escolher categoria'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={cores.textoSuave} />
      </Pressable>

      <Modal
        visible={aberto}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAberto(false)}>
        <PainelCategorias
          selecionada={categoria}
          aoEscolher={(nova) => {
            aoMudar(nova);
            setAberto(false);
          }}
          aoMudarSelecionada={aoMudar}
          aoFechar={() => setAberto(false)}
        />
      </Modal>
    </View>
  );
}

type Linha =
  | { tipo: 'criar'; nome: string }
  | { tipo: 'nenhuma' }
  | { tipo: 'categoria'; categoria: Categoria };

function PainelCategorias({
  selecionada,
  aoEscolher,
  aoMudarSelecionada,
  aoFechar,
}: {
  selecionada: string | null;
  /** Escolheu (ou criou) uma categoria: o painel fecha. */
  aoEscolher: (categoria: string | null) => void;
  /** A categoria escolhida foi renomeada/excluída: atualiza o campo sem fechar. */
  aoMudarSelecionada: (categoria: string | null) => void;
  aoFechar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db } = useSessaoAtiva();
  const margens = useSafeAreaInsets();

  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  /** Nome da categoria sendo renomeada (null = nenhuma). */
  const [editando, setEditando] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  /** Mostrando o campo de "Nova categoria". */
  const [criando, setCriando] = useState(false);
  const [textoNova, setTextoNova] = useState('');

  const carregar = useCallback(
    () =>
      listarCategorias(db)
        .then((lista) => {
          setCategorias(lista);
          setErro(null);
        })
        .catch((e) => setErro(mensagemDeErro(e))),
    [db]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const linhas = useMemo<Linha[]>(() => {
    const nomeDigitado = texto.trim();
    const termo = normalizarTexto(nomeDigitado);
    const lista = categorias ?? [];
    const visiveis = termo
      ? lista.filter((c) => normalizarTexto(c.nome).includes(termo))
      : lista;
    const jaExiste = lista.some((c) => c.nome.toLowerCase() === nomeDigitado.toLowerCase());

    const resultado: Linha[] = [];
    if (nomeDigitado && !jaExiste) resultado.push({ tipo: 'criar', nome: nomeDigitado });
    if (!termo) resultado.push({ tipo: 'nenhuma' });
    for (const categoria of visiveis) resultado.push({ tipo: 'categoria', categoria });
    return resultado;
  }, [categorias, texto]);

  async function criar(nome: string) {
    if (!nome.trim()) return;
    setOcupado(true);
    try {
      const criada = await criarCategoria(db, nome);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      aoEscolher(criada);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, 'Não foi possível criar');
    } finally {
      setOcupado(false);
    }
  }

  function comecarEdicao(nome: string) {
    setCriando(false);
    setEditando(nome);
    setTextoEdicao(nome);
  }

  async function salvarEdicao() {
    if (!editando) return;
    const nomeNovo = textoEdicao.trim();
    if (!nomeNovo || nomeNovo === editando) {
      setEditando(null);
      return;
    }
    setOcupado(true);
    try {
      const salvo = await renomearCategoria(db, editando, nomeNovo);
      setCategorias((atuais) =>
        (atuais ?? [])
          .map((c) => (c.nome === editando ? { ...c, nome: salvo } : c))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
      );
      if (selecionada === editando) aoMudarSelecionada(salvo);
      setEditando(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, 'Não foi possível renomear');
    } finally {
      setOcupado(false);
    }
  }

  function confirmarExclusao({ nome, totalProdutos }: Categoria) {
    const aviso =
      totalProdutos === 0
        ? 'Nenhum produto usa esta categoria.'
        : totalProdutos === 1
          ? '1 produto vai ficar sem categoria.'
          : `${totalProdutos} produtos vão ficar sem categoria.`;
    alertar(`Excluir "${nome}"?`, aviso, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setOcupado(true);
          try {
            await excluirCategoria(db, nome);
            setCategorias((atuais) => (atuais ?? []).filter((c) => c.nome !== nome));
            if (selecionada === nome) aoMudarSelecionada(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            mostrarErro(e, 'Não foi possível excluir');
          } finally {
            setOcupado(false);
          }
        },
      },
    ]);
  }

  function renderizarLinha({ item }: { item: Linha }) {
    if (item.tipo === 'criar') {
      return (
        <ItemLista
          icone="add-circle"
          corIcone={cores.primaria}
          titulo={`Criar "${item.nome}"`}
          tituloDestacado
          aoPressionar={() => criar(item.nome)}
          desabilitado={ocupado}
        />
      );
    }
    if (item.tipo === 'nenhuma') {
      return (
        <ItemLista
          icone={selecionada === null ? 'radio-button-on' : 'radio-button-off'}
          corIcone={selecionada === null ? cores.primaria : cores.textoSuave}
          titulo="Sem categoria"
          aoPressionar={() => aoEscolher(null)}
          desabilitado={ocupado}
        />
      );
    }

    const { nome, totalProdutos } = item.categoria;
    if (editando === nome) {
      return (
        <View style={[estilos.item, estilos.itemEditando]}>
          <TextInput
            value={textoEdicao}
            onChangeText={setTextoEdicao}
            autoFocus
            maxLength={TAMANHO_MAXIMO_NOME}
            returnKeyType="done"
            onSubmitEditing={salvarEdicao}
            placeholder="Nome da categoria"
            placeholderTextColor={cores.textoSuave}
            style={estilos.campoEdicao}
          />
          <BotaoIcone
            icone="close"
            cor={cores.textoSuave}
            rotulo="Cancelar"
            aoPressionar={() => setEditando(null)}
            desabilitado={ocupado}
          />
          <BotaoIcone
            icone="checkmark"
            cor={cores.primaria}
            rotulo="Salvar nome"
            aoPressionar={salvarEdicao}
            desabilitado={ocupado || !textoEdicao.trim()}
          />
        </View>
      );
    }

    const marcada = selecionada === nome;
    return (
      <ItemLista
        icone={marcada ? 'radio-button-on' : 'radio-button-off'}
        corIcone={marcada ? cores.primaria : cores.textoSuave}
        titulo={nome}
        subtitulo={totalProdutos === 1 ? '1 produto' : `${totalProdutos} produtos`}
        aoPressionar={() => aoEscolher(nome)}
        desabilitado={ocupado}>
        <BotaoIcone
          icone="create-outline"
          cor={cores.textoSuave}
          rotulo={`Renomear ${nome}`}
          aoPressionar={() => comecarEdicao(nome)}
          desabilitado={ocupado}
        />
        <BotaoIcone
          icone="trash-outline"
          cor={cores.perigo}
          rotulo={`Excluir ${nome}`}
          aoPressionar={() => confirmarExclusao(item.categoria)}
          desabilitado={ocupado}
        />
      </ItemLista>
    );
  }

  return (
    <KeyboardAvoidingView
      style={estilos.painel}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Categoria</Text>
        {ocupado && <ActivityIndicator color={cores.primaria} />}
        <Pressable onPress={aoFechar} hitSlop={10} accessibilityRole="button">
          <Text style={estilos.fechar}>Fechar</Text>
        </Pressable>
      </View>

      {criando ? (
        <View style={[estilos.item, estilos.itemEditando]}>
          <Ionicons name="add-circle" size={22} color={cores.primaria} />
          <TextInput
            value={textoNova}
            onChangeText={setTextoNova}
            autoFocus
            maxLength={TAMANHO_MAXIMO_NOME}
            returnKeyType="done"
            onSubmitEditing={() => criar(textoNova)}
            placeholder="Nome da nova categoria"
            placeholderTextColor={cores.textoSuave}
            style={estilos.campoEdicao}
          />
          <BotaoIcone
            icone="close"
            cor={cores.textoSuave}
            rotulo="Cancelar"
            aoPressionar={() => setCriando(false)}
            desabilitado={ocupado}
          />
          <BotaoIcone
            icone="checkmark"
            cor={cores.primaria}
            rotulo="Criar categoria"
            aoPressionar={() => criar(textoNova)}
            desabilitado={ocupado || !textoNova.trim()}
          />
        </View>
      ) : (
        <Botao
          titulo="Nova categoria"
          icone="add-circle"
          variante="secundario"
          aoPressionar={() => {
            setTextoNova(texto.trim());
            setEditando(null);
            setCriando(true);
          }}
          desabilitado={ocupado}
        />
      )}

      <View style={estilos.caixaCampo}>
        <Ionicons name="search" size={18} color={cores.textoSuave} />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Pesquisar categoria"
          placeholderTextColor={cores.textoSuave}
          style={estilos.campo}
          maxLength={TAMANHO_MAXIMO_NOME}
          returnKeyType="done"
          onSubmitEditing={() => {
            const primeira = linhas[0];
            if (primeira?.tipo === 'criar') criar(primeira.nome);
            else if (primeira?.tipo === 'categoria') aoEscolher(primeira.categoria.nome);
          }}
          clearButtonMode="while-editing"
        />
      </View>

      {categorias === null ? (
        <EstadoCarregamento
          erro={erro}
          aoTentarDeNovo={() => {
            setErro(null);
            carregar();
          }}
        />
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(linha) =>
            linha.tipo === 'categoria' ? `c:${linha.categoria.nome}` : linha.tipo
          }
          renderItem={renderizarLinha}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: espaco(2), paddingBottom: margens.bottom + espaco(6) }}
          ListFooterComponent={
            categorias.length === 0 && !texto.trim() ? (
              <Text style={estilos.dica}>
                Nenhuma categoria ainda. Toque em &quot;Nova categoria&quot; para criar a primeira.
              </Text>
            ) : null
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

function ItemLista({
  icone,
  corIcone,
  titulo,
  tituloDestacado,
  subtitulo,
  aoPressionar,
  desabilitado,
  children,
}: {
  icone: NomeIcone;
  corIcone: string;
  titulo: string;
  tituloDestacado?: boolean;
  subtitulo?: string;
  aoPressionar: () => void;
  desabilitado: boolean;
  children?: ReactNode;
}) {
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        aoPressionar();
      }}
      disabled={desabilitado}
      style={({ pressed }) => [estilos.item, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icone} size={22} color={corIcone} />
      <View style={{ flex: 1 }}>
        <Text
          style={[estilos.tituloItem, tituloDestacado && estilos.tituloDestacado]}
          numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? <Text style={estilos.subtituloItem}>{subtitulo}</Text> : null}
      </View>
      {children}
    </Pressable>
  );
}

function BotaoIcone({
  icone,
  cor,
  rotulo,
  aoPressionar,
  desabilitado,
}: {
  icone: NomeIcone;
  cor: string;
  rotulo: string;
  aoPressionar: () => void;
  desabilitado: boolean;
}) {
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [
        estilos.botaoIcone,
        { opacity: desabilitado ? 0.4 : pressed ? 0.6 : 1 },
      ]}>
      <Ionicons name={icone} size={20} color={cor} />
    </Pressable>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
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
  valorCampo: { flex: 1, fontSize: 16, color: cores.texto },
  campo: { flex: 1, fontSize: 16, color: cores.texto, paddingVertical: 12 },
  painel: { flex: 1, backgroundColor: cores.fundo, padding: espaco(5), gap: espaco(4) },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: espaco(3) },
  titulo: { flex: 1, fontSize: 22, fontWeight: '800', color: cores.texto },
  fechar: { fontSize: 16, fontWeight: '700', color: cores.primaria },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    backgroundColor: cores.superficie,
    borderRadius: raio.medio,
    paddingHorizontal: espaco(4),
    minHeight: 56,
  },
  itemEditando: { borderWidth: 1, borderColor: cores.primaria, gap: espaco(1) },
  tituloItem: { fontSize: 16, fontWeight: '600', color: cores.texto },
  tituloDestacado: { color: cores.primaria, fontWeight: '700' },
  subtituloItem: { fontSize: 12, color: cores.textoSuave, marginTop: 2 },
  campoEdicao: { flex: 1, fontSize: 16, color: cores.texto, paddingVertical: 12 },
  botaoIcone: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  dica: {
    fontSize: 14,
    color: cores.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
    padding: espaco(6),
  },
});
