import { useMemo, useState } from 'react'

type WidgetType = 'upcomingVisits' | 'clientStats' | 'birthdays' | 'revenue'

type WidgetDefinition = {
  label: string
  description: string
  available: boolean
}

const widgetDefinitions: Record<WidgetType, WidgetDefinition> = {
  upcomingVisits: {
    label: 'Najbliższe wizyty',
    description: 'Lista zaplanowanych wizyt w najbliższym tygodniu.',
    available: true
  },
  clientStats: {
    label: 'Statystyki klientów',
    description: 'Podsumowanie nowych klientów i aktywności (w przygotowaniu).',
    available: false
  },
  birthdays: {
    label: 'Dzisiejsze urodziny',
    description: 'Klienci, którym dziś wypadają urodziny (w przygotowaniu).',
    available: false
  },
  revenue: {
    label: 'Przychody',
    description: 'Miesięczny wykres przychodu (w przygotowaniu).',
    available: false
  }
}

type DashboardWidget = {
  id: string
  type: WidgetType
}

const fallbackWidgets: DashboardWidget[] = [
  { id: 'initial-upcoming', type: 'upcomingVisits' }
]

const upcomingMock = [
  { id: '1', client: 'Anna Nowak', service: 'Mezoterapia igłowa', when: 'Pon 09:30', staff: 'dr Kowalska' },
  { id: '2', client: 'Jakub Mista', service: 'Botoks', when: 'Wt 12:00', staff: 'dr Zieliński' },
  { id: '3', client: 'Michał Testowy', service: 'Peeling chemiczny', when: 'Czw 15:30', staff: 'mgr Lis' }
]

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(fallbackWidgets)
  const [isPickerOpen, setPickerOpen] = useState(false)

  const availableWidgets = useMemo(() => Object.entries(widgetDefinitions) as [WidgetType, WidgetDefinition][], [])

  function addWidget(type: WidgetType) {
    setWidgets(prev => [...prev, { id: crypto.randomUUID(), type }])
    setPickerOpen(false)
  }

  function removeWidget(id: string) {
    setWidgets(prev => prev.filter(widget => widget.id !== id))
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h2>Pulpit</h2>
          <p>Konfiguruj własne widżety, aby mieć szybki podgląd najważniejszych danych.</p>
        </div>
        <button className="button" onClick={() => setPickerOpen(true)}>+ Dodaj widget</button>
      </header>

      {widgets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>Brak widżetów. Kliknij „Dodaj widget”, aby rozpocząć.</p>
        </div>
      )}

      <div className="dashboard-grid">
        {widgets.map(widget => (
          <article key={widget.id} className="widget-card">
            <header className="widget-header">
              <h3>{widgetDefinitions[widget.type].label}</h3>
              <button className="widget-remove" onClick={() => removeWidget(widget.id)}>×</button>
            </header>
            {widget.type === 'upcomingVisits' && (
              <ul className="widget-list">
                {upcomingMock.map(item => (
                  <li key={item.id}>
                    <div className="widget-primary">{item.when}</div>
                    <div className="widget-secondary">{item.client} – {item.service}</div>
                    <div className="widget-note">Specjalista: {item.staff}</div>
                  </li>
                ))}
              </ul>
            )}
            {widget.type !== 'upcomingVisits' && (
              <div className="widget-placeholder">
                <p>{widgetDefinitions[widget.type].description}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      {isPickerOpen && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setPickerOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Dodaj widżet</h3>
            <div className="widget-picker">
              {availableWidgets.map(([type, def]) => (
                <button
                  key={type}
                  className="widget-option"
                  onClick={() => def.available && addWidget(type)}
                  disabled={!def.available}
                >
                  <span>{def.label}</span>
                  <small>{def.description}</small>
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="button button-muted" onClick={() => setPickerOpen(false)}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
