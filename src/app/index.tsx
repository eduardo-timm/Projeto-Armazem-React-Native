import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obterResumo } from '../banco/banco';
import { Avatar } from '../componentes/Avatar';
import { BotaoAlternarTema, SeletorTema } from '../componentes/SeletorTema';
import { Botao, Rotulo, type NomeIcone } from '../componentes/ui';
import { useCarregarAoFocar } from '../hooks/useCarregarAoFocar';
import { usePerfis } from '../perfis';
import { useSessaoAtiva } from '../sessao';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../tema';
import { alertar } from '../utilitarios/alerta';
import { formatarMoeda } from '../utilitarios/formatacao';

export default function TelaInicial() {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const { db, usuario, acesso, trocarUsuario, sair } = useSessaoAtiva();
  const { recarregar: recarregarPerfis } = usePerfis();
  const modoTeste = acesso.tipo === 'teste';
  const { dados: resumo, erro, atualizando, atualizar } = useCarregarAoFocar(
    useCallback(() => {
      void recarregarPerfis();
      return obterResumo(db);
    }, [db, recarregarPerfis])
  );

  /** Na equipe volta para "Quem é você?"; no modo teste volta para a tela do código. */
  function confirmarSaida() {
    if (modoTeste) {
      alertar('Sair do modo Teste?', 'Você volta para a tela do código da equipe.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: sair },
      ]);
    } else {
      alertar(`Sair da conta de ${usuario}?`, 'Você volta para escolher quem está usando.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: trocarUsuario },
      ]);
    }
  }

  const alertas = (resumo?.stockBaixo ?? 0) + (resumo?.esgotados ?? 0);

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={atualizar} tintColor={cores.primaria} />
        }>
        <View style={estilos.cabecalho}>
          <Pressable
            onPress={() => router.push('/perfil')}
            style={estilos.usuario}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Trocar foto de perfil">
            <View>
              <Avatar nome={usuario} tamanho={46} />
              <View style={estilos.seloCamera}>
                <Ionicons name="camera" size={11} color={cores.fundo} />
              </View>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={estilos.ola}>Olá, {usuario}</Text>
              <Text style={estilos.titulo}>Armazém</Text>
            </View>
          </Pressable>
          <View style={estilos.botoesTopo}>
            <BotaoAlternarTema />
            <Pressable
              onPress={confirmarSaida}
              style={({ pressed }) => [estilos.botaoSair, pressed && { backgroundColor: cores.superficie }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Sair">
              <Ionicons name="log-out-outline" size={21} color={cores.primariaForte} />
            </Pressable>
          </View>
        </View>

        {modoTeste && (
          <Pressable style={estilos.faixa} onPress={confirmarSaida}>
            <Ionicons name="school-outline" size={18} color={cores.primariaForte} />
            <Text style={estilos.textoFaixa}>Modo Teste: stock separado, não afeta a equipe.</Text>
            <Text style={estilos.linkFaixa}>Sair</Text>
          </Pressable>
        )}

        {erro && (
          <Pressable style={estilos.erro} onPress={atualizar}>
            <Ionicons name="cloud-offline-outline" size={20} color={cores.perigo} />
            <Text style={estilos.textoErro}>{erro} Toque para tentar de novo.</Text>
          </Pressable>
        )}

        <View style={estilos.blocoValor}>
          <Rotulo>Valor total em stock</Rotulo>
          <Text style={estilos.valor} numberOfLines={1} adjustsFontSizeToFit>
            {formatarMoeda(resumo?.valorTotal ?? 0)}
          </Text>
        </View>
        <View style={estilos.grade}>
          <Numero rotulo="Produtos" valor={resumo?.totalProdutos ?? 0} />
          <View style={estilos.divisorVertical} />
          <Numero rotulo="Unidades" valor={resumo?.totalUnidades ?? 0} />
        </View>

        {alertas > 0 && (
          <Pressable
            style={({ pressed }) => [estilos.aviso, pressed && { opacity: 0.85 }]}
            onPress={() => router.push({ pathname: '/produtos', params: { filtro: 'alerta' } })}>
            <Ionicons name="warning-outline" size={20} color={cores.alerta} />
            <Text style={estilos.textoAviso}>
              <Text style={estilos.numeroAviso}>{resumo?.stockBaixo}</Text> com stock baixo ·{' '}
              <Text style={estilos.numeroAviso}>{resumo?.esgotados}</Text> esgotados
            </Text>
            <Ionicons name="arrow-forward" size={18} color={cores.alerta} />
          </Pressable>
        )}

        <Rotulo estilo={estilos.tituloSecao}>O que deseja fazer?</Rotulo>
        <View style={estilos.acoes}>
          <Pressable
            onPress={() => router.push('/escanear')}
            style={({ pressed }) => [
              estilos.acaoPrincipal,
              pressed && { backgroundColor: cores.primariaPressionada },
            ]}>
            <View style={estilos.topoAcao}>
              <Text style={estilos.numeroAcaoPrincipal}>01</Text>
              <Ionicons name="scan" size={40} color={cores.textoSobrePrimaria} />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={estilos.tituloAcaoPrincipal}>Escanear código</Text>
              <Text style={estilos.subtituloAcaoPrincipal}>
                Encontre ou cadastre um produto pelo código de barras
              </Text>
            </View>
          </Pressable>
          <View style={estilos.linhaAcoes}>
            <CartaoAcao
              numero="02"
              icone="layers-outline"
              titulo="Gerenciar stock"
              subtitulo="Veja, pesquise e ajuste quantidades"
              preenchido
              aoPressionar={() => router.push('/produtos')}
            />
            <CartaoAcao
              numero="03"
              icone="create-outline"
              titulo="Adicionar manualmente"
              subtitulo="Cadastre sem escanear"
              aoPressionar={() => router.push('/formulario-produto')}
            />
          </View>
        </View>

        <View style={estilos.rodape}>
          <Rotulo>Aparência</Rotulo>
          <SeletorTema />
          <Botao
            titulo={modoTeste ? 'Sair do modo Teste' : 'Sair e escolher outro usuário'}
            icone="log-out-outline"
            variante="perigo"
            aoPressionar={confirmarSaida}
            estilo={{ marginTop: espaco(2) }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable style={estilos.celula} onPress={() => router.push('/produtos')}>
      <Text style={estilos.valorNumero}>{valor}</Text>
      <Text style={estilos.rotuloNumero}>{rotulo}</Text>
    </Pressable>
  );
}

function CartaoAcao({
  numero,
  icone,
  titulo,
  subtitulo,
  preenchido,
  aoPressionar,
}: {
  numero: string;
  icone: NomeIcone;
  titulo: string;
  subtitulo: string;
  preenchido?: boolean;
  aoPressionar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.acao,
        preenchido ? estilos.acaoPreenchida : estilos.acaoContorno,
        pressed && { backgroundColor: preenchido ? cores.superficieSuave : cores.superficie },
      ]}>
      <View style={estilos.topoAcao}>
        <Text style={estilos.numeroAcao}>{numero}</Text>
        <Ionicons name={icone} size={26} color={cores.texto} />
      </View>
      <View style={{ gap: 4 }}>
        <Text style={estilos.tituloAcao}>{titulo}</Text>
        <Text style={estilos.subtituloAcao}>{subtitulo}</Text>
      </View>
    </Pressable>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingBottom: espaco(10) },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espaco(3),
    paddingHorizontal: espaco(5),
    paddingTop: espaco(2),
    paddingBottom: espaco(4),
  },
  usuario: { flexDirection: 'row', alignItems: 'center', gap: espaco(3), flexShrink: 1 },
  seloCamera: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: raio.pequeno,
    backgroundColor: cores.texto,
    borderWidth: 2,
    borderColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ola: { fontSize: 13, fontFamily: fonte.normal, color: cores.textoSuave },
  titulo: { fontSize: 24, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -0.5 },
  botoesTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco(2) },
  botaoSair: {
    width: 44,
    height: 44,
    borderRadius: raio.medio,
    borderWidth: 1.5,
    borderColor: cores.divisor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.superficie,
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    paddingHorizontal: espaco(5),
    paddingVertical: espaco(3),
  },
  textoFaixa: { flex: 1, color: cores.texto, fontSize: 13, fontFamily: fonte.normal },
  linkFaixa: { color: cores.primariaForte, fontFamily: fonte.forte },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: espaco(5),
    marginBottom: espaco(3),
    backgroundColor: cores.perigoFundo,
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  textoErro: { flex: 1, color: cores.perigo, fontFamily: fonte.media },
  blocoValor: {
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    paddingHorizontal: espaco(5),
    paddingTop: espaco(5),
    paddingBottom: espaco(5),
    gap: 6,
  },
  valor: { fontSize: 46, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -1.8 },
  grade: { flexDirection: 'row', borderTopWidth: linha.forte, borderTopColor: cores.divisor },
  celula: { flex: 1, paddingHorizontal: espaco(5), paddingVertical: espaco(4), gap: 2 },
  divisorVertical: { width: linha.forte, backgroundColor: cores.divisor },
  valorNumero: { fontSize: 32, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -1 },
  rotuloNumero: { fontSize: 13, fontFamily: fonte.normal, color: cores.textoSuave },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.alertaFundo,
    borderTopWidth: linha.forte,
    borderBottomWidth: linha.forte,
    borderColor: cores.primaria,
    paddingHorizontal: espaco(5),
    paddingVertical: espaco(3.5),
  },
  textoAviso: { flex: 1, color: cores.alerta, fontSize: 14, fontFamily: fonte.media },
  numeroAviso: { fontFamily: fonte.forte },
  tituloSecao: { paddingHorizontal: espaco(5), paddingTop: espaco(6), paddingBottom: espaco(2.5) },
  acoes: { paddingHorizontal: espaco(5), gap: espaco(2) },
  acaoPrincipal: {
    minHeight: 168,
    justifyContent: 'space-between',
    padding: espaco(4),
    borderRadius: raio.grande,
    backgroundColor: cores.primariaEscura,
  },
  topoAcao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  numeroAcaoPrincipal: { fontSize: 12, fontFamily: fonte.media, color: cores.textoSobrePrimaria },
  tituloAcaoPrincipal: {
    fontSize: 28,
    fontFamily: fonte.forte,
    color: cores.textoSobrePrimaria,
    letterSpacing: -0.6,
  },
  subtituloAcaoPrincipal: {
    fontSize: 14,
    fontFamily: fonte.media,
    color: cores.textoSobrePrimaria,
    lineHeight: 19,
  },
  linhaAcoes: { flexDirection: 'row', gap: espaco(2) },
  acao: {
    flex: 1,
    minHeight: 150,
    justifyContent: 'space-between',
    padding: espaco(3.5),
    borderRadius: raio.grande,
  },
  acaoPreenchida: { backgroundColor: cores.superficie },
  acaoContorno: { borderWidth: linha.forte, borderColor: cores.divisor },
  numeroAcao: { fontSize: 12, fontFamily: fonte.media, color: cores.primariaForte },
  tituloAcao: { fontSize: 18, fontFamily: fonte.forte, color: cores.texto, lineHeight: 21 },
  subtituloAcao: { fontSize: 12, fontFamily: fonte.normal, color: cores.textoSuave, lineHeight: 16 },
  rodape: {
    marginTop: espaco(7),
    borderTopWidth: linha.forte,
    borderTopColor: cores.divisor,
    padding: espaco(5),
    gap: espaco(3),
  },
});
