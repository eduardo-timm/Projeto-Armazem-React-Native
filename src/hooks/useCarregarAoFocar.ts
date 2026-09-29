import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { mensagemDeErro } from '../utilitarios/erros';

/**
 * Carrega dados do Supabase toda vez que a tela ganha foco (ex.: ao voltar do formulário).
 * `carregar` precisa ser estável (useCallback). `atualizar()` serve para o "puxar para atualizar".
 */
export function useCarregarAoFocar<T>(carregar: () => Promise<T>) {
  const [dados, setDados] = useState<T | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async () => {
    try {
      const resultado = await carregar();
      setDados(resultado);
      setErro(null);
    } catch (e) {
      setErro(mensagemDeErro(e));
    }
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      buscar();
    }, [buscar])
  );

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await buscar();
    setAtualizando(false);
  }, [buscar]);

  return {
    dados,
    erro,
    /** true só na primeira carga (ainda sem dados nem erro) */
    carregando: dados === undefined && erro === null,
    atualizando,
    atualizar,
    recarregar: buscar,
  };
}
