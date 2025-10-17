import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClient, updateClient } from '../api/clients'
import { getClientReservations } from '../api/reservations'
import type { Client, ClientReservationEntry, ClientReservationTimeline } from '../types'

const DEFAULT_PREFIX = '+48'

type FormState = {
  firstName: string
  lastName: string
  phone: string
  email: string
  birthDate: string
  street: string
  city: string
  postalCode: string
  notes: string
  allowEmail: boolean
  allowSms: boolean
  allowPhoto: boolean
}

type BooleanKey = 'allowEmail' | 'allowSms' | 'allowPhoto'
type TextKey = Exclude<keyof FormState, BooleanKey>

const toIsoDate = (value?: string | null) => (value ? value.split('T')[0] ?? value : '')
const digitsOnly = (value: string) => value.replace(/\D/g, '')
const extractPrefix = (phone: string) => phone.match(/^\+\d+/)?.[0] ?? DEFAULT_PREFIX

function formatDate(value?: string | null) {
  if (!value) return 'Brak danych'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatAddress(street?: string | null, postalCode?: string | null, city?: string | null) {
  const parts: string[] = []
  if (street) parts.push(street)
  const cityPart = [postalCode, city].filter(Boolean).join(' ').trim()
  if (cityPart) parts.push(cityPart)
  return parts.length ? parts.join(', ') : 'Brak danych'
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: value, time: '' }
  }
  return {
    date: date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  }
}

function mapClientToForm(client: Client): FormState {
  return {
    firstName: client.firstName,
    lastName: client.lastName,
    phone: digitsOnly(client.phone),
    email: client.email ?? '',
    birthDate: toIsoDate(client.birthDate ?? null),
    street: client.street ?? '',
    city: client.city ?? '',
    postalCode: client.postalCode ?? '',
    notes: client.notes ?? '',
    allowEmail: client.allowEmail,
    allowSms: client.allowSms,
    allowPhoto: client.allowPhoto
  }
}

export default function ClientDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [prefix, setPrefix] = useState(DEFAULT_PREFIX)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [timeline, setTimeline] = useState<ClientReservationTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [timelineError, setTimelineError] = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setError('')
      try {
        const data = await getClient(id)
        setClient(data)
        setForm(mapClientToForm(data))
        setPrefix(extractPrefix(data.phone))
      } catch (err) {
        console.error(err)
        setError('Nie udalo sie pobrac klienta')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  useEffect(() => {
    if (!id) return
    setTimelineLoading(true)
    setTimelineError('')
    getClientReservations(id)
      .then(data => setTimeline(data))
      .catch(err => {
        console.error(err)
        setTimeline(null)
        setTimelineError('Nie udało się pobrać wizyt klienta')
      })
      .finally(() => setTimelineLoading(false))
  }, [id])

  const hasChanges = useMemo(() => {
    if (!client || !form) return false
    const baseline = mapClientToForm(client)
    const changed = (Object.keys(baseline) as Array<keyof FormState>).some(key => baseline[key] !== form[key])
    return changed || extractPrefix(client.phone) !== prefix
  }, [client, form, prefix])

  function renderTimelineEntry(entry: ClientReservationEntry) {
    const { date, time } = formatDateTimeLabel(entry.start)
    return (
      <article key={entry.id} className="timeline-item">
        <header className="timeline-item-header">
          <span>{date}</span>
          <span>{time} • {entry.durationMinutes} min</span>
        </header>
        <div className="timeline-item-primary">{entry.serviceLabel}</div>
        {entry.notes && <div className="timeline-item-notes">{entry.notes}</div>}
        <footer className="timeline-item-footer">
          <span>Typ: {entry.serviceType === 'treatment' ? 'Zabieg' : 'Konsultacja'}</span>
          <span>Status: {entry.status}</span>
        </footer>
      </article>
    )
  }

  if (!id) {
    return (
      <div className="card">
        <p>Nie znaleziono klienta.</p>
        <Link to="/clients" className="button" style={{ display: 'inline-block', marginTop: 12 }}>
          Wroc do listy
        </Link>
      </div>
    )
  }

  if (loading || !form || !client) {
    return <div className="card">Ladowanie...</div>
  }

  function handleTextChange(key: TextKey, value: string) {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  function handleBooleanChange(key: BooleanKey, value: boolean) {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  async function saveChanges() {
    if (!id || !form) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: `${prefix} ${form.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`,
        email: form.email || undefined,
        birthDate: form.birthDate || undefined,
        street: form.street || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        notes: form.notes || undefined,
        allowEmail: form.allowEmail,
        allowSms: form.allowSms,
        allowPhoto: form.allowPhoto
      }

      const updated = await updateClient(id, payload)
      setClient(updated)
      setForm(mapClientToForm(updated))
      setPrefix(extractPrefix(updated.phone))
      setEditing(false)
      setConfirmOpen(false)
    } catch (err) {
      console.error(err)
      setError('Nie udalo sie zapisac zmian')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{client.firstName} {client.lastName}</h2>
          <span className="detail-label">ID: {client.id}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {editing ? (
            <>
              <button
                className="button button-muted"
                onClick={() => {
                  setEditing(false)
                  setForm(mapClientToForm(client))
                  setPrefix(extractPrefix(client.phone))
                }}
              >
                Anuluj
              </button>
              <button className="button" disabled={!hasChanges || saving} onClick={() => setConfirmOpen(true)}>
                {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </>
          ) : (
            <button className="button button-muted" onClick={() => setEditing(true)}>Edytuj dane</button>
          )}
          <Link to="/clients" className="button">Wroc do listy</Link>
        </div>
      </header>

      {error && editing && <div className="badge" style={{ background: '#44263b', color: '#fbcfe8' }}>{error}</div>}

      {!editing ? (
        <>
          <section className="detail-grid">
            <div>
              <span className="detail-label">Email</span>
              <p className="detail-value">{client.email || 'Brak danych'}</p>
            </div>
            <div>
              <span className="detail-label">Telefon</span>
              <p className="detail-value">{client.phone}</p>
            </div>
            <div>
              <span className="detail-label">Data urodzenia</span>
              <p className="detail-value">{formatDate(client.birthDate)}</p>
            </div>
            <div>
              <span className="detail-label">Adres</span>
              <p className="detail-value">{formatAddress(client.street, client.postalCode, client.city)}</p>
            </div>
          </section>
          <section>
            <span className="detail-label">Notatki</span>
            <p className="detail-value">{client.notes || 'Brak notatek'}</p>
          </section>
          <section>
            <span className="detail-label">Zgody</span>
            <div className="consent-row">
              <span className={client.allowEmail ? 'consent-chip active' : 'consent-chip'}>E-mail</span>
              <span className={client.allowSms ? 'consent-chip active' : 'consent-chip'}>SMS</span>
              <span className={client.allowPhoto ? 'consent-chip active' : 'consent-chip'}>Publikacja zdjec</span>
            </div>
          </section>
        </>
      ) : (
        <form className="detail-form">
          <label>
            <span>Imie</span>
            <input className="input" value={form.firstName} onChange={e => handleTextChange('firstName', e.target.value)} />
          </label>
          <label>
            <span>Nazwisko</span>
            <input className="input" value={form.lastName} onChange={e => handleTextChange('lastName', e.target.value)} />
          </label>
          <label>
            <span>Telefon</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ maxWidth: 90 }} value={prefix} onChange={e => setPrefix(e.target.value)} />
              <input className="input" style={{ flex: 1 }} value={form.phone} maxLength={9} onChange={e => handleTextChange('phone', e.target.value.replace(/\D/g, ''))} />
            </div>
          </label>
          <label>
            <span>Email</span>
            <input className="input" value={form.email} onChange={e => handleTextChange('email', e.target.value)} />
          </label>
          <label>
            <span>Data urodzenia</span>
            <input className="input" type="date" value={form.birthDate} onChange={e => handleTextChange('birthDate', e.target.value)} />
          </label>
          <label>
            <span>Ulica</span>
            <input className="input" value={form.street} onChange={e => handleTextChange('street', e.target.value)} />
          </label>
          <label>
            <span>Miasto</span>
            <input className="input" value={form.city} onChange={e => handleTextChange('city', e.target.value)} />
          </label>
          <label>
            <span>Kod pocztowy</span>
            <input className="input" value={form.postalCode} maxLength={6} onChange={e => handleTextChange('postalCode', e.target.value.replace(/[^0-9-]/g, ''))} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Notatki</span>
            <textarea className="input" rows={3} value={form.notes} onChange={e => handleTextChange('notes', e.target.value)} />
          </label>
          <div className="checkbox-row" style={{ gridColumn: '1 / -1' }}>
            <label><input type="checkbox" checked={form.allowEmail} onChange={e => handleBooleanChange('allowEmail', e.target.checked)} /> Wysylaj e-maile</label>
            <label><input type="checkbox" checked={form.allowSms} onChange={e => handleBooleanChange('allowSms', e.target.checked)} /> Wysylaj SMS</label>
            <label><input type="checkbox" checked={form.allowPhoto} onChange={e => handleBooleanChange('allowPhoto', e.target.checked)} /> Zgoda na publikacje zdjec</label>
          </div>
        </form>
      )}

      <section className="timeline-section">
        <h3>Historia i przyszle zabiegi</h3>
        {timelineLoading ? (
          <p className="timeline-empty">Ładowanie wizyt...</p>
        ) : timelineError ? (
          <div className="badge" style={{ background: '#44263b', color: '#fbcfe8' }}>{timelineError}</div>
        ) : !timeline || (timeline.upcoming.length === 0 && timeline.past.length === 0) ? (
          <p className="timeline-empty">Brak wizyt powiązanych z tym klientem.</p>
        ) : (
          <div className="timeline-columns">
            <div className="timeline-column">
              <header className="timeline-column-header">Nadchodzące</header>
              {timeline.upcoming.length === 0 && <p className="timeline-empty">Brak zaplanowanych wizyt.</p>}
              {timeline.upcoming.map(renderTimelineEntry)}
            </div>
            <div className="timeline-column">
              <header className="timeline-column-header">Zrealizowane</header>
              {timeline.past.length === 0 && <p className="timeline-empty">Brak zrealizowanych wizyt.</p>}
              {timeline.past.map(renderTimelineEntry)}
            </div>
          </div>
        )}
      </section>

      {confirmOpen && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setConfirmOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Potwierdz zmiany</h3>
            <p>Czy na pewno zapisac zmiany danych klienta?</p>
            <div className="modal-actions">
              <button className="button button-muted" onClick={() => setConfirmOpen(false)} disabled={saving}>Anuluj</button>
              <button className="button" onClick={saveChanges} disabled={saving || !hasChanges}>{saving ? 'Zapisywanie...' : 'Zatwierdz'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
