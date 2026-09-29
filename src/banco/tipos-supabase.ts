// Gerado a partir do banco do Supabase (projeto "Estoque App").
// Não edite à mão: após mudar o esquema, gere de novo (MCP do Supabase ou `supabase gen types`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      movimentacoes: {
        Row: {
          criado_em: string
          espaco: string
          id: string
          produto_id: string
          quantidade: number
          tipo: string
          usuario: string
        }
        Insert: {
          criado_em?: string
          espaco?: string
          id?: string
          produto_id: string
          quantidade: number
          tipo: string
          usuario: string
        }
        Update: {
          criado_em?: string
          espaco?: string
          id?: string
          produto_id?: string
          quantidade?: number
          tipo?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          atualizado_em: string
          caminho_foto: string | null
          espaco: string
          usuario: string
        }
        Insert: {
          atualizado_em?: string
          caminho_foto?: string | null
          espaco?: string
          usuario: string
        }
        Update: {
          atualizado_em?: string
          caminho_foto?: string | null
          espaco?: string
          usuario?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          atualizado_em: string
          caminho_foto: string | null
          categoria: string | null
          codigo_barras: string | null
          criado_em: string
          descricao: string | null
          espaco: string
          id: string
          nome: string
          preco_unitario: number
          quantidade: number
          quantidade_minima: number
        }
        Insert: {
          atualizado_em?: string
          caminho_foto?: string | null
          categoria?: string | null
          codigo_barras?: string | null
          criado_em?: string
          descricao?: string | null
          espaco?: string
          id?: string
          nome: string
          preco_unitario?: number
          quantidade?: number
          quantidade_minima?: number
        }
        Update: {
          atualizado_em?: string
          caminho_foto?: string | null
          categoria?: string | null
          codigo_barras?: string | null
          criado_em?: string
          descricao?: string | null
          espaco?: string
          id?: string
          nome?: string
          preco_unitario?: number
          quantidade?: number
          quantidade_minima?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      espaco_atual: { Args: never; Returns: string }
      registrar_movimentacao: {
        Args: {
          p_produto_id: string
          p_quantidade: number
          p_tipo: string
          p_usuario: string
        }
        Returns: number
      }
      resumo_stock: { Args: never; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
