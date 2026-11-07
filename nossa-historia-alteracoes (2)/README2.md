# Nossa História — Pacote de alterações (Espiral 3D)

Este pacote contém **apenas** os arquivos criados ou alterados para transformar a home em uma linha do tempo 3D em espiral. Copie cada arquivo para o **mesmo caminho** dentro do seu projeto (a estrutura de pastas do ZIP já espelha o projeto).

Nenhum banco, autenticação, migração ou Storage foi alterado. Nenhuma dependência nova foi adicionada.

## Arquivos NOVOS

| Arquivo | Onde colocar | Para que serve |
|---|---|---|
| `src/components/timeline/spiral-model.ts` | `src/components/timeline/` | Matemática pura da espiral (sem React): posição X/Y/Z por seno/cosseno, escala, opacidade, saturação, desfoque e z-index conforme a profundidade; janela de cartões visíveis; interpolação suave (`approach`); conversão de arraste em deslocamento. Presets desktop e mobile. |
| `src/components/timeline/SpiralTimelineView.tsx` | `src/components/timeline/` | Componente visual da espiral 3D. Recebe `events: TimelineEvent[]`. Animação com requestAnimationFrame, botões anterior/próximo, setas do teclado, arraste com mouse, swipe, clique para focar, navegação por ano, "Voltar para hoje", marcadores Passado/Presente/Futuro, respeita prefers-reduced-motion e mostra estado vazio. |
| `src/demo/SpiralDemoPage.tsx` | `src/demo/` | Página de demonstração com os eventos fictícios de `src/demo/timeline-events.ts` e aviso de conteúdo fictício. |
| `src/routes/demo-espiral.tsx` | `src/routes/` | Rota `/demo-espiral`, disponível somente em desenvolvimento (`import.meta.env.DEV`); em produção retorna "não encontrado". |
| `tests/unit/spiral-model.test.ts` | `tests/unit/` | 8 testes unitários (vitest) da geometria: foco à frente, passado abaixo/futuro acima, profundidade progressiva, volta completa, continuidade, janela visível, interpolação e direção do arraste. |

## Arquivos ALTERADOS (substituem os existentes)

| Arquivo | O que mudou |
|---|---|
| `src/components/timeline/TimelineExperience.tsx` | Nova prop opcional `view?: 'horizontal' \| 'spiral'` (padrão horizontal). A timeline horizontal original continua intacta. |
| `src/routes/index.tsx` | A home usa `<TimelineExperience events={events} view="spiral" />`. Continua sem eventos reais (estado vazio) até o banco ser integrado. |
| `src/styles.css` | Adicionado bloco de estilos da espiral no final (`.spiral-*`: perspectiva, preserve-3d, cartões, trilha, marcadores, mobile). Usa apenas tokens de cor existentes — funciona no tema claro e escuro. |
| `AGENTS.md` | Uma regra nova: home usa a espiral; a horizontal permanece em `/linha-do-tempo`. Opcional. |

## Observação
`src/routeTree.gen.ts` também muda, mas **não está no pacote** porque é gerado automaticamente ao rodar `bun run dev` / `bun run build`.

## Como aplicar e testar
```bash
# na raiz do projeto, depois de copiar os arquivos
bun install
bunx vitest run          # testes unitários
bun run dev              # abra / e /demo-espiral
```
Para voltar à timeline horizontal na home, troque `view="spiral"` por `view="horizontal"` em `src/routes/index.tsx`.
