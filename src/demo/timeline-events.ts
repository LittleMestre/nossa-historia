import familyLunch from './assets/2018-family-lunch.png'
import firstCamera from './assets/2020-first-camera.png'
import gardenCelebration from './assets/2022-garden-celebration.png'
import mountainTrail from './assets/2024-mountain-trail.png'
import lakeReunion from './assets/2026-lake-reunion.png'
import type { TimelineEvent } from '../components/timeline/timeline-model'

// Somente para validação visual local. Nunca persistir ou misturar com eventos reais.
export const demoTimelineEvents: TimelineEvent[] = [
  {
    id: 'demo-2018-family-lunch',
    title: 'Almoço no jardim',
    dateLabel: 'Julho de 2018',
    year: 2018,
    month: 7,
    category: 'Momento em família',
    placement: 'above',
    coverUrl: familyLunch,
  },
  {
    id: 'demo-2020-first-camera',
    title: 'Minha primeira câmera',
    dateLabel: 'Março de 2020',
    year: 2020,
    month: 3,
    category: 'Momento individual',
    placement: 'below',
    coverUrl: firstCamera,
  },
  {
    id: 'demo-2022-garden-celebration',
    title: 'Festa no quintal',
    dateLabel: 'Setembro de 2022',
    year: 2022,
    month: 9,
    category: 'Momento em família',
    placement: 'above',
    coverUrl: gardenCelebration,
  },
  {
    id: 'demo-2024-mountain-trail',
    title: 'Trilha da manhã',
    dateLabel: 'Maio de 2024',
    year: 2024,
    month: 5,
    category: 'Momento individual',
    placement: 'below',
    coverUrl: mountainTrail,
  },
  {
    id: 'demo-2026-lake-reunion',
    title: 'Encontro à beira do lago',
    dateLabel: 'Abril de 2026',
    year: 2026,
    month: 4,
    category: 'Momento em família',
    placement: 'above',
    coverUrl: lakeReunion,
  },
]
