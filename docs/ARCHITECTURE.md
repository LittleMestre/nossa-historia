# Arquitetura

## Decisão inicial

TanStack Start entrega rotas React e funções de servidor no mesmo projeto. TanStack Query gerencia consultas e invalidação no cliente. Supabase Auth fornece identidade; PostgreSQL com RLS é a fonte de autorização e dados; Storage privado guarda originais. O frontend não usa chave privilegiada.

## Fluxo previsto

1. Usuário autenticado solicita um evento pelo cliente Supabase com sessão.
2. RLS confere associação ao espaço antes de ler ou gravar.
3. Formulários validam entrada com Zod no servidor e no cliente para feedback.
4. Fotos usam caminhos `space_id/event_id/media_id/arquivo`; regras de Storage verificam o vínculo exato com `media`, evento ativo, membro e autoria na escrita. Na Etapa 4C, o servidor valida a sessão e o espaço antes de gerar URLs assinadas de curta duração.

Funções de servidor serão usadas para convites, operações administrativas, validação sensível e orquestração que não cabe em uma única transação do cliente. Secrets permanecem no ambiente do servidor. Erros enviados ao cliente não incluem detalhes internos.

## Fronteiras

- `src/routes`: composição de páginas e proteção de navegação.
- `src/features`: regras e consultas por domínio, criadas quando houver implementação.
- `src/components`: apresentação reutilizável, incluindo `ui` gerado pelo shadcn.
- `src/lib/supabase`: clientes SSR e browser na Etapa 2.
- `supabase/migrations`: esquema, funções, índices e políticas SQL versionados.
- `src/types/database.types.ts`: tipos gerados do PostgreSQL local; não substituem RLS.

Não há mock de dados persistentes. As rotas da aplicação exigem sessão. A linha do tempo horizontal recebe `TimelineEvent[]`; a galeria recebe fotos reais do espaço ativo. A ordenação e a posição visual da linha do tempo ficam em `src/components/timeline/timeline-model.ts`; o eixo e os controles não conhecem Supabase.

Na Etapa 4A, `family-media` é privado e a RLS de `storage.objects` permite SELECT apenas de fotos ativas do próprio espaço e INSERT apenas ao autor do registro `media` com papel de contribuição. As operações de listagem, download autenticado e criação de URL assinada dependem de SELECT; nunca usar URL pública permanente ou chave `service_role` no navegador. A Etapa 4C consulta IDs em lote, confere sessão, associação ao espaço ativo, estado `ready`, evento ativo e caminho exato, então assina com o cliente SSR da própria sessão por 60 segundos. Miniaturas usam transformação privada 480 × 360 no Storage hospedado; no ambiente local, sem transformações, a URL do original funciona como fallback e pode transferir até 20 MiB. O cliente renova as URLs aos 45 segundos e ao voltar à aba. URLs assinadas já emitidas são portadoras de acesso e podem continuar válidas até vencer mesmo após exclusão lógica ou remoção de membro. A Etapa 4D deverá planejar revogação emergencial e limpeza física auditada, considerando esse intervalo de validade.

## Estado após a Etapa 2A

O banco local usa PostgreSQL 17 via Supabase CLI/Docker. As 13 tabelas privadas têm RLS, grants limitados por operação/coluna, FKs compostas por espaço e funções de autorização no esquema `private` não exposto pela API. O criador de um espaço recebe papel `admin` por gatilho. Datas parciais são armazenadas como partes conhecidas, sem inventar precisão. As migrações foram validadas com pgTAP; esta etapa ainda não carrega eventos reais.

A Etapa 2B.1 implementou login, logout, recuperação de senha, cliente Supabase SSR por requisição, cookies HTTP-only e proteção de rotas. `getUser()` valida a identidade no servidor; `profiles` é lida pela própria sessão e criada no primeiro login, se ausente. A Etapa 2B.2 implementou convites e vínculo transacional ao espaço. Não há credenciais privilegiadas no frontend. Consulte [DATABASE.md](DATABASE.md) para o contrato das tabelas e a operação local.

Na Etapa 4B, o formulário envia `FormData` a uma função de servidor TanStack Start. O servidor valida a sessão com `getUser()`, o espaço ativo, o evento e a assinatura inicial dos bytes; então usa o cliente Supabase SSR da mesma sessão para inserir `media` e enviar ao Storage. O JWT fica no servidor, lido dos cookies HTTP-only pelo cliente SSR, e a API de Storage aplica a RLS do usuário. Cada arquivo tem UUID estável na tentativa, caminho gerado pelo servidor e `upsert: false`. Em caso de resposta perdida, a repetição usa o mesmo UUID; a confirmação só marca `ready` depois de consultar metadados do objeto. Registros `pending` não aparecem na lista concluída nem na leitura do Storage. A interface invalida a rota após sucesso, sem F5.

O upload usa o método padrão do Storage até 20 MiB. Acima de 6 MB, uma conexão instável pode exigir repetir o arquivo inteiro; o upload resumível fica para evolução posterior. Não há compensação automática com exclusão física: pendências sem objeto ficam para limpeza controlada da Etapa 4D.
