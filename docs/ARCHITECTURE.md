# Arquitetura

## Decisão inicial

TanStack Start entrega rotas React e funções de servidor no mesmo projeto. TanStack Query gerencia consultas e invalidação no cliente. Supabase Auth fornece identidade; PostgreSQL com RLS é a fonte de autorização e dados; Storage privado guarda originais. O frontend não usa chave privilegiada.

## Fluxo previsto

1. Usuário autenticado solicita um evento pelo cliente Supabase com sessão.
2. RLS confere associação ao espaço antes de ler ou gravar.
3. Formulários validam entrada com Zod no servidor e no cliente para feedback.
4. Uploads usam caminhos `space_id/event_id/media_id`; regras de Storage verificam membro e autoria. O navegador recebe URL assinada curta para leitura.

Funções de servidor serão usadas para convites, operações administrativas, validação sensível e orquestração que não cabe em uma única transação do cliente. Secrets permanecem no ambiente do servidor. Erros enviados ao cliente não incluem detalhes internos.

## Fronteiras

- `src/routes`: composição de páginas e proteção de navegação.
- `src/features`: regras e consultas por domínio, criadas quando houver implementação.
- `src/components`: apresentação reutilizável, incluindo `ui` gerado pelo shadcn.
- `src/lib/supabase`: clientes SSR e browser na Etapa 2.
- `supabase/migrations`: esquema, funções, índices e políticas SQL versionados.
- `src/types/database.types.ts`: tipos gerados do PostgreSQL local; não substituem RLS.

Não há mock de dados persistentes. As rotas atuais são uma apresentação pública temporária, sem mídia de usuários. A linha do tempo horizontal recebe `TimelineEvent[]` e a galeria recebe um array tipado vazio, prontos para serem alimentados por consultas reais em etapas futuras. A ordenação e a posição visual da linha do tempo ficam em `src/components/timeline/timeline-model.ts`; o eixo e os controles não conhecem Supabase. Antes de disponibilizar qualquer conteúdo privado, implementar proteção de rota, sessão SSR, RLS e políticas de Storage.

## Estado após a Etapa 2A

O banco local usa PostgreSQL 17 via Supabase CLI/Docker. As 13 tabelas privadas têm RLS, grants limitados por operação/coluna, FKs compostas por espaço e funções de autorização no esquema `private` não exposto pela API. O criador de um espaço recebe papel `admin` por gatilho. Datas parciais são armazenadas como partes conhecidas, sem inventar precisão. As migrações foram validadas com pgTAP; o frontend permanece sem sessão nem consultas reais.

A Etapa 2B deve implementar Auth por convite, clientes Supabase SSR/browser, proteção das rotas e o fluxo transacional de convites. Antes de qualquer upload, é preciso criar bucket privado, políticas de `storage.objects` e testes de acesso. Não há credenciais privilegiadas no frontend. Consulte [DATABASE.md](DATABASE.md) para o contrato das tabelas e a operação local.
