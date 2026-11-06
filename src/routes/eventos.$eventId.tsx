import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpenText } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'

export const Route = createFileRoute('/eventos/$eventId')({
  component: EventDetailPage,
})

function EventDetailPage() {
  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Álbum do acontecimento"
        title="Detalhes do evento"
        description="Esta página receberá as lembranças, fotografias e contribuições quando os eventos reais forem conectados."
      />
      <EmptyState
        icon={BookOpenText}
        title="Este álbum ainda não está disponível"
        description="Os detalhes serão exibidos aqui após a implementação do cadastro e da consulta de eventos."
        action={
          <Link className="primary-link" to="/linha-do-tempo">
            Voltar à linha do tempo
          </Link>
        }
      />
    </div>
  )
}
