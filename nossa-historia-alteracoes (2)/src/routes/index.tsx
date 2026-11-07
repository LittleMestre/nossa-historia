import { createFileRoute } from '@tanstack/react-router'
import { TimelineExperience } from '../components/timeline/TimelineExperience'
import type { TimelineEvent } from '../components/timeline/timeline-model'

export const Route = createFileRoute('/')({ head: () => ({ meta: [{"title": "Nossa História — Memórias da família"}, {"name": "description", "content": "Nossa História: linha do tempo em espiral para preservar os momentos da família."}, {"property": "og:title", "content": "Nossa História — Memórias da família"}, {"property": "og:description", "content": "Nossa História: linha do tempo em espiral para preservar os momentos da família."}, {"property": "og:type", "content": "website"}, {"name": "twitter:card", "content": "summary_large_image"}] }),
  component: HomePage })
const events: TimelineEvent[] = []

function HomePage() {
  return <TimelineExperience events={events} view="spiral" />
}
