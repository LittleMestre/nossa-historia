import { FlaskConical } from 'lucide-react'
import { SpiralTimelineView } from '../components/timeline/SpiralTimelineView'
import { demoTimelineEvents } from './timeline-events'

export function SpiralDemoPage() {
  return (
    <div className="timeline-demo">
      <div className="timeline-demo-banner" role="note">
        <FlaskConical size={19} aria-hidden="true" />
        <div>
          <strong>Demonstração visual · ambiente de desenvolvimento</strong>
          <span>
            Cinco histórias e fotografias fictícias. Nada aqui é um registro da sua família ou será salvo no
            banco de dados.
          </span>
        </div>
      </div>
      <SpiralTimelineView events={demoTimelineEvents} showDetailsLink={false} />
    </div>
  )
}
