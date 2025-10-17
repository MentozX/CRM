import { useEffect, useMemo, useState } from 'react'
import { listReservationsInRange } from '../api/reservations'
import type { CalendarReservation } from '../types'

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

function formatWeekRangeAnchor(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  const diff = (day + 6) % 7
  const start = new Date(copy)
  start.setDate(copy.getDate() - diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createVisitLabel(item: CalendarReservation) {
  const startIso = `${item.date}T${item.startTime}`
  const dt = new Date(startIso)
  const weekday = dt.toLocaleDateString('pl-PL', { weekday: 'long' })
  const time = dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const serviceLabel = item.serviceType === 'treatment' ? 'Zabieg' : 'Konsultacja'
  return {
    id: item.id,
    title: serviceLabel,
    client: item.clientName,
    when: `${weekday}, ${time}`,
    duration: item.durationMinutes,
    notes: item.notes ?? ''
  }
}

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(fallbackWidgets)
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [upcomingVisits, setUpcomingVisits] = useState<CalendarReservation[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(false)
  const [upcomingError, setUpcomingError] = useState('')

  const { start: startDate, end: endDate } = useMemo(() => {
    const range = formatWeekRangeAnchor(new Date())
    return {
      start: formatDateOnly(range.start),
      end: formatDateOnly(range.end)
    }
  }, [])

  const upcomingItems = useMemo(() => upcomingVisits.map(createVisitLabel), [upcomingVisits])

  useEffect(() => {
    let active = true
    setUpcomingLoading(true)
    setUpcomingError('')
    listReservationsInRange(startDate, endDate)
      .then(data => {
        if (!active) return
        setUpcomingVisits(data)
      })
      .catch(err => {
        console.error(err)
        if (!active) return
        setUpcomingVisits([])
        setUpcomingError('Nie udało się pobrać wizyt.')
      })
      .finally(() => {
        if (!active) return
        setUpcomingLoading(false)
      })

    return () => {
      active = false
    }
  }, [startDate, endDate])

  const availableWidgets = useMemo(() => Object.entries(widgetDefinitions) as [WidgetType, WidgetDefinition][], [])

function createWidgetId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const random = typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
    ? crypto.getRandomValues(new Uint8Array(1))[0]
    : Math.floor(Math.random() * 255)
  return `widget-${Date.now().toString(16)}-${random.toString(16)}`
}

function addWidget(type: WidgetType) {
  setWidgets(prev => [...prev, { id: createWidgetId(), type }])
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
          <p>Skonfiguruj swój pulpit dowolnymi widgetami, aby mieć szybki podgląd najważniejszych danych.</p>
        </div>
        <button className="button" onClick={() => setPickerOpen(true)}>+ Dodaj widget</button>
      </header>

      {widgets.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <p>Brak widgetów. Kliknij „Dodaj widget”, aby rozpocząć.</p>
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
              <div className="widget-scroll">
                {upcomingLoading && (
                  <div className="widget-placeholder"><p>Ładowanie wizyt...</p></div>
                )}
                {!upcomingLoading && upcomingError && (
                  <div className="widget-placeholder"><p>{upcomingError}</p></div>
                )}
                {!upcomingLoading && !upcomingError && upcomingItems.length === 0 && (
                  <div className="widget-placeholder"><p>Brak wizyt w tym tygodniu.</p></div>
                )}
                {!upcomingLoading && !upcomingError && upcomingItems.length > 0 && (
                  upcomingItems.map(item => (
                    <div key={item.id} className="widget-visit">
                      <div className="widget-visit-header">
                        <span>{item.when}</span>
                        <span>{item.duration} min</span>
                      </div>
                      <div className="widget-visit-primary">{item.title}</div>
                      <div className="widget-visit-secondary">{item.client}</div>
                      {item.notes && <div className="widget-visit-note">{item.notes}</div>}
                    </div>
                  ))
                )}
              </div>
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
