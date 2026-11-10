# Instruções para agentes

- Stack: TypeScript strict, React, TanStack Start/Router/Query, Tailwind 4, shadcn/ui, Supabase Auth/PostgreSQL/Storage.
- Use npm e preserve o lockfile. Durante o desenvolvimento do MVP, priorize economia de tokens e implementação funcional. Execute apenas `npm run typecheck` e `npm run build` como verificações padrão antes de entregar módulos.
- Não execute `npm test` automaticamente, não rode testes unitários a cada alteração, não execute Playwright ou testes E2E e não crie novos testes automatizados por padrão. Preserve os testes existentes. Reserve a execução completa das suítes automatizadas para a Etapa 8 ou quando o usuário solicitar explicitamente.
- Rotas ficam em `src/routes`; lógica de domínio em `src/features` quando houver uso real; componentes reutilizáveis em `src/components`; clientes Supabase em `src/lib/supabase`.
- Valide entradas com Zod no limite do servidor. Nunca confie em autorização feita somente no React.
- Toda tabela privada deve ter RLS e políticas por espaço. Storage privado também precisa de políticas. Para autenticação, autorização, RLS e armazenamento privado, realize as verificações mínimas de segurança necessárias, incluindo acesso cruzado quando pertinente, antes de usar esses recursos.
- Crie migrações SQL versionadas em `supabase/migrations`. Não altere migrações já aplicadas; adicione outra. Guarde a precisão temporal original.
- Preserve autoria. Participantes podem acrescentar conteúdo a eventos alheios, mas não editar ou excluir conteúdo de terceiros. Moderação exige papel de administrador e registro de auditoria.
- Não adicione segredos, tokens, mídias privadas ou credenciais ao Git. Chaves privilegiadas nunca chegam ao frontend.
- Não apresente conteúdo de exemplo como dado real. Não faça push nem publique sem instrução do usuário.
