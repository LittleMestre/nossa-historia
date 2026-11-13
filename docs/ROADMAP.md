# Roadmap

- [x] Etapa 0: scaffold oficial, dependências base, shadcn/ui, configuração de qualidade, página inicial temporária e documentação.
- [x] Etapa 1: identidade visual, cinco rotas, navegação responsiva, tema claro/escuro, estados vazios/carregamento e primeira tela de produto.
- [x] Etapa 2A: Supabase local, esquema versionado, RLS, grants, auditoria e tipos gerados; 68 testes pgTAP passaram.
- [x] Etapa 2B.1: login, logout, recuperação de senha, sessão SSR e proteção de rotas com Supabase Auth.
- [x] Etapa 2B.2: criação e seleção do espaço, convites por e-mail, aceite atômico, visualização de membros e auditoria.
- [ ] Segurança de Storage: bucket privado, políticas e testes antes do primeiro upload (Etapa 4).
- [x] Etapa 3A: cadastro, listagem, detalhes, edição por autoria e exclusão lógica de eventos no espaço ativo, com datas de precisão variável.
- [ ] Etapa 3B: cadastro de pessoas e vínculo de participantes aos eventos.
- [ ] Etapa 4: upload de fotos, galeria e mídia privada.
- [ ] Etapa 5: linha do tempo e filtros.
- [ ] Etapa 6: busca textual e estruturada com paginação.
- [ ] Etapa 7: comentários, lembranças, subeventos e moderação auditada.
- [ ] Etapa 8: testes completos, acessibilidade, desempenho e preparação para GitHub.

Vídeos grandes e upload resumível ficam após validação do núcleo funcional. Nenhum item pendente deve ser apresentado como funcional.

Na Etapa 2B.1, a autenticação web usa cookies SSR e valida a identidade com Supabase Auth no servidor. As páginas privadas exigem sessão; a autorização dos dados permanece nas políticas RLS. O primeiro login cria o `profile` da própria conta quando ausente, usando a política existente. A criação de contas continua privada; a Etapa 2B.2 acrescentou os convites e o vínculo transacional a `space_members`.

Na Etapa 0, o runner de testes foi executado e não encontrou casos; testes de regras de negócio começam junto com os respectivos módulos. A auditoria de dependências de produção não encontrou alertas. O conjunto completo de dependências ainda apresenta alertas moderados em ferramentas de desenvolvimento, a revisar antes da entrega final.

Na Etapa 1, há um teste de componente para navegação por ano/mês e testes de navegador em desktop e viewport mobile para rotas, tema e largura da página. A busca e a galeria de mídia real continuam indisponíveis até as etapas correspondentes.

Atualização da direção visual: a página inicial e `/linha-do-tempo` agora usam um eixo horizontal cinematográfico com foco central, data atual real, salto por ano, posicionamento explícito acima/abaixo e interação por teclado, ponteiro e toque. A integração com eventos persistidos, filtros e navegação temporal completa permanece na Etapa 5.

Validação visual anterior: rota de demonstração exclusiva de desenvolvimento com cinco eventos e imagens fictícias, sem persistência. A Etapa 2A não alterou o frontend. O banco local está funcional, mas ainda não é consumido pela interface; nenhum conteúdo privado deve ser exposto até Auth/SSR e Storage seguro.

Integração visual da espiral 3D: a home usa `SpiralTimelineView` com `spiral-model.ts` para geometria e navegação. A rota `/linha-do-tempo` mantém a apresentação horizontal, e `/demo-espiral` reutiliza os cinco eventos fictícios somente em desenvolvimento. A home continua vazia até a integração autenticada de eventos; a Etapa 5 segue pendente para dados reais, filtros e navegação temporal completa. Nenhuma migração, política RLS, autenticação ou Storage foi alterado nesta integração.

Na Etapa 2B.2, o administrador convida leitores ou colaboradores por e-mail. O Supabase Auth envia convite de conta nova ou link de acesso para conta já confirmada. O token do espaço é aleatório, fica apenas como hash SHA-256 no banco, expira em uma hora e é validado em uma função transacional junto do e-mail confirmado. O aceite repetido pela mesma conta retorna o espaço sem duplicar associação. Revogação, expiração, e-mail incorreto e acesso entre famílias são cobertos por testes SQL locais. A configuração hospedada ainda precisa de `SUPABASE_SECRET_KEY` somente no servidor e de `/convite**` na lista de Redirect URLs do Auth; não houve deploy.

Na Etapa 3A, `/eventos` usa registros reais do espaço ativo para criar e listar acontecimentos; `/eventos/$eventId` mostra detalhes, permite edição ao autor ou administrador e exclusão lógica com confirmação. A data mantém apenas ano, mês e dia informados, inclusive intervalos e datas desconhecidas. As funções do servidor validam entrada com Zod, confirmam identidade e espaço ativo e usam o cliente Supabase da sessão, sujeito às políticas RLS e FKs compostas existentes. Não houve migração nem alteração do Storage. Categorias e locais existentes podem ser selecionados, mas o cadastro desses catálogos e o vínculo de pessoas ficam para etapas futuras. A espiral e a linha do tempo ainda não consomem esses eventos.
