import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/archivo';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AberturaAnimada } from '../componentes/AberturaAnimada';
import { ProvedorPerfis } from '../perfis';
import { ProvedorSessao, useSessao } from '../sessao';
import { fonte, ProvedorTema, useTema } from '../tema';

export default function LayoutPrincipal() {
  // A splash nativa continua na tela (AberturaAnimada segura) até a fonte carregar.
  const [fontesProntas] = useFonts({ Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold });
  if (!fontesProntas) return null;

  return (
    <ProvedorTema>
      <ProvedorSessao>
        <ProvedorPerfis>
          <Navegacao />
        </ProvedorPerfis>
      </ProvedorSessao>
    </ProvedorTema>
  );
}

function Navegacao() {
  const { cores, esquema } = useTema();
  const { acesso, usuario } = useSessao();
  const base = esquema === 'escuro' ? DarkTheme : DefaultTheme;

  // Tema da navegação: evita "piscar" branco nas transições do modo escuro.
  const temaNavegacao = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.primaria,
      background: cores.fundo,
      card: cores.fundo,
      text: cores.texto,
      border: cores.divisor,
    },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: cores.texto,
          headerTitleStyle: { color: cores.texto, fontFamily: fonte.forte, fontSize: 18 },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: cores.fundo },
          contentStyle: { backgroundColor: cores.fundo },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        {/* 1º: código da equipe ou modo teste (uma vez por celular) */}
        <Stack.Protected guard={!acesso}>
          <Stack.Screen name="entrar" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* 2º: "Quem é você?" (no modo teste o usuário é sempre "Teste") */}
        <Stack.Protected guard={!!acesso && !usuario}>
          <Stack.Screen name="quem-e-voce" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* App */}
        <Stack.Protected guard={!!acesso && !!usuario}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="produtos/index" options={{ title: 'Produtos' }} />
          <Stack.Screen name="produtos/[id]" options={{ title: 'Detalhes' }} />
          <Stack.Screen
            name="escanear"
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="formulario-produto"
            options={{ presentation: 'modal', title: 'Novo produto' }}
          />
          <Stack.Screen name="perfil" options={{ presentation: 'modal', title: 'Foto de perfil' }} />
        </Stack.Protected>
      </Stack>
      <AberturaAnimada />
    </ThemeProvider>
  );
}
