import { createFileRoute } from '@tanstack/react-router'
import { TimelineExperience } from '../components/timeline/TimelineExperience'
import { getTimelineEvents } from '../features/events/timeline'

export const Route = createFileRoute('/linha-do-tempo')({
  loader: () => getTimelineEvents(),
  pendingComponent: () => <div className="inner-page" role="status">Carregando acontecimentos…</div>,
  errorComponent: () => <div className="inner-page" role="alert">Não foi possível carregar os acontecimentos. Tente atualizar a página.</div>,
  component: TimelinePage,
})

function TimelinePage() {
  return <TimelineExperience {...Route.useLoaderData()} />
}
