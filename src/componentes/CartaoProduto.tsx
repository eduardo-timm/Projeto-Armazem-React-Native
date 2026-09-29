import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { obterSituacao, type Produto } from '../banco/banco';
import { espaco, raio, useEstilos, useTema, type Tema } from '../tema';
import { formatarMoeda } from '../utilitarios/formatacao';
import { FotoProduto } from './FotoProduto';
import { SeloSituacao } from './ui';

export function CartaoProduto({ produto, aoPressionar }: { produto: Produto; aoPressionar: () => void }) {
  const { cores } = useTema();
  const estilos = useEstilos(criarEstilos);
  const inicial = produto.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      onPress={aoPressionar}
      style={({ pressed }) => [
        estilos.cartao,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}>
      {produto.caminho_foto ? (
        <FotoProduto foto={produto.caminho_foto} estilo={estilos.avatar} />
      ) : (
        <View style={estilos.avatar}>
          <Text style={estilos.textoAvatar}>{inicial}</Text>
        </View>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.nome} numberOfLines={1}>
          {produto.nome}
        </Text>
        <View style={estilos.linhaInfo}>
          <Ionicons name="barcode-outline" size={14} color={cores.textoSuave} />
          <Text style={estilos.info} numberOfLines={1}>
            {produto.codigo_barras ?? 'Sem código'}
          </Text>
          {produto.categoria ? <Text style={estilos.info}>· {produto.categoria}</Text> : null}
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

const criarEstilos = ({ cores, sombra }: Tema) => StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco(3),
    backgroundColor: cores.superficie,
    borderRadius: raio.grande,
    padding: espaco(4),
    ...sombra,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: raio.medio,
    backgroundColor: cores.superficieSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAvatar: { fontSize: 22, fontWeight: '800', color: cores.primaria },
  nome: { fontSize: 16, fontWeight: '700', color: cores.texto },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  info: { fontSize: 12, color: cores.textoSuave, flexShrink: 1 },
  direita: { alignItems: 'flex-end' },
  quantidade: { fontSize: 22, fontWeight: '800', color: cores.texto },
  rotuloQuantidade: { fontSize: 11, color: cores.textoSuave, marginTop: -2 },
  preco: { fontSize: 12, color: cores.textoSuave, marginTop: 4 },
});
