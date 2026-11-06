import { createFileRoute } from '@tanstack/react-router'
import { CalendarPlus2, BookOpenText } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { PageHeading } from '../components/layout/PageHeading'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/eventos')({ component: EventsPage })

function EventsPage() {
  return (
    <div className="inner-page">
      <PageHeading
        eyebrow="Capítulos da família"
        title="Eventos"
        description="Viagens, aniversários e encontros terão seu próprio álbum, com espaço para cada pessoa contribuir."
        action={
          <Button
            disabled
            title="Disponível após a integração com o espaço privado"
          >
            <CalendarPlus2 size={16} /> Criar evento{' '}
            <span className="button-soon">em breve</span>
          </Button>
        }
      />
      <EmptyState
        icon={BookOpenText}
        title="O primeiro capítulo ainda está por vir"
        description="Quando o cadastro estiver disponível, os eventos criados pela família aparecerão aqui."
      />
    </div>
  )
}
