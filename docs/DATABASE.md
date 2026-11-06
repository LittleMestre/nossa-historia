# Banco de dados e segurança — Etapa 2A

O esquema está em seis migrações versionadas em `supabase/migrations/`. Foi aplicado e testado no Supabase local (PostgreSQL 17). Nenhum projeto hospedado está ligado ao repositório. `supabase/seed.sql` fica vazio: somente `supabase/tests/database_security_test.sql` usa identidades fictícias, dentro de transação revertida.

## Tabelas

| Tabela                    | Responsabilidade                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `profiles`                | Dados de apresentação vinculados a `auth.users.id`.                                                                     |
| `spaces`                  | Família/grupo privado; o criador ganha associação `admin` por gatilho.                                                  |
| `space_members`           | Associação única `(space_id, user_id)` e papel `admin`, `contributor` ou `viewer`.                                      |
| `invitations`             | E-mail, papel, prazo, estado e hash SHA-256 do token; o hash não tem permissão de leitura para clientes.                |
| `categories`, `locations` | Catálogos locais a cada espaço, com autor.                                                                              |
| `people`                  | Pessoas retratadas, independentes de contas. Nome único por espaço sem distinção de caixa.                              |
| `events`                  | Eventos e subeventos; a FK `(space_id, parent_event_id)` impede cruzamento entre espaços. Só há um nível de subeventos. |
| `event_participants`      | Associação N:N entre evento e pessoa, com FKs compostas pelo espaço.                                                    |
| `media`                   | Metadados, autoria e caminho privado `space_id/event_id/media_id/arquivo`; **não** faz upload.                          |
| `comments`, `memories`    | Comentários e contribuições textuais independentes, ambos com autoria.                                                  |
| `audit_logs`              | Registro de moderação de terceiros, gestão de membros e convites. Clientes apenas leem se forem administradores.        |

`events`, `media`, `comments` e `memories` usam exclusão lógica (`deleted_at`, `deleted_by`). Não há `DELETE` físico concedido a clientes nessas tabelas. O autor e administradores ainda conseguem ler registros excluídos para recuperação; demais membros não. As consultas da interface deverão filtrar `deleted_at IS NULL`. Um administrador pode restaurar. A coluna de auditoria não pode ser escrita diretamente pelo cliente.

## Tempo e linha do tempo

`date_precision` aceita `day`, `month`, `year`, `range`, `unknown`. Os campos `start_year`, `start_month`, `start_day` e os equivalentes `end_*` guardam somente as partes conhecidas. Uma data de 2018 não recebe mês/dia inventados; um mês de 2018 não recebe dia. `range` guarda os limites informados e `approximate_date_label` pode preservar a expressão original. Constraints validam composição, ordem e dias reais do calendário. `created_at` é a data do cadastro, separada da data do evento. `moment_type` (`family`, `individual`, `other`) e `timeline_position` (`above`, `below`, `auto`) são explícitos; a posição não é inferida da categoria. A adaptação para `TimelineEvent` fica para a integração futura, sem alterar o componente visual nesta etapa.

## Autorização

Todas as 13 tabelas privadas têm RLS. `anon` não recebe grants. `authenticated` recebe somente operações e colunas necessárias, além de políticas por linha. Funções `SECURITY DEFINER` no esquema não exposto `private` consultam membership sem recursão entre `spaces` e `space_members`; têm `search_path` fixado. As FKs compostas bloqueiam referências entre espaços mesmo quando um ID é conhecido.

- `viewer`: leitura no próprio espaço; não cria nem altera conteúdo.
- `contributor`: cria eventos, pessoas, catálogos, mídia, comentários e memórias no próprio espaço; edita apenas conteúdo de sua autoria. Pode contribuir com mídia ou memória em evento de outro autor, mas não editar o evento nem a mídia alheia.
- `admin`: além de contribuir, gerencia membros e convites e modera conteúdo do próprio espaço. Moderações e alterações de papel são auditadas. Não modifica o próprio papel, não deixa um espaço sem administrador e não acessa outro espaço.

Convites só podem ser criados e revogados por administradores. A aceitação do convite, envio de e-mail, geração criptográfica do token e associação do usuário serão implementados em 2B; `accepted` não pode ser marcado diretamente por um cliente. O cadastro público está desativado no `supabase/config.toml` local.

O `INSERT` de um espaço cria seu administrador em um gatilho `AFTER INSERT`. Por isso, um cliente deve inserir sem `RETURNING` imediato e fazer uma leitura separada após o comando; a associação já existirá nessa segunda consulta. O fluxo de criação de espaços será orquestrado em 2B.

## Armazenamento

O esquema contém somente metadados de mídia e limita MIME/tamanho a 50 MiB. **Não existe bucket nem política de Storage nesta etapa.** Portanto nenhum upload ou URL de mídia deve ser exposto até criar bucket privado, políticas `storage.objects` e testes de acesso em 2B/Etapa 4. Caminho no banco não significa arquivo existente. Não usar bucket público nem URL permanente.

## Operação local

Requer Docker ativo e a Supabase CLI instalada via `npm ci`. A configuração padrão da CLI publica portas em todas as interfaces; neste projeto, crie uma vez a rede abaixo para limitar o acesso a `127.0.0.1`:

```bash
docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 nossa-historia-local
npx supabase start --network-id nossa-historia-local
npx supabase migration up
npx supabase test db --network-id nossa-historia-local
npx supabase db lint --network-id nossa-historia-local
npx supabase gen types --lang typescript --schema public > src/types/database.types.ts
npx prettier --write src/types/database.types.ts
npx supabase stop
```

`start` inicia a stack e aplica migrações em um banco novo; `migration up` aplica apenas as pendentes ao banco local existente. `stop` preserva os dados locais. **Não use `db reset` em dados que queira preservar:** ele apaga o banco local antes de reaplicar as migrações. Nunca passe `--remote` sem autorização explícita. O arquivo `src/types/database.types.ts` é gerado do esquema e deve ser regenerado após novas migrações; seus tipos `Insert`/`Update` não codificam grants e RLS, que continuam sendo a autoridade.

Se a rede já existir, não a recrie. Após iniciar, confira `docker ps`: as portas `54321`–`54324` e `54327` deste projeto devem aparecer em `127.0.0.1`, não em `0.0.0.0`. Não altere redes ou contêineres de outros projetos.

Os 68 testes pgTAP cobrem tabelas, RLS, limites de papéis, acesso cruzado, autoria, datas, FKs, subeventos, exclusão lógica, convites, auditoria e criação do primeiro administrador. `db lint` não encontrou erros de esquema. Antes de uso hospedado, repetir os testes no ambiente alvo e adicionar testes do fluxo real de Auth/Storage.
