# Instruções para agentes

- Stack: TypeScript strict, React, TanStack Start/Router/Query, Tailwind 4, shadcn/ui, Supabase Auth/PostgreSQL/Storage.
- Use npm e preserve o lockfile. Execute `npm run typecheck`, `npm run lint`, `npm test` e `npm run build` antes de entregar módulos.
- Rotas ficam em `src/routes`; lógica de domínio em `src/features` quando houver uso real; componentes reutilizáveis em `src/components`; clientes Supabase em `src/lib/supabase`.
- Valide entradas com Zod no limite do servidor. Nunca confie em autorização feita somente no React.
- Toda tabela privada deve ter RLS, políticas por espaço e testes de acesso cruzado antes de ser usada. Storage privado também precisa de políticas.
- Crie migrações SQL versionadas em `supabase/migrations`. Não altere migrações já aplicadas; adicione outra. Guarde a precisão temporal original.
- Preserve autoria. Participantes podem acrescentar conteúdo a eventos alheios, mas não editar ou excluir conteúdo de terceiros. Moderação exige papel de administrador e registro de auditoria.
- Não adicione segredos, tokens, mídias privadas ou credenciais ao Git. Chaves privilegiadas nunca chegam ao frontend.
- Não apresente conteúdo de exemplo como dado real. Não faça push nem publique sem instrução do usuário.
