import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AberturaAnimada } from '../componentes/AberturaAnimada';
import { ProvedorPerfis } from '../perfis';
import { ProvedorSessao, useSessao } from '../sessao';
import { ProvedorTema, useTema } from '../tema';

export default function LayoutPrincipal() {
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
      border: cores.borda,
    },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style={esquema === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: cores.primaria,
          headerTitleStyle: { color: cores.texto, fontWeight: '700' },
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
