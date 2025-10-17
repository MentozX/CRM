import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { listReservations, createReservation, updateReservation, deleteReservation } from '../api/reservations'
import { listClients } from '../api/clients'
import type { CalendarReservation, Client, ReservationServiceType } from '../types'

const WORK_START = 8 * 60
const WORK_END = 20 * 60
const SLOT = 10
const durationOptions = Array.from({ length: 12 }, (_, index) => (index + 1) * 10)
const serviceOptions: { value: ReservationServiceType; label: string }[] = [
  { value: 'treatment', label: 'Zabieg' },
  { value: 'consultation', label: 'Konsultacja' }
]

const todayIso = new Date().toISOString().slice(0, 10)

type ReservationWithLayout = CalendarReservation & { rowIndex: number }
type Slot = { label: string; minutes: number }

const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const clampToSchedule = (minutes: number) => Math.max(WORK_START, Math.min(minutes, WORK_END - SLOT))

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [reservations, setReservations] = useState<CalendarReservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [slotTime, setSlotTime] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<ReservationServiceType>('treatment')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [maxSelectableDuration, setMaxSelectableDuration] = useState(120)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editingReservation, setEditingReservation] = useState<ReservationWithLayout | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReservationWithLayout | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])
  const [clientLoading, setClientLoading] = useState(false)
  const [clientError, setClientError] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const slots = useMemo<Slot[]>(() => {
    const items: Slot[] = []
    for (let minutes = WORK_START; minutes <= WORK_END; minutes += SLOT) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const label = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      items.push({ label, minutes })
    }
    return items
  }, [])

  const reservationLookup = useMemo(() => {
    const map = new Map<number, ReservationWithLayout>()
    reservations.forEach(reservation => {
      const startMinutes = clampToSchedule(parseTimeToMinutes(reservation.startTime))
      const index = Math.floor((startMinutes - WORK_START) / SLOT)
      if (!map.has(index)) {
        map.set(index, { ...reservation, rowIndex: index })
      }
    })
    return map
  }, [reservations])

  const loadReservations = useCallback(async (date: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await listReservations(date)
      setReservations(data)
    } catch (err) {
      console.error(err)
      setError('Nie udało się pobrać wizyt. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReservations(selectedDate)
  }, [loadReservations, selectedDate])

  useEffect(() => {
    if (!modalOpen || editingReservation) return
    const trimmed = clientQuery.trim()
    setClientLoading(true)
    setClientError('')

    const handler = window.setTimeout(async () => {
      try {
        const results = await listClients(trimmed.length ? trimmed : undefined)
        setClientResults(results.slice(0, 20))
      } catch (err) {
        console.error(err)
        setClientResults([])
        setClientError('Nie udało się pobrać listy klientów.')
      } finally {
        setClientLoading(false)
      }
    }, 200)

    return () => {
      window.clearTimeout(handler)
    }
  }, [clientQuery, modalOpen, editingReservation])

  const openSlot = (slot: Slot) => {
    setEditingReservation(null)
    setSlotTime(slot.label)
    setServiceType('treatment')
    const remaining = WORK_END - slot.minutes
    const maxDuration = Math.max(SLOT, Math.floor(remaining / SLOT) * SLOT)
    setMaxSelectableDuration(maxDuration)
    const defaultDuration = Math.min(30, maxDuration)
    setDurationMinutes(defaultDuration)
    setClientQuery('')
    setClientResults([])
    setClientLoading(false)
    setSelectedClient(null)
    setSubmitError('')
    setClientError('')
    setNotes('')
    setModalOpen(true)
  }

  const openEdit = (reservation: ReservationWithLayout) => {
    const startMinutes = clampToSchedule(parseTimeToMinutes(reservation.startTime))
    const remaining = WORK_END - startMinutes
    const maxDuration = Math.max(SLOT, Math.floor(remaining / SLOT) * SLOT)
    setMaxSelectableDuration(maxDuration)
    setSlotTime(reservation.startTime)
    setServiceType(reservation.serviceType)
    setDurationMinutes(Math.min(reservation.durationMinutes, maxDuration))
    setNotes(reservation.notes ?? '')
    setClientQuery(reservation.clientName)
    setClientResults([])
    setSelectedClient(null)
    setClientLoading(false)
    setClientError('')
    setSubmitError('')
    setEditingReservation(reservation)
    setModalOpen(true)
  }

  const confirmDelete = (reservation: ReservationWithLayout) => {
    setDeleteError('')
    setDeleteTarget(reservation)
  }

  const closeDeleteModal = () => {
    if (deleting) return
    setDeleteTarget(null)
    setDeleteError('')
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingReservation(null)
    setSlotTime(null)
    setSubmitError('')
    setClientError('')
    setNotes('')
    setClientQuery('')
    setClientResults([])
    setSelectedClient(null)
    setClientLoading(false)
    setMaxSelectableDuration(120)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')

    if (!slotTime) {
      setSubmitError('Wybierz godzinę wizyty.')
      return
    }

    setSubmitting(true)
    try {
      if (editingReservation) {
        await updateReservation(editingReservation.id, {
          serviceType,
          durationMinutes,
          notes: notes.trim() ? notes.trim() : undefined
        })
      } else {
        if (!selectedClient) {
          setClientError('Musisz wybrać klienta.')
          setSubmitting(false)
          return
        }
        await createReservation({
          clientId: selectedClient.id,
          serviceType,
          date: selectedDate,
          startTime: slotTime,
          durationMinutes,
          notes: notes.trim() ? notes.trim() : undefined
        })
      }
      closeModal()
      await loadReservations(selectedDate)
    } catch (err) {
      console.error(err)
      setSubmitError(editingReservation ? 'Nie udało się zaktualizować wizyty.' : 'Nie udało się zapisać wizyty. Upewnij się, że termin jest wolny.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="calendar-page">
      <header className="calendar-header">
        <div>
          <h2>Kalendarz</h2>
          <p className="calendar-subtitle">{new Date(selectedDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="calendar-controls">
          <button
            className="button button-muted"
            type="button"
            onClick={() => setSelectedDate(prev => {
              const date = new Date(prev)
              date.setDate(date.getDate() - 1)
              return date.toISOString().slice(0, 10)
            })}
            aria-label="Poprzedni dzień"
          >
            ←
          </button>
          <input
            className="input calendar-date-input"
            type="date"
            value={selectedDate}
            onChange={event => {
              if (!event.target.value) return
              setSelectedDate(event.target.value)
            }}
          />
          <button
            className="button button-muted"
            type="button"
            onClick={() => setSelectedDate(prev => {
              const date = new Date(prev)
              date.setDate(date.getDate() + 1)
              return date.toISOString().slice(0, 10)
            })}
            aria-label="Następny dzień"
          >
            →
          </button>
        </div>
      </header>

      {error && <div className="badge" style={{ background: '#422b30', color: '#fca5a5' }}>{error}</div>}

      <section className="calendar-board">
        {loading && <div className="calendar-loader">Ładowanie grafiku…</div>}
        <div className="calendar-grid">
          {slots.map((slot, index) => {
            const reservation = reservationLookup.get(index) ?? null
            const occupied = Boolean(reservation)

            return (
              <Fragment key={slot.label}>
                <div className="calendar-time">{slot.label}</div>
                {slot.minutes < WORK_END ? (
                  <div className={`calendar-slot${occupied ? ' is-active' : ' is-empty'}`}>
                    {occupied ? (
                      <div className="calendar-slot-content">
                        <div className="calendar-slot-header">
                          <span>{reservation!.startTime}</span>
                          <span>{reservation!.durationMinutes} min</span>
                        </div>
                        <div className="calendar-slot-client">{reservation!.clientName}</div>
                        <div className="calendar-slot-service">
                          {reservation!.serviceType === 'treatment' ? 'Zabieg' : 'Konsultacja'}
                        </div>
                        {reservation!.notes && <div className="calendar-slot-note">{reservation!.notes}</div>}
                        <div className="calendar-slot-actions">
                          <button className="calendar-slot-action" type="button" aria-label="Edytuj wizytę" onClick={() => openEdit(reservation!)}>
                            📝
                          </button>
                          <button
                            className="calendar-slot-action danger"
                            type="button"
                            aria-label="Usuń wizytę"
                            onClick={() => confirmDelete(reservation!)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="calendar-slot-button"
                        onClick={() => openSlot(slot)}
                        disabled={loading}
                        aria-label={`Dodaj wizytę o ${slot.label}`}
                      >
                        +
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="calendar-slot terminal" />
                )}
              </Fragment>
            )
          })}
        </div>
        {!loading && reservationLookup.size === 0 && (
          <div className="calendar-empty-message">
            Brak wizyt w tym dniu. Kliknij w wolny slot, aby dodać termin.
          </div>
        )}
      </section>

      {modalOpen && slotTime && (
        <div className="modal" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="modal-card calendar-modal" onClick={event => event.stopPropagation()}>
            <h3>{editingReservation ? 'Edytuj wizytę' : 'Nowa wizyta'}</h3>
            <p className="calendar-modal-meta">
              {new Date(selectedDate).toLocaleDateString('pl-PL')} • {slotTime ?? '--:--'}
              {editingReservation && ` • ${editingReservation.clientName}`}
            </p>
            <form className="calendar-modal-form" onSubmit={handleSubmit}>
              <label className="calendar-modal-field">
                <span>Klient</span>
                <input
                  className="input"
                  placeholder="Szukaj po imieniu lub nazwisku"
                  value={clientQuery}
                  disabled={Boolean(editingReservation)}
                  onChange={event => {
                    setClientQuery(event.target.value)
                    setSelectedClient(null)
                  }}
                />
                {clientError && <small className="calendar-modal-error">{clientError}</small>}
                {!editingReservation && (
                  <div className="calendar-client-results">
                    {clientLoading && <div className="calendar-client-placeholder">Ładowanie…</div>}
                    {!clientLoading && clientResults.length === 0 && (
                      <div className="calendar-client-placeholder">Brak wyników</div>
                    )}
                    {!clientLoading && clientResults.map(client => {
                      const label = `${client.firstName} ${client.lastName}`
                      const isActive = selectedClient?.id === client.id
                      return (
                        <button
                          key={client.id}
                          type="button"
                          className={`calendar-client-item${isActive ? ' is-active' : ''}`}
                          onClick={() => {
                            setSelectedClient(client)
                            setClientQuery(label)
                            setClientError('')
                          }}
                        >
                          <span>{label}</span>
                          <small>{client.phone}</small>
                        </button>
                      )
                    })}
                  </div>
                )}
              </label>

              <div className="calendar-modal-row">
                <label className="calendar-modal-field">
                  <span>Typ wizyty</span>
                  <select className="input" value={serviceType} onChange={event => setServiceType(event.target.value as ReservationServiceType)}>
                    {serviceOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="calendar-modal-field">
                  <span>Czas trwania</span>
                  <select className="input" value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))}>
                    {durationOptions.filter(option => option <= maxSelectableDuration).map(option => (
                      <option key={option} value={option}>{option} minut</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="calendar-modal-field">
                <span>Notatka (opcjonalnie)</span>
                <textarea
                  className="input calendar-modal-notes"
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Dodatkowe informacje dla zespołu…"
                />
              </label>

              {submitError && <div className="calendar-modal-error">{submitError}</div>}

              <div className="calendar-modal-actions">
                <button type="button" className="button button-muted" onClick={closeModal} disabled={submitting}>
                  Anuluj
                </button>
                <button type="submit" className="button" disabled={submitting}>
                  {submitting ? 'Zapisywanie…' : editingReservation ? 'Zapisz zmiany' : 'Dodaj wizytę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal" role="dialog" aria-modal="true" onClick={closeDeleteModal}>
          <div className="modal-card calendar-delete-modal" onClick={event => event.stopPropagation()}>
            <h3>Czy na pewno usunąć wizytę?</h3>
            <p>{deleteTarget.clientName} • {deleteTarget.startTime}</p>
            {deleteError && <div className="calendar-modal-error">{deleteError}</div>}
            <div className="calendar-modal-actions">
              <button className="button button-muted" type="button" onClick={closeDeleteModal} disabled={deleting}>Anuluj</button>
              <button
                className="button button-danger"
                type="button"
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    await deleteReservation(deleteTarget.id)
                    setDeleteTarget(null)
                    await loadReservations(selectedDate)
                  } catch (err) {
                    console.error(err)
                    setDeleteError('Nie udało się usunąć wizyty.')
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting}
              >
                {deleting ? 'Usuwanie…' : 'Usuń'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
