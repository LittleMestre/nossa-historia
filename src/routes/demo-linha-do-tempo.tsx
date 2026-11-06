import { Suspense, lazy } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'

const DemoPage = import.meta.env.DEV
  ? lazy(() =>
      import('../demo/TimelineDemoPage').then((module) => ({
        default: module.TimelineDemoPage,
      })),
    )
  : null

export const Route = createFileRoute('/demo-linha-do-tempo')({
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
