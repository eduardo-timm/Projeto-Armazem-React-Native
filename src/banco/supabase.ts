import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from './tipos-supabase';

export type ClienteSupabase = SupabaseClient<Database>;

/** Como este celular acessa o banco: com o código da equipe (stock real) ou no modo teste. */
export type Acesso = { tipo: 'equipe'; codigo: string } | { tipo: 'teste' };

const URL_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const CHAVE_SUPABASE = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

/** Bucket privado com as fotos dos produtos (uma pasta por espaço: `equipe/`, `teste/`). */
export const BUCKET_FOTOS = 'fotos-produtos';

/** Espaço do banco (valor da coluna `espaco`) que corresponde ao acesso. */
export function espacoDoAcesso(acesso: Acesso) {
  return acesso.tipo;
}

/** Cabeçalhos que o banco lê em `espaco_atual()` para saber qual espaço liberar. */
function cabecalhosDeAcesso(acesso: Acesso): Record<string, string> {
  return acesso.tipo === 'equipe' ? { 'x-codigo-equipe': acesso.codigo } : { 'x-espaco': 'teste' };
}

/**
 * Cria o cliente do Supabase para um acesso. O acesso vai em cabeçalhos HTTP que o banco lê
 * na função `espaco_atual()`; o RLS só libera as linhas do espaço correspondente.
 * Não usamos o login do Supabase (Auth), então a sessão fica desligada.
 */
export function criarClienteSupabase(acesso: Acesso): ClienteSupabase {
  return createClient<Database>(URL_SUPABASE, CHAVE_SUPABASE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: cabecalhosDeAcesso(acesso) },
  });
}

/**
 * Fonte para o `<Image>` do expo-image carregar uma foto do bucket privado.
 * A foto é baixada com os mesmos cabeçalhos do cliente (o RLS do Storage também usa
 * `espaco_atual()`). Cada foto tem um nome único, então o caminho serve de chave do cache.
 */
export function fonteDaFoto(acesso: Acesso, caminho: string) {
  return {
    uri: `${URL_SUPABASE}/storage/v1/object/authenticated/${BUCKET_FOTOS}/${caminho}`,
    headers: {
      apikey: CHAVE_SUPABASE,
      Authorization: `Bearer ${CHAVE_SUPABASE}`,
      ...cabecalhosDeAcesso(acesso),
    },
    cacheKey: caminho,
  };
}
