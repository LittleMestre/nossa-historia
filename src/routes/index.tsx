import { createFileRoute } from '@tanstack/react-router'
import { TimelineExperience } from '../components/timeline/TimelineExperience'
import { getTimelineEvents } from '../features/events/timeline'

export const Route = createFileRoute('/')({
  loader: () => getTimelineEvents(),
  pendingComponent: () => <div className="inner-page" role="status">Carregando acontecimentos…</div>,
  errorComponent: () => <div className="inner-page" role="alert">Não foi possível carregar os acontecimentos. Tente atualizar a página.</div>,
  component: HomePage,
})

function HomePage() {
  return <TimelineExperience {...Route.useLoaderData()} view="spiral" />
}
