import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text } from 'react-native';

import { espaco, useEstilos, type Tema } from '../tema';

const logo = require('../../assets/splash-icon.png');

// Segura a splash nativa até a abertura animada estar na tela (evita "piscar").
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Tela de abertura animada, desenhada pelo próprio app. Aparece por cima de tudo ao abrir
 * e some sozinha. Funciona no Expo Go (que não mostra a splash nativa personalizada) e no build.
 */
export function AberturaAnimada() {
  const estilos = useEstilos(criarEstilos);
  const [visivel, setVisivel] = useState(true);
  const [entrada] = useState(() => new Animated.Value(0));
  const [texto] = useState(() => new Animated.Value(0));
  const [saida] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animacao = Animated.sequence([
      Animated.spring(entrada, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(texto, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(saida, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animacao.start(({ finished }) => finished && setVisivel(false));
    return () => animacao.stop();
  }, [entrada, texto, saida]);

  if (!visivel) return null;

  return (
    <Animated.View
      style={[estilos.tela, { opacity: saida }]}
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}>
      <Animated.View
        style={{
          opacity: entrada,
          transform: [
            { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            { rotate: entrada.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) },
          ],
        }}>
        <Image source={logo} style={estilos.logo} />
      </Animated.View>
      <Animated.View
        style={{
          alignItems: 'center',
          opacity: texto,
          transform: [{ translateY: texto.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}>
        <Text style={estilos.nome}>Armazém</Text>
        <Text style={estilos.slogan}>Controle de stock na palma da mão</Text>
      </Animated.View>
    </Animated.View>
  );
}

const criarEstilos = ({ cores }: Tema) => StyleSheet.create({
  tela: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco(5),
    zIndex: 10,
  },
  logo: { width: 128, height: 128 },
  nome: { fontSize: 34, fontWeight: '800', color: cores.texto, letterSpacing: -1 },
  slogan: { fontSize: 15, color: cores.textoSuave, marginTop: 4 },
});
