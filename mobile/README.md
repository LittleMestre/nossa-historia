# Nossa História Mobile

## Abrir na faculdade

Use Node 24.3 ou superior da série 24 e Expo Go compatível com SDK 58. O computador entrega o JavaScript pelo Metro. As operações da história usam o banco e os arquivos do iPhone. Use a mesma rede Wi-Fi ou hotspot com comunicação entre os aparelhos. Prepare o Expo Go e instale as dependências antes da aula.

Na máquina que já contém as alterações:

```bash
cd ~/pessoal/nossa-historia/mobile
npm ci
EXPO_NO_DOTENV=1 EXPO_PUBLIC_DEMO_MODE=true npx expo start --go --lan --clear --port 8082
```

Leia **o QR desse terminal** com a câmera do iPhone. Se o Expo Go solicitar login, use a mesma conta Expo na CLI e no iPhone. Na entrada aparecem **Nova história · famílias neste aparelho**, **Entrar com Supabase** e **Explorar exemplos fictícios**. Em Eventos, o editor local mostra **Salvar neste aparelho**. [Abertura de projetos no Expo Go para iOS](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)

### Levar o código para outro computador

Um clone só contém as revisões que chegaram ao remoto. Enquanto esta entrega estiver no diretório de trabalho, leve também uma cópia do código mobile atualizado. Na raiz do repositório de origem, o comando abaixo inclui fontes, assets e lockfile, inclusive os novos arquivos de código. A seleção de caminhos exclui ambiente, dependências e caches.

```bash
tar -czf /tmp/nossa-historia-mobile-faculdade.tar.gz mobile/src mobile/assets mobile/package.json mobile/package-lock.json mobile/app.json mobile/tsconfig.json mobile/eslint.config.mjs mobile/README.md mobile/LICENSE
```

No computador da apresentação, para um clone novo com essa cópia ao lado:

```bash
git clone https://github.com/LittleMestre/nossa-historia.git
cd nossa-historia
tar -xzf ../nossa-historia-mobile-faculdade.tar.gz
cd mobile
npm ci
EXPO_NO_DOTENV=1 EXPO_PUBLIC_DEMO_MODE=true npx expo start --go --lan --clear --port 8082
```

Também é possível extrair o pacote em uma pasta vazia e executar os mesmos comandos em `mobile/`. Quando a revisão desta entrega estiver publicada, basta clonar a branch que a contém e executar os comandos de instalação e início. O login Supabase segue a configuração da Etapa 6C, mais abaixo.

### Identificar qual Metro respondeu

Na investigação, o cabeçalho da porta 8081 indicava a pasta correta. Na revisão `ae48c00`, a rota `src/app/editor.tsx` exibia a prévia quando o provider devolvia `demoActions` nulo, inclusive no fluxo conectado. O CRUD anterior já estava ligado ao mesmo formulário no fluxo de exemplos. A entrada por modo e o botão de salvamento agora identificam o fluxo local.

Em outro terminal, confira o diretório no cabeçalho abaixo. Se a porta 8082 já estiver ocupada, encerre o Metro correspondente no terminal dele com Ctrl+C, ou escolha outra porta livre e leia o novo QR. Abra o projeto pelo QR mesmo quando ele já estiver no histórico do Expo Go.

```bash
curl -sSI http://127.0.0.1:8082/status
```

### Roteiro de validação no iPhone

1. **Primeiro uso.** Escolha **Nova história**, informe seu nome e o nome da família. Ao criar, confira as abas vazias. Crie um evento com a data de hoje e procure o título em Eventos, Início e Linha do tempo.
2. **Fotos.** Selecione uma foto na criação e outras nos detalhes. Confira as imagens ampliadas, a navegação na Galeria e o mosaico de até quatro imagens nas duas linhas do tempo. Experimente cancelar o seletor sem alterar o evento.
3. **Datas.** Crie um evento com **Sem data**. Confira a seção separada nas duas abas. Edite para 2024, mude para 2018 e volte a **Sem data**. Experimente um intervalo de 2018 a 2024 e procure por 2020. Mês, dia e indicação aproximada são opcionais conforme a precisão escolhida.
4. **Pessoas e filtros.** Cadastre uma pessoa com apelido, vincule-a no editor, abra o evento pelo perfil dela e depois remova o vínculo. Combine filtros de ano, categoria e tipo, mude um campo que atendia ao filtro e confira a contagem. Toque em **Limpar filtros**.
5. **Persistência.** Com uma foto e um evento ativos, feche completamente o Expo Go. Reabra pelo mesmo projeto, escolha **Nova história** e selecione a família existente. Confira título, data, foto e participantes.
6. **Edição e exclusão.** Altere título e descrição. Exclua uma foto, confira Galeria, detalhes e mosaicos, depois restaure pela lixeira da Galeria como administrador. Exclua o evento e confira sua saída das abas e a remoção de suas fotos da galeria comum.
7. **Espaços e papéis.** Use o ícone de conta para renomear a família, criar outra em **Espaços familiares** e alternar. Teste o perfil de leitor e o de colaborador. Este último pode acrescentar fotos a eventos alheios e editar o próprio conteúdo. Os perfis de apresentação podem ser alternados no próprio aparelho.
8. **Exemplos.** Saia do modo local e abra **Explorar exemplos fictícios**. Edite um exemplo, restaure em **Sua conta** e confirme que a história criada no primeiro passo continua intacta. Confira também tema, gestos, foco e salto por ano.

### Persistência e limites locais

SQLite mantém perfil, famílias, categorias, eventos, pessoas, participantes, referências de fotos e auditoria das alterações de conteúdo. A identidade administrativa deste dispositivo é a criadora das famílias pessoais. Cada escrita verifica família, papel e autoria. As tabelas de fotos e participantes usam chaves estrangeiras compostas. A exclusão lógica mantém as referências ao evento e a seus arquivos. A lixeira permite restaurar fotos de eventos ativos. Pessoas podem ser editadas e desvinculadas.

As fotos importadas são copiadas para o diretório de documentos antes de confirmar a transação. O aplicativo verifica formato e tamanho e aceita JPEG, PNG, WebP e HEIC até 20 MiB por foto. Uma importação interrompida pode deixar cópias incompletas, recolhidas na próxima abertura do modo local. Os exemplos empacotados usam imagens do próprio projeto. Na primeira abertura dos exemplos, a versão atual importa os registros do AsyncStorage anterior em uma transação e preserva sua pasta de fotos original.

O modo local dispensa senha, Supabase, Docker, Caddy e endereço doméstico. O perfil e os papéis locais servem à apresentação. A autenticação, os convites por e-mail e a autorização por RLS pertencem ao modo conectado. As histórias locais ficam no armazenamento do projeto no Expo Go. Desinstalar o aplicativo ou limpar seus dados pode apagá-las. O clone transporta o código e os exemplos. Sincronização entre aparelhos e backup de histórias pessoais ficam fora desta entrega.

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

Abra o QR code com a câmera do iPhone e permita acesso à rede local para o Expo Go. O aplicativo aceita a chave pública. As chaves `sb_secret_…` e `service_role` são exclusivas do servidor. A opção **Explorar exemplos fictícios** continua disponível na entrada. [Variáveis do Expo](https://docs.expo.dev/guides/environment-variables/) · [Chaves Supabase](https://supabase.com/docs/guides/getting-started/api-keys)

### 3. Validar dados reais no iPhone

1. Toque em **Entrar com Supabase** e use uma conta que já entra na web local. O app confirma a identidade no Auth antes de carregar os espaços. Compare o espaço selecionado com o da web. Se aparecer apenas um espaço, o app o seleciona automaticamente.
2. Compare um evento real nas abas **Início**, **Linha do tempo** e **Eventos**. Confira datas parciais e intervalos quando existirem no espaço. Abra um evento com participante e confira a mesma pessoa na aba **Pessoas**.
3. Em **Galeria**, abra uma foto real e depois abra um evento com mosaico. Volte ao app após mais de um minuto e abra a foto novamente para conferir a renovação da assinatura de 60 segundos.
4. Encerre o Expo Go pelo seletor de apps e reabra o projeto. Confira se a sessão volta sem digitar a senha.
5. Em **Sua conta**, toque em **Trocar conta** e entre com outra conta existente. Confira os espaços dela e verifique que dados da conta anterior sumiram. Se houver uma conta sem acesso ao espaço anterior, use-a para conferir a separação. Use **Sair** e reabra o app para verificar que a sessão foi removida. A demonstração deve mostrar somente o conteúdo fictício.

Na base local verificada nesta etapa, as três contas pertencem ao mesmo espaço. A leitura cruzada foi verificada por RLS com uma identidade sem associação, em transação somente leitura. Há eventos com ano, mês, dia e data desconhecida. O ensaio de intervalos com dados reais depende de um registro desse tipo.

Ao terminar, pare o Caddy com `Ctrl+C` e remova o perfil da CA do iPhone em **Ajustes → Geral → VPN e Gerenciamento de Dispositivo**. Se adicionou as duas regras UFW, remova-as com `sudo ufw delete deny in to "$NH_LAN" port 54443 proto tcp` e `sudo ufw delete allow in on "$NH_IFACE" from "$NH_PHONE" to "$NH_LAN" port 54443 proto tcp`.

### Caminho futuro com Supabase hospedado

Quando o projeto hospedado estiver autorizado e preparado, obtenha a URL HTTPS e a chave **Publishable** no painel **Connect**, use os dois valores no ambiente Expo e entre novamente com uma conta daquele ambiente. Valide as políticas por espaço e o bucket privado no ambiente hospedado antes de conectar o app a dados reais. A configuração hospedada dispensa o proxy e a CA local. [API do Supabase hospedado](https://supabase.com/docs/guides/api/creating-routes)

## Espiral e dados

`src/components/Experience.tsx` prepara o eixo cronológico, os filtros e os marcos de hoje e do ano escolhido. Acontecimentos sem data ficam em uma seção própria. `Stage.tsx` usa Gesture Handler e Reanimated. Os worklets calculam translação, rotação, perspectiva, escala, opacidade e ordem visual a partir do foco fracionário. A matemática vem de `spiral-model.ts` da web, adaptada em `src/lib/spiral-model.ts`. A janela monta até três cartões de cada lado, ou dois em telas com menos de 360 pontos. Os botões também permitem navegar com redução de movimento.

A demonstração começa com sete acontecimentos fictícios, duas pessoas e fotografias ilustrativas empacotadas em `assets/demo/`. Os registros locais ficam no SQLite e as imagens importadas ficam no diretório de documentos do aplicativo. No modo conectado, o cliente lê associações, eventos, categorias, pessoas e vínculos sob RLS e solicita assinaturas de 60 segundos para fotos prontas do bucket privado. Os limites por carga são 500 eventos, 200 fotos e 500 vínculos. No modo conectado, a edição continua disponível na web.

## Verificações locais

Em `mobile/`, use `npm run typecheck`, `npm run lint` e `npx expo-doctor`.

Para esta entrega, o pacote de apresentação foi extraído em um diretório temporário, instalado com `npm ci` e verificado sem arquivo de ambiente. Typecheck e lint passaram. O Expo Doctor passou nas 20 verificações e a exportação iOS gerou um bundle Hermes com os assets dos exemplos.

Verificações pontuais no computador usaram SQLite em arquivo. Cobriram reabertura, isolamento entre famílias, papéis e autoria, participantes, precisão e ordenação de datas, exclusão lógica e lixeira. Um exercício do provider com adaptadores de arquivos verificou a cópia de JPEG, reversão de uma importação com arquivo inválido, migração do formato anterior e restauração isolada dos exemplos. Biblioteca de Fotos, gestos e persistência após encerrar o Expo Go continuam no roteiro manual do iPhone.
