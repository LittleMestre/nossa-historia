# Nossa História no Expo Go · Etapa 6C

Na pasta `mobile/`, use `npm ci` na primeira instalação e `npm start -- --go --lan` para iniciar. Conecte o celular e o Ubuntu à mesma rede e leia o QR code com a câmera do iPhone ou pelo Expo Go no Android. O projeto usa o SDK 58. As Etapas 6A e 6B foram validadas no iPhone. A Etapa 6C aguarda a validação dos dados reais no aparelho.

## Demonstração para a apresentação

Em uma máquina nova com o código da demonstração, inicie o Metro sem carregar arquivos de ambiente do projeto.

```bash
cd mobile
npm ci
EXPO_NO_DOTENV=1 EXPO_PUBLIC_DEMO_MODE=true npm start -- --go --lan
```

Conecte o computador e o iPhone à mesma rede e abra o QR code com a câmera. No iPhone físico, use a mesma conta Expo na CLI (`npx expo login`) e no Expo Go. Faça a primeira abertura antes da apresentação. A instalação e a abertura do projeto pelo Expo Go dependem do ambiente Expo e do Metro. A demonstração salva seus registros e cópias das fotos no aparelho e dispensa o Supabase. Para o ensaio, escolha fotos já baixadas no iPhone. [Abertura de projetos no Expo Go para iOS](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)

1. Toque em **Explorar demonstração → Eventos → Criar acontecimento**. Preencha o título e salve com a data de hoje, já preenchida. O formulário também aceita datas parciais, intervalos e data desconhecida.
2. Nos detalhes, toque em **Adicionar fotografias** e escolha uma ou mais imagens. Abra uma foto nos detalhes ou na aba **Galeria**. Confira o cartão e o mosaico em **Início**, **Linha do tempo** e **Eventos**.
3. Use **Editar acontecimento** para alterar o título. Feche e reabra o Expo Go no mesmo projeto, toque em **Explorar demonstração** e confira o título e a foto. Mantenha o Metro acessível na rede durante a reabertura.
4. Abra a foto e toque em **Excluir fotografia**. Depois, abra o acontecimento e toque em **Excluir acontecimento**. Os dois fluxos pedem confirmação.
5. Em **Pessoas**, cadastre ou edite uma pessoa. Em **Sua conta → Restaurar demonstração**, confirme para recuperar os registros fictícios e remover as cópias de fotos que adicionou.

## Supabase local no iPhone

O Supabase local mantém API, banco, Studio e Mailpit publicados pelo Docker somente em loopback. O Caddy roda em primeiro plano, com HTTPS em `192.168.15.5:54443`, e encaminha apenas os caminhos e métodos desta etapa ao gateway local. O acesso é limitado ao IPv4 do iPhone e ao próprio Ubuntu para diagnóstico. O túnel do Expo transporta o aplicativo. A API segue pela rede doméstica. Mantenha a porta 54443 sem encaminhamento no roteador.

### 1. Preparar o proxy no Ubuntu

Na raiz do repositório, verifique o endereço, a interface e as portas. Nos comandos seguintes, ajuste `NH_LAN` e `NH_IFACE` se a rede mudar. Encontre o IPv4 do iPhone em **Ajustes → Wi‑Fi → ⓘ da rede**.

```bash
ip -br -4 addr
ip -4 route
docker ps --format '{{.Names}} {{.Ports}}'
ss -ltn '( sport = :54321 or sport = :54322 or sport = :54323 or sport = :54324 or sport = :54443 )'
export NH_LAN=192.168.15.5 NH_IFACE=enp6s0
read -rp 'IPv4 do iPhone no Wi-Fi: ' NH_PHONE
export NH_PHONE
ip -4 route get "$NH_PHONE"
```

Confira se a rota para o iPhone usa a interface doméstica diretamente e se os mapeamentos do Supabase começam com `127.0.0.1`. Se o stack estiver parado, execute `npx supabase start` na raiz. Se o UFW estiver ativo, a primeira regra permite o iPhone pela interface doméstica e a segunda bloqueia outros endereços na porta do proxy. Anote as regras para removê-las ao final. Com UFW inativo, o próprio proxy limita os IPs e mantém o TLS obrigatório.

```bash
sudo ufw status numbered
# Execute as próximas duas linhas apenas se o UFW estiver ativo.
sudo ufw insert 1 allow in on "$NH_IFACE" from "$NH_PHONE" to "$NH_LAN" port 54443 proto tcp
sudo ufw insert 2 deny in to "$NH_LAN" port 54443 proto tcp
```

Baixe e extraia o pacote do Ubuntu em uma pasta privada. Isso permite executar o Caddy sem instalar um serviço no sistema. O arquivo abaixo desativa a porta HTTP de redirecionamento, a API administrativa e a instalação automática da CA no Ubuntu.

```bash
export NH_PROXY_DIR="$(mktemp -d /tmp/nossa-6c-proxy.XXXXXX)"
export XDG_DATA_HOME="$NH_PROXY_DIR/data" XDG_CONFIG_HOME="$NH_PROXY_DIR/config"
(cd "$NH_PROXY_DIR" && apt download caddy && dpkg-deb -x ./caddy_*.deb .)
cat > "$NH_PROXY_DIR/Caddyfile" <<'CADDY'
{
    admin off
    auto_https disable_redirects
    skip_install_trust
    servers {
        protocols h1 h2
    }
}

https://{$NH_LAN}:54443 {
    bind {$NH_LAN}
    tls internal

    @outside not remote_ip {$NH_PHONE} {$NH_LAN}
    @read {
        method GET HEAD
        path /auth/v1/user /rest/v1/space_members /rest/v1/events /rest/v1/categories /rest/v1/media /rest/v1/event_participants /rest/v1/people /storage/v1/object/sign/family-media/*
    }
    @post {
        method POST
        path /auth/v1/token /auth/v1/logout /storage/v1/object/sign/family-media
    }

    route {
        abort @outside
        respond /healthz "Nossa Historia LAN OK" 200
        reverse_proxy @read 127.0.0.1:54321
        reverse_proxy @post 127.0.0.1:54321
        respond 404
    }
}
CADDY
printf 'Pasta do proxy: %s\n' "$NH_PROXY_DIR"
"$NH_PROXY_DIR/usr/bin/caddy" validate --config "$NH_PROXY_DIR/Caddyfile" --adapter caddyfile
"$NH_PROXY_DIR/usr/bin/caddy" run --config "$NH_PROXY_DIR/Caddyfile" --adapter caddyfile
```

Em outro terminal, use o caminho impresso para localizar o certificado público em `$NH_PROXY_DIR/data/caddy/pki/authorities/local/root.crt`. Transfira somente esse arquivo ao iPhone e instale o perfil. Em **Ajustes → Geral → Sobre → Ajustes de Confiança de Certificados**, ative a confiança total para essa CA. Abra `https://192.168.15.5:54443/healthz` no Safari. A resposta esperada é `Nossa Historia LAN OK`, sem alerta de certificado. Se o Safari não alcançar a porta, confira o IPv4 do iPhone, o UFW e se o Wi-Fi isola os aparelhos. [Confiança de certificados no iOS](https://support.apple.com/pt-br/102390)

### 2. Configurar e abrir o Expo

Na raiz, use `npx supabase status` para identificar a **Publishable key** do Supabase local. Preencha `mobile/.env.local`, ignorado pelo Git. Use a mesma origem HTTPS que abriu no Safari e a chave pública `sb_publishable_…`. O login por senha usa o gateway através do proxy, e o SDK monta as URLs assinadas com a origem configurada. As URLs de redirecionamento da web no Supabase Auth podem continuar apontando para loopback.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://192.168.15.5:54443
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave_local
EXPO_PUBLIC_DEMO_MODE=false
```

```bash
cd mobile
npm start -- --go --lan --clear
```

Abra o QR code com a câmera do iPhone e permita acesso à rede local para o Expo Go. O aplicativo aceita a chave pública. As chaves `sb_secret_…` e `service_role` são exclusivas do servidor. A opção **Explorar demonstração** continua disponível na entrada. [Variáveis do Expo](https://docs.expo.dev/guides/environment-variables/) · [Chaves Supabase](https://supabase.com/docs/guides/getting-started/api-keys)

### 3. Validar dados reais no iPhone

1. Toque em **Entrar na minha conta** e use uma conta que já entra na web local. O app confirma a identidade no Auth antes de carregar os espaços. Compare o espaço selecionado com o da web. Se aparecer apenas um espaço, o app o seleciona automaticamente.
2. Compare um evento real nas abas **Início**, **Linha do tempo** e **Eventos**. Confira datas parciais e intervalos quando existirem no espaço. Abra um evento com participante e confira a mesma pessoa na aba **Pessoas**.
3. Em **Galeria**, abra uma foto real e depois abra um evento com mosaico. Volte ao app após mais de um minuto e abra a foto novamente para conferir a renovação da assinatura de 60 segundos.
4. Encerre o Expo Go pelo seletor de apps e reabra o projeto. Confira se a sessão volta sem digitar a senha.
5. Em **Sua conta**, toque em **Trocar conta** e entre com outra conta existente. Confira os espaços dela e verifique que dados da conta anterior sumiram. Se houver uma conta sem acesso ao espaço anterior, use-a para conferir a separação. Use **Sair** e reabra o app para verificar que a sessão foi removida. A demonstração deve mostrar somente o conteúdo fictício.

Na base local verificada nesta etapa, as três contas pertencem ao mesmo espaço. A leitura cruzada foi verificada por RLS com uma identidade sem associação, em transação somente leitura. Há eventos com ano, mês, dia e data desconhecida. O ensaio de intervalos com dados reais depende de um registro desse tipo.

Ao terminar, pare o Caddy com `Ctrl+C` e remova o perfil da CA do iPhone em **Ajustes → Geral → VPN e Gerenciamento de Dispositivo**. Se adicionou as duas regras UFW, remova-as com `sudo ufw delete deny in to "$NH_LAN" port 54443 proto tcp` e `sudo ufw delete allow in on "$NH_IFACE" from "$NH_PHONE" to "$NH_LAN" port 54443 proto tcp`.

### Caminho futuro com Supabase hospedado

Quando o projeto hospedado estiver autorizado e preparado, obtenha a URL HTTPS e a chave **Publishable** no painel **Connect**, use os dois valores no ambiente Expo e entre novamente com uma conta daquele ambiente. Valide as políticas por espaço e o bucket privado no ambiente hospedado antes de conectar o app a dados reais. A configuração hospedada dispensa o proxy e a CA local. [API do Supabase hospedado](https://supabase.com/docs/guides/api/creating-routes)

## Ensaio de apresentação

1. Abra o aplicativo sem sessão validada. Toque em **Entrar na minha conta** para ver o formulário. Sem servidor configurado, a tentativa explica a indisponibilidade. Volte e toque em **Explorar demonstração**.
2. Em **Início**, arraste o cartão para a esquerda para avançar no tempo. O futuro aparece acima e o passado abaixo. Toque em um cartão lateral para trazê-lo ao centro. Toque no central para abrir a história. Experimente Anterior, Próximo, Hoje e o salto para 2020.
3. Abra **Linha do tempo** pela segunda aba. Percorra os cartões no eixo horizontal. Em ambas as abas, abra **Filtros**, combine ano, categoria e tipo. O ano 2000 inclui o intervalo 1998–2001. Experimente Sem data e Limpar filtros.
4. Em **Galeria**, abra uma fotografia, avance para a próxima e visite o acontecimento. Em **Eventos**, confira os mosaicos, a data original e os participantes. Em **Pessoas**, abra Ana e siga até um evento em que ela aparece.
5. Abra um formulário de cadastro ou edição, digite uma alteração e toque em **Salvar**. Use **Cancelar** para descartar o que ficou no formulário.
6. No ícone de perfil do cabeçalho, escolha **Escuro**, **Claro** ou o tema do aparelho. A preferência fica no AsyncStorage. Abra os espaços e saia da demonstração. Em uma sessão real, **Trocar conta** encerra a sessão local e abre o login.
7. Confira no iPhone a distinção entre toque e arraste, o foco ao soltar, a barra inferior, o teclado do salto por ano e a preferência de redução de movimento. Repita em Android e em uma tela estreita quando disponíveis.

## Espiral e dados

`src/components/Experience.tsx` prepara o eixo cronológico, os filtros e os marcos de hoje e do ano escolhido. Acontecimentos sem data ficam em uma seção própria. `Stage.tsx` usa Gesture Handler e Reanimated. Os worklets calculam translação, rotação, perspectiva, escala, opacidade e ordem visual a partir do foco fracionário. A matemática vem de `spiral-model.ts` da web, adaptada em `src/lib/spiral-model.ts`. A janela monta até três cartões de cada lado, ou dois em telas com menos de 360 pontos. Os botões também permitem navegar com redução de movimento.

A demonstração começa com sete acontecimentos fictícios, duas pessoas e fotografias ilustrativas empacotadas em `assets/demo/`. As alterações locais ficam no AsyncStorage e as imagens importadas ficam no diretório de documentos do aplicativo. No modo conectado, o cliente lê associações, eventos, categorias, pessoas e vínculos sob RLS e solicita assinaturas de 60 segundos para fotos prontas do bucket privado. Os limites por carga são 500 eventos, 200 fotos e 500 vínculos. Neste modo, os formulários são prévias e as edições são feitas na web.

## Verificações locais

Em `mobile/`, use `npm run typecheck`, `npm run lint` e `npx expo-doctor`.
