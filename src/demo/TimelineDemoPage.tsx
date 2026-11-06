import { Link } from '@tanstack/react-router'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { TimelineView } from '../components/timeline/TimelineView'
import { demoTimelineEvents } from './timeline-events'

export function TimelineDemoPage() {
  return (
    <div className="timeline-demo">
      <div className="timeline-demo-banner" role="note">
        <FlaskConical size={19} aria-hidden="true" />
        <div>
          <strong>Demonstração visual · ambiente de desenvolvimento</strong>
          <span>
            Cinco histórias e fotografias fictícias. Nada aqui é um registro da
            sua família ou será salvo no banco de dados.
          </span>
        </div>
      </div>
      <header className="timeline-demo-heading">
        <div>
          <span className="eyebrow">Prévia interativa</span>
          <h1>
            O tempo em <em>movimento.</em>
          </h1>
          <p>
            Selecione uma fotografia, use as setas, arraste ou deslize. Os
            momentos coletivos ficam acima do eixo; os individuais, abaixo.
          </p>
        </div>
        <Link to="/linha-do-tempo" className="timeline-demo-back">
          <ArrowLeft size={16} /> Voltar à linha do tempo vazia
        </Link>
      </header>
      <TimelineView events={demoTimelineEvents} showDetailsLink={false} />
      <p className="timeline-demo-footnote">
        Prévia local para aprovação visual. A abertura de álbuns reais será
        implementada quando os eventos estiverem disponíveis.
      </p>
    </div>
  )
}
