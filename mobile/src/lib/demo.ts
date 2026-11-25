import type { Data, Event, Space } from './model'

export const demoSpace: Space = {
  id: 'demo',
  name: 'Família de demonstração',
  role: 'admin',
}
const base = {
  moment_type: 'family',
  created_by: 'demo-author',
  space_id: 'demo',
  description: null,
  category_id: null,
  end_year: null,
  end_month: null,
  end_day: null,
  approximate_date_label: null,
  created_at: '2026-01-01T00:00:00Z',
} as const
export const demoEvents: Event[] = [
  {
    ...base,
    id: 'demo-1',
    title: 'Um almoço de domingo',
    description:
      'Uma tarde de conversa, receitas de família e histórias que atravessam gerações.',
    date_precision: 'day',
    start_year: 2026,
    start_month: 8,
    start_day: 16,
    category_id: 'demo-family',
  },
  {
    ...base,
    id: 'demo-2',
    title: 'Nossa viagem à serra',
    description: 'O caminho foi tão memorável quanto a chegada.',
    date_precision: 'month',
    start_year: 2024,
    start_month: 7,
    start_day: null,
    category_id: 'demo-travel',
  },
  {
    ...base,
    id: 'demo-3',
    title: 'A casa onde tudo começou',
    description: 'As primeiras lembranças do lugar que reuniu a família.',
    date_precision: 'range',
    start_year: 1998,
    start_month: null,
    start_day: null,
    end_year: 2001,
    end_month: null,
    end_day: null,
    category_id: 'demo-family',
  },
  {
    ...base,
    id: 'demo-4',
    title: 'Uma história sem data',
    description:
      'Algumas histórias guardam o sentimento, mesmo quando a data se perdeu.',
    date_precision: 'unknown',
    start_year: null,
    start_month: null,
    start_day: null,
  },
]

demoEvents.push(
  {
    ...base,
    id: 'camera',
    title: 'Minha primeira câmera',
    start_year: 2020,
    start_month: null,
    start_day: null,
    date_precision: 'year',
    moment_type: 'individual',
    description: 'Ana começou a fotografar os domingos da família.',
  },
  {
    ...base,
    id: 'garden',
    title: 'Festa no jardim',
    start_year: 2022,
    start_month: 5,
    start_day: null,
    date_precision: 'month',
    category_id: 'demo-family',
  },
  {
    ...base,
    id: 'lake',
    title: 'Próximo encontro no lago',
    start_year: 2027,
    start_month: null,
    start_day: null,
    date_precision: 'year',
    category_id: 'demo-travel',
    moment_type: 'other',
  },
)
const images = [
  require('../../assets/demo/2018-family-lunch.jpg'),
  require('../../assets/demo/2020-first-camera.jpg'),
  require('../../assets/demo/2022-garden-celebration.jpg'),
  require('../../assets/demo/2024-mountain-trail.jpg'),
  require('../../assets/demo/2026-lake-reunion.jpg'),
]
const people = [
  {
    id: 'p1',
    name: 'Ana Almeida',
    nickname: 'Aninha',
    description: 'Guarda as fotografias da família.',
  },
  {
    id: 'p2',
    name: 'Miguel Almeida',
    description: 'Organiza os encontros de domingo.',
  },
]
export const demoData: Data = {
  events: demoEvents,
  people,
  categories: { 'demo-family': 'Família', 'demo-travel': 'Viagem' },
  participants: { 'demo-1': people, camera: [people[0]], lake: [people[1]] },
  photos: Object.entries({
    'demo-1': [0, 2, 4, 1],
    'demo-2': [3, 4],
    camera: [1],
    garden: [2, 0, 4],
    lake: [4],
  }).flatMap(([event_id, indices]) =>
    indices.map((idx, i) => ({
      id: event_id + '-foto-' + i,
      event_id,
      asset: images[idx],
      storage_path: '',
      description: [
        'Almoço em família',
        'Primeira câmera',
        'Jardim em festa',
        'Trilha na serra',
        'Encontro no lago',
      ][idx],
    })),
  ),
}
