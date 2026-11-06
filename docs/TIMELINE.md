# Linha do tempo horizontal

`TimelineView` recebe `events: TimelineEvent[]`. Cada evento tem `id`, `title`, `dateLabel` e `year`; `month`, `day`, `category`, `coverUrl` e `placement` são opcionais. `placement` aceita `above` ou `below` e deve ser salvo como escolha do autor. Eventos sem essa escolha alternam visualmente. O componente não infere posição a partir da categoria.

Os itens são ordenados por ano, mês e dia informados, preservando a ordem de entrada em empates. Valores ausentes servem apenas para ordenação interna; a interface mostra `dateLabel`, preservando a precisão real. A marca “Hoje” usa `new Date()` no momento em que a linha é montada. A distância entre cartões é uniforme para evitar lacunas enormes entre décadas.

A área usa rolagem horizontal nativa com alinhamento central e `scroll-snap`. Botões, setas do teclado, arraste com mouse e swipe no celular acionam o mesmo foco. O formulário de ano seleciona um evento daquele ano ou insere uma marca temporária de período vazio. “Voltar para hoje” centraliza a marca atual. A preferência `prefers-reduced-motion` desativa a rolagem animada.

Durante uma centralização programática, o foco selecionado permanece estável; após a rolagem terminar, ele é sincronizado com o cartão efetivamente central. Isso evita oscilações de destaque ao atravessar cartões intermediários.

A rota de detalhes `/eventos/:eventId` é um estado vazio nesta etapa. Quando a consulta Supabase existir, a rota deverá buscar o evento autorizado por ID e a pesquisa poderá centralizá-lo chamando a seleção por chave. A aplicação principal não envia fotografias reais nem dados fictícios.

## Demonstração visual local

Em desenvolvimento, `http://localhost:3000/demo-linha-do-tempo` carrega cinco eventos inteiramente fictícios de 2018 a 2026. A página exibe aviso explícito, usa fotografias ilustrativas geradas para este projeto em `src/demo/assets` e não oferece abertura de álbuns, gravação ou integração com Supabase. O modelo `TimelineEvent` e o componente principal são os mesmos que receberão eventos reais.

A rota responde com página não encontrada em produção. O módulo, os registros e as imagens de demonstração são importados apenas quando `import.meta.env.DEV` é verdadeiro e devem ficar ausentes do build de produção. Esta prévia não substitui os testes de autorização e persistência das próximas etapas.
