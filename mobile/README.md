# Nossa História no Expo Go · Etapa 6B

Na pasta `mobile/`, use `npm ci` na primeira instalação e `npm start -- --go --lan` para iniciar. Conecte o celular e o Ubuntu à mesma rede e leia o QR code com a câmera do iPhone ou pelo Expo Go no Android. O projeto usa o SDK 58. O iPhone físico abriu a Etapa 6A. Os gestos, o layout e o login real da 6B aguardam ensaio no aparelho.

## Ensaio de apresentação

1. Abra o aplicativo sem sessão validada. Toque em **Entrar na minha conta** para ver o formulário. Sem servidor configurado, a tentativa explica a indisponibilidade. Volte e toque em **Explorar demonstração**.
2. Em **Início**, arraste o cartão para a esquerda para avançar no tempo. O futuro aparece acima e o passado abaixo. Toque em um cartão lateral para trazê-lo ao centro. Toque no central para abrir a história. Experimente Anterior, Próximo, Hoje e o salto para 2020.
3. Abra **Linha do tempo** pela segunda aba. Percorra os cartões no eixo horizontal. Em ambas as abas, abra **Filtros**, combine ano, categoria e tipo. O ano 2000 inclui o intervalo 1998–2001. Experimente Sem data e Limpar filtros.
4. Em **Galeria**, abra uma fotografia, avance para a próxima e visite o acontecimento. Em **Eventos**, confira os mosaicos, a data original e os participantes. Em **Pessoas**, abra Ana e siga até um evento em que ela aparece.
5. Abra um formulário de cadastro ou edição, digite uma alteração e feche. Estes formulários são prévias locais descartáveis. O papel de administrador da demonstração é simulado. Convites, lixeira e persistência de edições continuam disponíveis pela web.
6. No ícone de perfil do cabeçalho, escolha **Escuro**, **Claro** ou o tema do aparelho. A preferência fica no AsyncStorage. Abra os espaços e saia da demonstração. Em uma sessão real, **Trocar conta** encerra a sessão local e abre o login.
7. Confira no iPhone a distinção entre toque e arraste, o foco ao soltar, a barra inferior, o teclado do salto por ano e a preferência de redução de movimento. Repita em Android e em uma tela estreita quando disponíveis.

## Espiral e dados

`src/components/Experience.tsx` prepara o eixo cronológico, os filtros e os marcos de hoje e do ano escolhido. Acontecimentos sem data ficam em uma seção própria. `Stage.tsx` usa Gesture Handler e Reanimated. Os worklets calculam translação, rotação, perspectiva, escala, opacidade e ordem visual a partir do foco fracionário. A matemática vem de `spiral-model.ts` da web, adaptada em `src/lib/spiral-model.ts`. A janela monta até três cartões de cada lado, ou dois em telas com menos de 360 pontos. Os botões também permitem navegar com redução de movimento.

A demonstração usa sete acontecimentos fictícios, duas pessoas e fotografias ilustrativas empacotadas em `assets/demo/`. Funciona sem acesso ao Supabase. Para o modo conectado, configure `mobile/.env` e reinicie o Metro.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://seu-endpoint-autorizado
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```

Use exclusivamente a chave pública. O login exige e-mail e senha de uma conta existente. O cliente recupera a sessão com Supabase Auth, lê associações, eventos, categorias, pessoas e vínculos sob RLS e solicita assinaturas de 60 segundos para fotos prontas do bucket privado. Os limites por carga são 500 eventos, 200 fotos e 500 vínculos. Os formulários mobile não escrevem no banco. OAuth Google e operações administrativas continuam na web.

O gateway local foi configurado para `127.0.0.1:54321` no Ubuntu. No telefone, loopback aponta para o próprio aparelho. O túnel Expo transporta o aplicativo. Para testar dados reais, é necessário um endpoint Supabase alcançável pelo telefone em uma rede privada autorizada ou por HTTPS. A demonstração visual independe dessa configuração.

## Verificações locais

Em `mobile/`, use `npm run check`, `npm run lint` e `npx expo export --platform ios --platform android`. Na raiz, use `npm run typecheck` e `npm run build` para a web.
