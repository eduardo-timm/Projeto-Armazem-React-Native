# Estrutura do projeto

```
src/
├── app/                          # Telas (cada arquivo é uma rota do Expo Router)
│   ├── _layout.tsx               # Navegação, tema, sessão e rotas protegidas
│   ├── entrar.tsx                # Código da equipe (1x por celular) ou modo Teste
│   ├── quem-e-voce.tsx           # Escolha: Eduardo / Tomás / Tiago
│   ├── index.tsx                 # Início: resumo do stock e atalhos
│   ├── escanear.tsx              # Scanner de código de barras + digitação manual
│   ├── formulario-produto.tsx    # Cadastro e edição de produto
│   └── produtos/
│       ├── index.tsx             # Lista de produtos com pesquisa e filtros
│       └── [id].tsx              # Detalhes, entrada/saída, histórico e exclusão
│
├── banco/
│   ├── banco.ts                  # Consultas ao Supabase (produtos, movimentações, resumo)
│   ├── supabase.ts               # Cliente do Supabase com o acesso da equipe/teste
│   └── tipos-supabase.ts         # Tipos gerados a partir do banco
│
├── componentes/
│   ├── AberturaAnimada.tsx       # Animação de abertura (logo + nome)
│   ├── Avatar.tsx                # Inicial colorida de cada pessoa
│   ├── CameraSegura.tsx          # Câmera com correção da tela preta no iPhone
│   ├── CartaoProduto.tsx         # Item da lista de produtos
│   ├── FotoProduto.tsx           # Foto do produto (baixada do Supabase Storage)
│   ├── SeletorFoto.tsx           # Tirar/escolher/remover a foto no formulário
│   ├── SeletorTema.tsx           # Escolha de tema claro/escuro/sistema
│   └── ui.tsx                    # Botão, campo, cartão, selo de situação...
│
├── hooks/
│   └── useCarregarAoFocar.ts     # Carrega dados ao abrir a tela + puxar para atualizar
│
├── utilitarios/
│   ├── erros.ts                  # Mensagens de erro amigáveis
│   ├── fotos.ts                  # Câmera/galeria e redução da foto antes de enviar
│   └── formatacao.ts             # Moeda (R$), números e data/hora
│
├── sessao.tsx                    # Código da equipe / modo Teste + quem está usando
└── tema.tsx                      # Cores dos temas claro e escuro

supabase/migrations/              # SQL do banco (tabelas, RLS e funções)
assets/                           # Ícones e splash (gerados por scripts/gerar-imagens.mjs)
scripts/gerar-imagens.mjs         # Gera as imagens do app a partir de um desenho SVG
app.json                          # Configuração do Expo (nome, ícone, permissões)
.env                              # URL e chave pública do Supabase
CLAUDE.md                         # Convenções do projeto
```

## Fluxo principal

1. **Primeira vez no celular** → digitar o código da equipe (ou entrar no modo Teste).
2. **Quem é você?** → Eduardo, Tomás ou Tiago (fica salvo; dá para trocar na tela inicial).
3. **Início** → escolher entre *Escanear código*, *Gerenciar stock* ou *Adicionar manualmente*.
4. **Escanear** → se o código já existe, abre o produto; se não, abre o cadastro com o código preenchido.
5. **Produto** → registrar entrada/saída (fica no histórico com o nome de quem fez);
   o app avisa quando o stock fica abaixo do mínimo.
