import { createFileRoute } from '@tanstack/react-router'
import { TimelineExperience } from '../components/timeline/TimelineExperience'
import type { TimelineEvent } from '../components/timeline/timeline-model'

export const Route = createFileRoute('/linha-do-tempo')({
  component: TimelinePage,
})
const events: TimelineEvent[] = []

function TimelinePage() {
  return <TimelineExperience events={events} />
}
