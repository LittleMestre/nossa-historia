import { createFileRoute } from '@tanstack/react-router'
import { TimelineExperience } from '../components/timeline/TimelineExperience'
import type { TimelineEvent } from '../components/timeline/timeline-model'

export const Route = createFileRoute('/')({ component: HomePage })
const events: TimelineEvent[] = []

function HomePage() {
  return <TimelineExperience events={events} view="spiral" />
}
