# Banco de dados e segurança — Etapa 2A

O esquema está em migrações versionadas em `supabase/migrations/`. Foi aplicado e testado no Supabase local (PostgreSQL 17). Nenhum projeto hospedado está ligado ao repositório. `supabase/seed.sql` fica vazio; verificações locais usam identidades fictícias dentro de transações revertidas.

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

`events`, `media`, `comments` e `memories` usam exclusão lógica (`deleted_at`, `deleted_by`). Não há `DELETE` físico concedido a clientes nessas tabelas. Em `media`, somente administradores leem registros excluídos; as consultas normais filtram `deleted_at IS NULL`. A coluna de auditoria não pode ser escrita diretamente pelo cliente.

## Tempo e linha do tempo

`date_precision` aceita `day`, `month`, `year`, `range`, `unknown`. Os campos `start_year`, `start_month`, `start_day` e os equivalentes `end_*` guardam somente as partes conhecidas. Uma data de 2018 não recebe mês/dia inventados; um mês de 2018 não recebe dia. `range` guarda os limites informados e `approximate_date_label` pode preservar a expressão original. Constraints validam composição, ordem e dias reais do calendário. `created_at` é a data do cadastro, separada da data do evento. `moment_type` (`family`, `individual`, `other`) e `timeline_position` (`above`, `below`, `auto`) são explícitos; a posição não é inferida da categoria. A adaptação para `TimelineEvent` fica para a integração futura, sem alterar o componente visual nesta etapa.

## Autorização

Todas as 13 tabelas privadas têm RLS. `anon` não recebe grants. `authenticated` recebe somente operações e colunas necessárias, além de políticas por linha. Funções `SECURITY DEFINER` no esquema não exposto `private` consultam membership sem recursão entre `spaces` e `space_members`; têm `search_path` fixado. As FKs compostas bloqueiam referências entre espaços mesmo quando um ID é conhecido.

- `viewer`: leitura no próprio espaço; não cria nem altera conteúdo.
- `contributor`: cria eventos, pessoas, catálogos, mídia, comentários e memórias no próprio espaço; edita apenas conteúdo de sua autoria. Pode contribuir com mídia ou memória em evento de outro autor, mas não editar o evento nem a mídia alheia.
- `admin`: além de contribuir, gerencia membros e convites e modera conteúdo do próprio espaço. Moderações e alterações de papel são auditadas. Não modifica o próprio papel, não deixa um espaço sem administrador e não acessa outro espaço.

Convites só podem ser criados e revogados por administradores. O aceite da Etapa 2B.2 usa token aleatório com hash no banco, e-mail confirmado e função transacional; `accepted` não pode ser marcado diretamente por um cliente. O cadastro público está desativado no `supabase/config.toml` local.

O `INSERT` de um espaço cria seu administrador em um gatilho `AFTER INSERT`. Por isso, um cliente deve inserir sem `RETURNING` imediato e fazer uma leitura separada após o comando; a associação já existirá nessa segunda consulta. O fluxo de criação de espaços será orquestrado em 2B.

## Armazenamento

Na Etapa 4A, a migração `20261115120000_private_family_media_storage.sql` cria o bucket privado `family-media`, com limite de 20 MiB por objeto e MIME `image/jpeg`, `image/png` ou `image/webp`. A tabela `media` mantém seu limite anterior de 50 MiB; o bucket impõe o limite mais restrito para fotos, sem alterar o esquema existente. O bucket é definido somente na migração, não em `config.toml`. Caminho no banco não significa arquivo existente.

As políticas de `storage.objects` exigem caminho canônico `space_id/event_id/media_id/arquivo`, com UUIDs minúsculos e nome final simples, e um registro `media` ativo cujo caminho, espaço e evento coincidam exatamente. O evento também precisa estar ativo. Leitura requer associação ao espaço; upload requer papel `admin` ou `contributor` e `uploaded_by = auth.uid()`. Assim, um colaborador pode fotografar evento de outro autor sem editá-lo. Não há políticas `UPDATE` ou `DELETE` para objetos: upsert, substituição, movimento e remoção física por clientes ficam bloqueados. A exclusão lógica de `media` corta listagem, leitura autenticada e novas assinaturas; o administrador também não lê objetos de mídias excluídas. URLs já assinadas podem continuar válidas por até 60 segundos. Limpeza física futura exige retenção, verificação de referências, execução controlada e autorização explícita; revogação emergencial não é implementada nesta etapa.

A migração 4B `20261115130000_media_upload_state.sql` acrescenta `media.upload_status` (`pending`/`ready`) sem alterar migrações anteriores. O estado padrão é `pending`; registros preexistentes com objeto correspondente são preservados como `ready`. Somente `public.finalize_media_upload` marca um registro como pronto, após conferir usuário autor, permissão, evento ativo, caminho, MIME e tamanho do objeto no Storage. A listagem da aplicação filtra `ready`; a política de leitura de objetos também exige `ready`. O autor pode ver seu registro pendente para repetir uma tentativa com o mesmo UUID, mas isso não libera o arquivo. Não há exclusão física automática de falhas parciais.

As migrações 4D `20261117120000_photo_management.sql`, `20261117121000_photo_trash_visibility.sql`, `20261117122000_scope_pending_confirmation.sql`, `20261117123000_boolean_membership_guards.sql` e `20261117124000_orphan_photo_inventory.sql` adicionam operações restritas para fotos. `delete_media_photo` aceita apenas autor ou administrador do espaço e usa o gatilho existente para definir `deleted_at/deleted_by`; `restore_media_photo` exige administrador, evento ativo, mídia `ready` e objeto com bucket, caminho, MIME e tamanho coerentes. O grant direto de `UPDATE(deleted_at)` em `media` foi removido, impedindo restauração que contorne a verificação do objeto. O gatilho `media_activity_audit` registra exclusões e restaurações com ator, espaço, mídia e horário, preservando também a auditoria de moderação anterior. A política de `media` permite ao administrador ver metadados excluídos de eventos excluídos, mas não amplia a leitura de objetos do Storage. `list_pending_photo_uploads` classifica o objeto como `valid`, `missing` ou `mismatch`; `confirm_pending_photo_upload` marca `ready` somente com objeto válido e evento ativo. `list_orphan_photo_objects` mostra apenas metadados de objetos do espaço ativo sem registro `media`, sem oferecer remoção. Todas as funções verificam `auth.uid()` e papel no banco. A correção de `private.is_admin`/`private.can_contribute` garante `false` para não membros, evitando condições PL/pgSQL com `NULL`.

Um envio `pending` com mais de 24 horas é apenas **possivelmente interrompido**; a idade não muda seu estado. Os registros e objetos permanecem preservados. Se o autor ainda possui o arquivo e o UUID da tentativa, o upload pode ser repetido; se a seleção do navegador foi perdida, a recuperação automática dessa tentativa não existe. Objetos sem registro referenciado e pendências inválidas são apenas candidatos a investigação futura, nunca removidos automaticamente. A verificação por `storage.objects` confirma o registro e seus metadados, mas não lê bytes físicos do provedor; uma falha rara entre metadados e bytes ainda pode aparecer ao abrir a imagem.

Depois de aplicar as migrações pendentes no Supabase local com `HOME=/tmp SUPABASE_DISABLE_TELEMETRY=1 npx supabase migration up`, a Etapa 4B pode ser testada manualmente em `/eventos/<id>`: entre como administrador ou colaborador, selecione o espaço, abra um evento existente, escolha fotos JPEG/PNG/WebP e confirme. A lista simples mostra apenas envios concluídos; leitores não recebem o formulário. Não use `db reset`.

Para aplicar ao banco local existente, com a stack deste projeto já iniciada, use `HOME=/tmp SUPABASE_DISABLE_TELEMETRY=1 npx supabase migration up` na raiz. O comando aplica somente migrações pendentes; não use `db reset` nem conexão remota. Confira `storage.buckets` e `pg_policies` depois. Não é necessário reiniciar a stack para aplicar esta migração. A verificação 4A usou identidades e metadados fictícios em uma transação revertida, exercitando a RLS real de `storage.objects`; não realizou upload HTTP de bytes.

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

## Etapa 2B.2 — aceite de convites

A migração `20261109120000_accept_invitations.sql` adiciona `public.accept_invitation(text)`, executável apenas por `authenticated`. A função compara o hash SHA-256 do token, exige e-mail confirmado em `auth.users`, trava o convite para serializar aceites, valida estado e expiração, cria a associação com o papel do convite e marca o aceite na mesma transação. Repetir o aceite pela mesma conta é idempotente; outra conta não pode reutilizá-lo. O hash continua sem permissão de leitura. O gatilho de auditoria existente registra a associação e a alteração do convite. Os testes fictícios em `supabase/tests/invitation_acceptance_test.sql` são revertidos após a execução.
