import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { obterSituacao, type Produto } from '../banco/banco';
import { espaco, fonte, linha, raio, useEstilos, useTema, type Tema } from '../tema';
import { formatarMoeda } from '../utilitarios/formatacao';
import { FotoProduto } from './FotoProduto';
import { SeloSituacao } from './ui';

/** Linha da lista de produtos (separada por uma linha fina, sem cartão flutuante). */
export function CartaoProduto({ produto, aoPressionar }: { produto: Produto; aoPressionar: () => void }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const inicial = produto.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [estilos.linha, pressed && { backgroundColor: cores.superficie }]}>
      {produto.caminho_foto ? (
        <FotoProduto foto={produto.caminho_foto} estilo={estilos.miniatura} />
      ) : (
        <View style={estilos.miniatura}>
          <Text style={estilos.textoMiniatura}>{inicial}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.nome} numberOfLines={1}>
          {produto.nome}
        </Text>
        <View style={estilos.linhaInfo}>
          <Ionicons name="barcode-outline" size={13} color={cores.textoSuave} />
          <Text style={estilos.info} numberOfLines={1}>
            {produto.codigo_barras ?? 'Sem código'}
            {produto.categoria ? ` · ${produto.categoria}` : ''}
          </Text>
        </View>
        <SeloSituacao situacao={obterSituacao(produto)} />
      </View>
      <View style={estilos.direita}>
        <Text style={estilos.quantidade}>{produto.quantidade}</Text>
        <Text style={estilos.rotuloQuantidade}>unid.</Text>
        {produto.preco_unitario > 0 && (
          <Text style={estilos.preco}>{formatarMoeda(produto.preco_unitario)}</Text>
        )}
      </View>
    </Pressable>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    paddingHorizontal: espaco(5),
    paddingVertical: espaco(3.5),
    borderBottomWidth: linha.fina,
    borderBottomColor: cores.borda,
  },
  miniatura: {
    width: 52,
    height: 52,
    borderRadius: raio.medio,
    backgroundColor: cores.superficie,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 6,
    overflow: 'hidden',
  },
  textoMiniatura: { fontSize: 22, lineHeight: 24, fontFamily: fonte.forte, color: cores.texto },
  nome: { fontSize: 16, fontFamily: fonte.forte, color: cores.texto },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  info: { fontSize: 12, fontFamily: fonte.normal, color: cores.textoSuave, flexShrink: 1 },
  direita: { alignItems: 'flex-end' },
  quantidade: { fontSize: 26, fontFamily: fonte.forte, color: cores.texto, letterSpacing: -0.5 },
  rotuloQuantidade: { fontSize: 11, fontFamily: fonte.normal, color: cores.textoSuave, marginTop: -2 },
  preco: { fontSize: 12, fontFamily: fonte.normal, color: cores.textoSuave, marginTop: 4 },
});
