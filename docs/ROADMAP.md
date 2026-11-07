# Roadmap

- [x] Etapa 0: scaffold oficial, dependências base, shadcn/ui, configuração de qualidade, página inicial temporária e documentação.
- [x] Etapa 1: identidade visual, cinco rotas, navegação responsiva, tema claro/escuro, estados vazios/carregamento e primeira tela de produto.
- [x] Etapa 2A: Supabase local, esquema versionado, RLS, grants, auditoria e tipos gerados; 68 testes pgTAP passaram.
- [ ] Etapa 2B: Auth por convite, clientes Supabase, sessão SSR, proteção de rotas e fluxo de membros/convites.
- [ ] Segurança de Storage: bucket privado, políticas e testes antes do primeiro upload (Etapa 4).
- [ ] Etapa 3: eventos, pessoas, datas de precisão variável e edição por autoria.
- [ ] Etapa 4: upload de fotos, galeria e mídia privada.
- [ ] Etapa 5: linha do tempo e filtros.
- [ ] Etapa 6: busca textual e estruturada com paginação.
- [ ] Etapa 7: comentários, lembranças, subeventos e moderação auditada.
- [ ] Etapa 8: testes completos, acessibilidade, desempenho e preparação para GitHub.

Vídeos grandes e upload resumível ficam após validação do núcleo funcional. Nenhum item pendente deve ser apresentado como funcional.

Na Etapa 0, o runner de testes foi executado e não encontrou casos; testes de regras de negócio começam junto com os respectivos módulos. A auditoria de dependências de produção não encontrou alertas. O conjunto completo de dependências ainda apresenta alertas moderados em ferramentas de desenvolvimento, a revisar antes da entrega final.

Na Etapa 1, há um teste de componente para navegação por ano/mês e testes de navegador em desktop e viewport mobile para rotas, tema e largura da página. A busca, o cadastro de eventos e a galeria de mídia real continuam indisponíveis até as etapas de backend e domínio correspondentes.

Atualização da direção visual: a página inicial e `/linha-do-tempo` agora usam um eixo horizontal cinematográfico com foco central, data atual real, salto por ano, posicionamento explícito acima/abaixo e interação por teclado, ponteiro e toque. A integração com eventos persistidos, filtros e navegação temporal completa permanece na Etapa 5.

Validação visual anterior: rota de demonstração exclusiva de desenvolvimento com cinco eventos e imagens fictícias, sem persistência. A Etapa 2A não alterou o frontend. O banco local está funcional, mas ainda não é consumido pela interface; nenhum conteúdo privado deve ser exposto até Auth/SSR e Storage seguro.

Integração visual da espiral 3D: a home usa `SpiralTimelineView` com `spiral-model.ts` para geometria e navegação. A rota `/linha-do-tempo` mantém a apresentação horizontal, e `/demo-espiral` reutiliza os cinco eventos fictícios somente em desenvolvimento. A home continua vazia até a integração autenticada de eventos; a Etapa 5 segue pendente para dados reais, filtros e navegação temporal completa. Nenhuma migração, política RLS, autenticação ou Storage foi alterado nesta integração.
