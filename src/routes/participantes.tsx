import { createFileRoute } from '@tanstack/react-router'
import { UsersRound } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'

export const Route = createFileRoute('/participantes')({
  component: PeoplePage,
})

function PeoplePage() {
  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Quem faz parte"
        title="Pessoas"
        description="Encontre as pessoas presentes nas lembranças, mesmo que elas não tenham uma conta no aplicativo."
      />
      <EmptyState
        icon={UsersRound}
        title="Toda história começa com pessoas"
        description="O catálogo de participantes aparecerá aqui quando o cadastro de pessoas estiver disponível."
      />
    </div>
  )
}
