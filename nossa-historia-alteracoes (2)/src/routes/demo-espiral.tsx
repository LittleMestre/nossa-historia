import { Suspense, lazy } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'

const DemoPage = import.meta.env.DEV
  ? lazy(() => import('../demo/SpiralDemoPage').then((m) => ({ default: m.SpiralDemoPage })))
  : null

export const Route = createFileRoute('/demo-espiral')({
  head: () => ({
    meta: [
      { title: 'Demonstração da espiral do tempo — Nossa História' },
      { name: 'description', content: 'Prévia local da linha do tempo em espiral 3D com eventos fictícios.' },
      { property: 'og:title', content: 'Demonstração da espiral do tempo — Nossa História' },
      { property: 'og:description', content: 'Prévia local da linha do tempo em espiral 3D com eventos fictícios.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: DemoRoute,
})

function DemoRoute() {
  return DemoPage ? (
    <Suspense fallback={<p>Preparando a demonstração…</p>}>
      <DemoPage />
    </Suspense>
  ) : null
}
