import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { obterResumo } from '../banco/banco';
import { Avatar } from '../componentes/Avatar';
import { BotaoAlternarTema, SeletorTema } from '../componentes/SeletorTema';
import { Botao, type NomeIcone } from '../componentes/ui';
import { useCarregarAoFocar } from '../hooks/useCarregarAoFocar';
import { usePerfis } from '../perfis';
import { useSessaoAtiva } from '../sessao';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';
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
              <Avatar nome={usuario} tamanho={44} />
              <View style={estilos.seloCamera}>
                <Ionicons name="camera" size={11} color={cores.textoSobrePrimaria} />
              </View>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={estilos.ola}>Olá, {usuario} 👋</Text>
              <Text style={estilos.titulo}>Armazém</Text>
            </View>
          </Pressable>
          <View style={estilos.botoesTopo}>
            <BotaoAlternarTema />
            <Pressable
              onPress={confirmarSaida}
              style={({ pressed }) => [estilos.botaoSair, pressed && { transform: [{ scale: 0.94 }] }]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Sair">
              <Ionicons name="log-out-outline" size={22} color={cores.perigo} />
            </Pressable>
          </View>
        </View>

        {modoTeste && (
          <Pressable style={estilos.faixaTeste} onPress={confirmarSaida}>
            <Ionicons name="school-outline" size={18} color={cores.primaria} />
            <Text style={estilos.textoFaixaTeste}>
              Modo Teste: stock separado, não afeta a equipe.
            </Text>
            <Text style={estilos.linkFaixaTeste}>Sair</Text>
          </Pressable>
        )}

        {erro && (
          <Pressable style={estilos.erro} onPress={atualizar}>
            <Ionicons name="cloud-offline-outline" size={20} color={cores.perigo} />
            <Text style={estilos.textoErro}>{erro} Toque para tentar de novo.</Text>
          </Pressable>
        )}

        <LinearGradient
          colors={cores.gradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.destaque}>
          <Text style={estilos.rotuloDestaque}>Valor total em stock</Text>
          <Text style={estilos.valorDestaque}>{formatarMoeda(resumo?.valorTotal ?? 0)}</Text>
          <View style={estilos.linhaDestaque}>
            <Numero rotulo="Produtos" valor={resumo?.totalProdutos ?? 0} />
            <View style={estilos.divisor} />
            <Numero rotulo="Unidades" valor={resumo?.totalUnidades ?? 0} />
          </View>
        </LinearGradient>

        {alertas > 0 && (
          <Pressable
            style={estilos.aviso}
            onPress={() => router.push({ pathname: '/produtos', params: { filtro: 'alerta' } })}>
            <Ionicons name="warning" size={20} color={cores.alerta} />
            <Text style={estilos.textoAviso}>
              {resumo?.stockBaixo} com stock baixo · {resumo?.esgotados} esgotados
            </Text>
            <Ionicons name="chevron-forward" size={18} color={cores.alerta} />
          </Pressable>
        )}

        <Text style={estilos.secao}>O que deseja fazer?</Text>

        <CartaoAcao
          icone="scan"
          titulo="Escanear código"
          subtitulo="Leia um código de barras para encontrar ou cadastrar um produto"
          gradiente={cores.gradienteScanner}
          aoPressionar={() => router.push('/escanear')}
        />
        <CartaoAcao
          icone="layers"
          titulo="Gerenciar stock"
          subtitulo="Veja, pesquise e ajuste as quantidades dos seus produtos"
          gradiente={cores.gradiente}
          aoPressionar={() => router.push('/produtos')}
        />
        <CartaoAcao
          icone="cart"
          titulo="Lista de compras"
          subtitulo="Anote o que precisa comprar e marque o que já foi comprado"
          gradiente={cores.gradienteScanner}
          aoPressionar={() => router.push('/lista-compras')}
        />

        <Pressable style={estilos.manual} onPress={() => router.push('/formulario-produto')}>
          <View style={estilos.iconeManual}>
            <Ionicons name="create-outline" size={22} color={cores.primaria} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.tituloManual}>Adicionar manualmente</Text>
            <Text style={estilos.subtituloManual}>Cadastre um produto sem escanear</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />
        </Pressable>

        <Text style={estilos.secao}>Aparência</Text>
        <SeletorTema />

        <Botao
          titulo={modoTeste ? 'Sair do modo Teste' : 'Sair e escolher outro usuário'}
          icone="log-out-outline"
          variante="perigo"
          aoPressionar={confirmarSaida}
          estilo={{ marginTop: espaco(4) }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  const estilos = useEstilos(criarEstilos);
  return (
    <View style={{ flex: 1 }}>
      <Text style={estilos.valorNumero}>{valor}</Text>
      <Text style={estilos.rotuloNumero}>{rotulo}</Text>
    </View>
  );
}

function CartaoAcao({
  icone,
  titulo,
  subtitulo,
  gradiente,
  aoPressionar,
}: {
  icone: NomeIcone;
  titulo: string;
  subtitulo: string;
  gradiente: readonly [string, string];
  aoPressionar: () => void;
}) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.acao, pressed && { transform: [{ scale: 0.98 }] }]}>
      <LinearGradient colors={gradiente} style={estilos.iconeAcao}>
        <Ionicons name={icone} size={30} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.tituloAcao}>{titulo}</Text>
        <Text style={estilos.subtituloAcao}>{subtitulo}</Text>
      </View>
      <View style={estilos.setaAcao}>
        <Ionicons name="arrow-forward" size={18} color={cores.texto} />
      </View>
    </Pressable>
  );
}

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco(5), gap: espaco(4), paddingBottom: espaco(10) },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usuario: { flexDirection: 'row', alignItems: 'center', gap: espaco(3), flexShrink: 1 },
  seloCamera: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: cores.primaria,
    borderWidth: 2,
    borderColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botoesTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco(2) },
  botaoSair: {
    width: 48,
    height: 48,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  faixaTeste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: cores.superficieSuave,
    borderRadius: raio.medio,
    padding: espaco(3),
  },
  textoFaixaTeste: { flex: 1, color: cores.texto, fontSize: 13 },
  linkFaixaTeste: { color: cores.primaria, fontWeight: '700' },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.perigoFundo,
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  textoErro: { flex: 1, color: cores.perigo, fontWeight: '600' },
  ola: { fontSize: 15, color: cores.textoSuave },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.texto, letterSpacing: -0.5 },
  destaque: { borderRadius: raio.grande, padding: espaco(6), gap: 6 },
  rotuloDestaque: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  valorDestaque: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  linhaDestaque: {
    flexDirection: 'row',
    marginTop: espaco(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  divisor: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: espaco(4) },
  valorNumero: { color: '#fff', fontSize: 22, fontWeight: '800' },
  rotuloNumero: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: cores.alertaFundo,
    borderRadius: raio.medio,
    padding: espaco(4),
  },
  textoAviso: { flex: 1, color: cores.alerta, fontWeight: '700' },
  secao: { fontSize: 18, fontWeight: '800', color: cores.texto, marginTop: espaco(2) },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(4),
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(4),
    ...sombra,
  },
  iconeAcao: {
    width: 64,
    height: 64,
    borderRadius: raio.medio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloAcao: { fontSize: 18, fontWeight: '800', color: cores.texto },
  subtituloAcao: { fontSize: 13, color: cores.textoSuave, lineHeight: 18 },
  setaAcao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    borderRadius: raio.grande,
    padding: espaco(4),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  iconeManual: {
    width: 44,
    height: 44,
    borderRadius: raio.pequeno,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloManual: { fontSize: 16, fontWeight: '700', color: cores.texto },
  subtituloManual: { fontSize: 13, color: cores.textoSuave },
});
