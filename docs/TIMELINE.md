# Linha do tempo horizontal

`TimelineView` recebe `events: TimelineEvent[]`. Cada evento tem `id`, `title`, `dateLabel` e `year`; `month`, `day`, `category`, `coverUrl` e `placement` são opcionais. `placement` aceita `above` ou `below` e deve ser salvo como escolha do autor. Eventos sem essa escolha alternam visualmente. O componente não infere posição a partir da categoria.

Os itens são ordenados por ano, mês e dia informados, preservando a ordem de entrada em empates. Valores ausentes servem apenas para ordenação interna; a interface mostra `dateLabel`, preservando a precisão real. A marca “Hoje” usa `new Date()` no momento em que a linha é montada. A distância entre cartões é uniforme para evitar lacunas enormes entre décadas.

A área usa rolagem horizontal nativa com alinhamento central e `scroll-snap`. Botões, setas do teclado, arraste com mouse e swipe no celular acionam o mesmo foco. O formulário de ano seleciona um evento daquele ano ou insere uma marca temporária de período vazio. “Voltar para hoje” centraliza a marca atual. A preferência `prefers-reduced-motion` desativa a rolagem animada.

Durante uma centralização programática, o foco selecionado permanece estável; após a rolagem terminar, ele é sincronizado com o cartão efetivamente central. Isso evita oscilações de destaque ao atravessar cartões intermediários.

A home e `/linha-do-tempo` recebem eventos da mesma consulta Supabase SSR do espaço ativo. A consulta ignora eventos removidos e subeventos e percorre todas as páginas. Datas desconhecidas são listadas fora do eixo, com link para `/eventos/:eventId`. Os cartões com data usam a mesma rota de detalhes e exibem um mosaico automático das quatro primeiras fotos ativas do evento, ordenadas por `created_at` e `id`. Zero fotos mostra “Sem fotos”; uma ocupa toda a área; duas a dividem ao meio; três usam uma foto alta e duas menores; quatro usam grade 2×2. A pesquisa permanece para uma etapa futura.

O servidor seleciona IDs por lotes de até 60 eventos com função SQL `SECURITY INVOKER`, sob RLS, e reaproveita `getSignedPhotoUrls` para as URLs privadas de 60 segundos. A espiral consulta a janela renderizada; a linha horizontal observa cartões próximos ao viewport. A renovação ocorre após 45 segundos e quando a aba volta a ficar visível. Não há URL pública, coluna de capa ou seleção manual. O Supabase local entrega o original quando a transformação privada de miniatura não está disponível; muitas fotos grandes ainda podem consumir largura de banda.

## Demonstração visual local

Em desenvolvimento, `http://localhost:3000/demo-linha-do-tempo` carrega cinco eventos inteiramente fictícios de 2018 a 2026. A página exibe aviso explícito, usa fotografias ilustrativas geradas para este projeto em `src/demo/assets` e não oferece abertura de álbuns, gravação ou integração com Supabase. O modelo `TimelineEvent` e o componente principal são os mesmos que receberão eventos reais.

A rota responde com página não encontrada em produção. O módulo, os registros e as imagens de demonstração são importados apenas quando `import.meta.env.DEV` é verdadeiro e devem ficar ausentes do build de produção. Esta prévia não substitui os testes de autorização e persistência das próximas etapas.
