# Migração futura para Lovable

Este projeto nasce em TanStack Start e Supabase. A capacidade de importar ou editar código TanStack Start no Lovable precisa ser verificada na data da migração; não há garantia de conversão automática. O repositório, SQL e dados permanecem portáveis, mesmo que a interface precise de adaptação.

Antes de migrar: fazer backup do PostgreSQL, exportar migrações e dados, inventariar buckets e objetos privados, registrar versões do lockfile e mapear variáveis de ambiente. Nunca exportar secrets para o repositório. Usuários de `auth.users` exigem estratégia específica de migração de identidade e sessões; não pressupor cópia direta de senhas.

Depois: configurar URLs, chaves publicáveis e secrets somente no ambiente adequado; reaplicar migrações; recriar buckets e políticas; transferir objetos preservando caminhos e metadados; testar convites, login, RLS entre espaços, autoria, URLs assinadas, busca e build. Planejar janela de corte e rollback antes de alterar o serviço de produção.
