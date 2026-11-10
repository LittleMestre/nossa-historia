# Google OAuth local (Etapa 2B.3)

O login Google usa o Supabase Auth no servidor: `/auth/google` inicia `signInWithOAuth` com PKCE, `/auth/callback` troca o código por sessão, valida o usuário com `getUser()` e grava a sessão nos cookies HTTP-only já usados pela aplicação. O formulário de e-mail e senha continua disponível. O token de convite, quando presente, retorna somente a `/convite`; não há redirecionamento arbitrário.

## Configuração

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), escolha um projeto, configure a tela de consentimento OAuth e crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**. Em **Origens JavaScript autorizadas**, inclua `http://127.0.0.1:3000`. Em **URIs de redirecionamento autorizados**, inclua **`http://127.0.0.1:54321/auth/v1/callback`**. Caso o aplicativo esteja em modo de teste, adicione o e-mail Google à lista de usuários de teste.
2. No `.env` local, ignorado pelo Git, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_OAUTH_ENABLED=true`. Mantenha `VITE_APP_ORIGIN=http://127.0.0.1:3000`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` conforme a instalação atual. O segredo Google fica somente no ambiente do servidor e do Supabase CLI; nunca use o prefixo `VITE_` nele.
3. Em `supabase/config.toml`, descomente o bloco `[auth.external.google]` que já está preparado após `[auth.external.apple]`:

   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(GOOGLE_CLIENT_ID)"
   secret = "env(GOOGLE_CLIENT_SECRET)"
   skip_nonce_check = false
   ```

   O projeto já permite `/auth/callback**` em `additional_redirect_urls`. Em um projeto hospedado, habilite o provedor e cadastre a URL de callback correspondente no painel Supabase, mantendo a URL da aplicação na lista de Redirect URLs.

4. Reinicie apenas os serviços com `npx supabase stop` seguido de `npx supabase start`. **Não use `npx supabase db reset`**: ele recria o banco e perde os dados locais. Reinicie também `npm run dev` para carregar o `.env` atualizado.

Enquanto essas etapas não forem concluídas, o botão aparece desativado. `GOOGLE_OAUTH_ENABLED` deve ser `true` somente depois de habilitar o provedor no Supabase; a aplicação também exige ID e segredo definidos para ativar o botão.

## Validação

1. Tenha uma conta **já existente e com e-mail confirmado** no Supabase Auth local. Use exatamente esse e-mail em uma conta Google autorizada na tela de consentimento. Não é necessário que a conta já tenha um `profile`: o callback cria o perfil da própria conta, sem criar associação a um espaço.
2. Abra `/entrar` e clique em **Continuar com Google**. Após consentir, confirme que o navegador volta a `/espacos` e que o mesmo usuário do Supabase Auth continua sendo usado. Verifique em Authentication > Users / Identities que a identidade Google ficou vinculada à conta existente; confirme que não surgiu um segundo usuário.
3. Saia e repita o login. Para um convite pendente destinado ao mesmo e-mail, abra `/entrar?token=<token-do-convite>`, entre com Google e confirme que o retorno chega a `/convite` para o aceite normal. O callback não concede papel ou associação por si só.
4. Cancele o consentimento para conferir a mensagem no login. Tente uma conta Google cujo e-mail não exista no Supabase Auth: ela deve ser recusada, sem criar usuário, pois `enable_signup = false` permanece ativo.

O Supabase [vincula automaticamente identidades do mesmo e-mail verificado](https://supabase.com/docs/guides/auth/auth-identity-linking). Para e-mails diferentes não há vinculação automática. A configuração `enable_signup = false` impede criação de conta via OAuth; para contas novas, siga o fluxo de convites já existente antes de tentar entrar com Google. O comportamento de vinculação de uma conta existente depende de o e-mail estar confirmado e de as regras do Supabase Auth aplicarem a vinculação automática. Se a instalação recusar esse caso, confira a versão e os logs do serviço Auth antes de modificar a política de cadastro; não habilite cadastro público para contornar a recusa.
