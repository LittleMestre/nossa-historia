export function LoadingState({
  label = 'Carregando lembranças',
}: {
  label?: string
}) {
  return (
    <div className="loading-state" role="status" aria-label={label}>
      <span className="loading-card" />
      <span className="loading-card" />
      <span className="loading-card" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
