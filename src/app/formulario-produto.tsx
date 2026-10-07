import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apagarFoto,
  atualizarProduto,
  buscarPorCodigo,
  buscarProduto,
  criarProduto,
  enviarFoto,
  type DadosProduto,
} from '../banco/banco';
import { SeletorCategoria } from '../componentes/SeletorCategoria';
import { SeletorFoto } from '../componentes/SeletorFoto';
import { Botao, Campo } from '../componentes/ui';
import { useSessaoAtiva } from '../sessao';
import { espaco, fonte, linha, raio, useEstilos, type Tema } from '../tema';
import { mostrarErro } from '../utilitarios/erros';
import { converterDecimal, converterInteiro } from '../utilitarios/formatacao';

type Erros = Partial<Record<'nome' | 'codigo', string>>;

/**
 * Cadastro e edição de produto.
 * Parâmetros: `id` (editar um existente) ou `codigo` (novo produto já com o código lido no scanner).
 */
export default function TelaFormularioProduto() {
  const estilos = useEstilos(criarEstilos);
  const { db, usuario, acesso } = useSessaoAtiva();
  const margens = useSafeAreaInsets();
  const parametros = useLocalSearchParams<{ id?: string; codigo?: string }>();
  const idEdicao = parametros.id ?? null;

  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState(parametros.codigo ?? '');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [quantidadeMinima, setQuantidadeMinima] = useState('');
  const [preco, setPreco] = useState('');
  /** Caminho no Storage (foto já salva) ou URI local (foto nova, enviada ao salvar). */
  const [foto, setFoto] = useState<string | null>(null);
  /** Foto que o produto tinha ao abrir a edição (apagada do Storage se for trocada/removida). */
  const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);
  const [erros, setErros] = useState<Erros>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!idEdicao) return;
    buscarProduto(db, idEdicao)
      .then((p) => {
        if (!p) return;
        setNome(p.nome);
        setCodigo(p.codigo_barras ?? '');
        setCategoria(p.categoria);
        setDescricao(p.descricao ?? '');
        setQuantidadeMinima(String(p.quantidade_minima));
        setPreco(p.preco_unitario ? p.preco_unitario.toFixed(2).replace('.', ',') : '');
        setFoto(p.caminho_foto);
        setFotoOriginal(p.caminho_foto);
      })
      .catch((e) => mostrarErro(e));
  }, [db, idEdicao]);

  async function salvar() {
    setSalvando(true);
    let fotoEnviada: string | null = null;
    try {
      const novosErros: Erros = {};
      if (!nome.trim()) novosErros.nome = 'Informe o nome do produto';

      const codigoLimpo = codigo.trim();
      if (codigoLimpo) {
        const existente = await buscarPorCodigo(db, codigoLimpo);
        if (existente && existente.id !== idEdicao) {
          novosErros.codigo = `Este código já pertence a "${existente.nome}"`;
        }
      }

      setErros(novosErros);
      if (Object.keys(novosErros).length) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Foto nova: envia antes de salvar o produto, que guarda só o caminho dela.
      if (foto && foto !== fotoOriginal) fotoEnviada = await enviarFoto(db, acesso, foto);
      const caminhoFoto = fotoEnviada ?? foto;

      const dados: DadosProduto = {
        nome,
        codigo_barras: codigoLimpo || null,
        categoria,
        descricao: descricao || null,
        quantidade_minima: converterInteiro(quantidadeMinima),
        preco_unitario: converterDecimal(preco),
        caminho_foto: caminhoFoto,
      };

      if (idEdicao) await atualizarProduto(db, idEdicao, dados);
      else await criarProduto(db, dados, converterInteiro(quantidade), usuario);
      if (fotoOriginal !== caminhoFoto) void apagarFoto(db, fotoOriginal);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      // O produto não foi salvo: a foto enviada agora ficaria sem dono.
      void apagarFoto(db, fotoEnviada);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarErro(e, 'Não foi possível salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <Stack.Screen options={{ title: idEdicao ? 'Editar produto' : 'Novo produto' }} />
      <View style={estilos.regua} />
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + espaco(6) }]}
        keyboardShouldPersistTaps="handled">
        {parametros.codigo && !idEdicao ? (
          <View style={estilos.aviso}>
            <Text style={estilos.textoAviso}>
              O código <Text style={{ fontFamily: fonte.forte }}>{parametros.codigo}</Text> ainda não
              está cadastrado. Preencha os dados abaixo.
            </Text>
          </View>
        ) : null}

        <SeletorFoto foto={foto} aoMudar={setFoto} />

        <Campo
          rotulo="Nome *"
          icone="cube-outline"
          value={nome}
          onChangeText={setNome}
          placeholder="Ex.: Arroz 5kg"
          erro={erros.nome}
          autoFocus={!idEdicao}
          returnKeyType="next"
        />
        <Campo
          rotulo="Código de barras"
          icone="barcode-outline"
          value={codigo}
          onChangeText={setCodigo}
          placeholder="Opcional — digite se não conseguir escanear"
          keyboardType="number-pad"
          erro={erros.codigo}
        />
        <SeletorCategoria categoria={categoria} aoMudar={setCategoria} />
        <View style={estilos.linha}>
          {/* Na edição, a quantidade só muda por entrada/saída (para ficar no histórico). */}
          {!idEdicao && (
            <View style={{ flex: 1 }}>
              <Campo
                rotulo="Quantidade inicial"
                value={quantidade}
                onChangeText={setQuantidade}
                placeholder="0"
                keyboardType="number-pad"
                style={estilos.campoNumero}
              />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Stock mínimo"
              value={quantidadeMinima}
              onChangeText={setQuantidadeMinima}
              placeholder="0"
              keyboardType="number-pad"
              style={estilos.campoNumero}
            />
          </View>
        </View>
        <Campo
          rotulo="Preço unitário (R$)"
          icone="cash-outline"
          value={preco}
          onChangeText={setPreco}
          placeholder="0,00"
          keyboardType="decimal-pad"
        />
        <Campo
          rotulo="Descrição"
          icone="document-text-outline"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Opcional — marca, tamanho, observações…"
          multiline
        />

        <Botao
          titulo={idEdicao ? 'Salvar alterações' : 'Cadastrar produto'}
          icone="checkmark"
          aoPressionar={salvar}
          carregando={salvando}
          estilo={{ marginTop: espaco(2) }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  regua: { height: linha.forte, backgroundColor: cores.divisor },
  conteudo: { padding: espaco(5), gap: espaco(4.5) },
  linha: { flexDirection: 'row', gap: espaco(3) },
  campoNumero: { fontSize: 18, fontFamily: fonte.forte },
  aviso: {
    backgroundColor: cores.alertaFundo,
    borderTopWidth: linha.forte,
    borderTopColor: cores.primaria,
    borderRadius: raio.medio,
    padding: espaco(3.5),
  },
  textoAviso: { color: cores.alerta, fontSize: 14, fontFamily: fonte.normal, lineHeight: 20 },
});
