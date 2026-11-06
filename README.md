# Nossa História

Álbum digital colaborativo para guardar e encontrar memórias de uma família. As **Etapas 0, 1 e 2A** estão concluídas: interface e navegação funcionam; o esquema PostgreSQL local, as políticas RLS e os testes de autorização estão prontos. Autenticação na aplicação, uploads e pesquisa ainda não foram implementados.

## Stack

React 19, TypeScript strict, TanStack Start/Router/Query, Tailwind CSS 4, shadcn/ui, Lucide, React Hook Form e Zod. O banco local usa Supabase CLI, PostgreSQL 17 e RLS; Auth na aplicação e Storage privado vêm nas etapas seguintes. Vitest, Testing Library, Playwright e pgTAP verificam os módulos existentes.

## Requisitos e instalação

- Node.js 24 LTS ou versão compatível com Vite 8; npm 11.
- `npm ci`
- `npm run dev` e acesse `http://localhost:3000`.
- Para o banco local: Docker ativo, uma rede Docker vinculada a `127.0.0.1` e `npx supabase start --network-id nossa-historia-local`. Os comandos completos estão em [DATABASE.md](docs/DATABASE.md). O primeiro início baixa imagens Docker; não cria projeto hospedado.

A interface atual não exige variáveis de ambiente. Na Etapa 2B, copie `.env.example` para `.env` e configure a URL e a chave publicável do Supabase; para desenvolvimento local, consulte `npx supabase status`. Nunca coloque chave privilegiada em variável `VITE_` ou arquivo versionado.

Rotas disponíveis: `/` (linha do tempo principal), `/linha-do-tempo`, `/galeria`, `/eventos`, `/eventos/:eventId` e `/participantes`. A linha do tempo horizontal começa no dia atual, aceita salto por ano, setas, teclado, arraste com mouse e swipe nativo em telas de toque. Ainda não há eventos persistidos; por isso o eixo exibe um estado vazio. Busca, criação de eventos e detalhes reais estão indisponíveis até as etapas correspondentes. O tema claro/escuro pode ser alternado no cabeçalho e fica salvo no navegador.

Para revisar o visual com cartões, abra `http://localhost:3000/demo-linha-do-tempo` enquanto `npm run dev` estiver ativo. Essa rota separada contém cinco eventos e imagens fictícias identificados como demonstração; não grava dados e retorna página não encontrada no build de produção. Use o campo de ano para ir a 2018, 2020, 2022, 2024 ou 2026, ou navegue por clique, setas, arraste e swipe.

## Comandos

| Comando                                                  | Função                                    |
| -------------------------------------------------------- | ----------------------------------------- |
| `npm run dev`                                            | Servidor local                            |
| `npm run typecheck`                                      | TypeScript strict                         |
| `npm run lint`                                           | ESLint                                    |
| `npm run check`                                          | Verificação de formatação                 |
| `npm test`                                               | Testes unitários e de componentes         |
| `npm run test:e2e`                                       | Playwright em desktop e mobile            |
| `npm run build`                                          | Build de produção                         |
| `npm run preview`                                        | Prévia local do build                     |
| `npx supabase start --network-id nossa-historia-local`   | Inicia o Supabase local em loopback       |
| `npx supabase migration up`                              | Aplica migrações pendentes ao banco local |
| `npx supabase test db --network-id nossa-historia-local` | Testes pgTAP de esquema e RLS             |
| `npx supabase db lint --network-id nossa-historia-local` | Verificação SQL do banco local            |
| `npx supabase stop`                                      | Para a stack sem apagar dados             |

## Estrutura

`src/routes` contém rotas; `src/components` contém a interface; `src/integrations` contém o provedor TanStack Query; `src/types/database.types.ts` é gerado do PostgreSQL; `supabase/migrations` contém SQL versionado e `supabase/tests` contém testes de autorização; `tests` contém testes de componente e navegador. `docs` registra decisões e progresso. Leia [a especificação da linha do tempo](docs/TIMELINE.md) para o contrato visual. Pastas de features surgirão conforme os módulos forem implementados.

Playwright precisa de um navegador Chromium instalado. Neste Ubuntu, os testes foram executados com `PLAYWRIGHT_CHROME_PATH=/usr/bin/google-chrome npm run test:e2e`. Em outros ambientes, instale o Chromium do Playwright ou ajuste essa variável para o navegador local.

## Banco e deploy

O banco Supabase **local** está funcional e as migrações passaram por 68 testes pgTAP. O frontend ainda não o consulta. Para regenerar tipos após mudanças de esquema, execute `npx supabase gen types --lang typescript --schema public > src/types/database.types.ts` e formate o arquivo. Não use `supabase db reset` sobre dados que deseje preservar e não use `--remote` sem autorização. O bucket privado e as políticas de Storage ainda não existem: uploads devem permanecer desabilitados. A aplicação TanStack Start requer hospedagem compatível com o adaptador de build escolhido; a decisão de hospedagem fica para depois do MVP. O Git local foi inicializado na branch `main`; não há commit, remoto ou deploy configurado.

Leia [arquitetura](docs/ARCHITECTURE.md), [banco](docs/DATABASE.md), [roadmap](docs/ROADMAP.md) e [migração para Lovable](docs/LOVABLE_MIGRATION.md).
