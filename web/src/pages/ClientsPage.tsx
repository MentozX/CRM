import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient, deleteClient, listClients, updateClient } from '../api/clients'
import type { Client } from '../types'

type FormState = {
  firstName: string
  lastName: string
  phone: string
  email: string
  birthDate: string
  notes: string
  street: string
  city: string
  postalCode: string
  allowEmail: boolean
  allowSms: boolean
  allowPhoto: boolean
}

const createInitialForm = (): FormState => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  notes: '',
  street: '',
  city: '',
  postalCode: '',
  allowEmail: true,
  allowSms: true,
  allowPhoto: false
})

const createFormFromClient = (client: Client): FormState => ({
  firstName: client.firstName,
  lastName: client.lastName,
  phone: client.phone.replace(/\D/g, ''),
  email: client.email ?? '',
  birthDate: client.birthDate ? client.birthDate.split('T')[0] ?? client.birthDate : '',
  notes: client.notes ?? '',
  street: client.street ?? '',
  city: client.city ?? '',
  postalCode: client.postalCode ?? '',
  allowEmail: client.allowEmail,
  allowSms: client.allowSms,
  allowPhoto: client.allowPhoto
})

function formatClientAddress(client: Pick<Client, 'street' | 'postalCode' | 'city'>) {
  const parts = [client.street, client.postalCode, client.city].filter(Boolean) as string[]
  return parts.length ? parts.join(', ') : 'Brak danych'
}


export default function ClientsPage() {
const [q, setQ] = useState('')
const [loading, setLoading] = useState(true)
const [err, setErr] = useState('')
const [rows, setRows] = useState<Client[]>([])
const [creating, setCreating] = useState(false)
const [createError, setCreateError] = useState('')
const [form, setForm] = useState<FormState>(createInitialForm())
const [countryCode, setCountryCode] = useState('+48')
const [birthInput, setBirthInput] = useState('')
const birthInputRef = useRef<HTMLInputElement | null>(null)
const calendarRef = useRef<HTMLDivElement | null>(null)
const [showCalendar, setShowCalendar] = useState(false)
const [calendarMonth, setCalendarMonth] = useState(() => new Date())
const [selectedClient, setSelectedClient] = useState<Client | null>(null)
const [deleteError, setDeleteError] = useState('')
const [deletingId, setDeletingId] = useState<string | null>(null)
const [confirmTarget, setConfirmTarget] = useState<Client | null>(null)
const [editMode, setEditMode] = useState(false)
const [editForm, setEditForm] = useState<FormState | null>(null)
const [savingEdit, setSavingEdit] = useState(false)
const [confirmEditOpen, setConfirmEditOpen] = useState(false)
const [editError, setEditError] = useState('')
const [editPrefix, setEditPrefix] = useState('+48')
const navigate = useNavigate()

useEffect(() => {
  if (form.birthDate) {
    setBirthInput(formatDisplayDate(form.birthDate))
  }
}, [form.birthDate])

useEffect(() => {
  if (!showCalendar) return

  const base = form.birthDate ? new Date(form.birthDate) : new Date()
  setCalendarMonth(base)

  const handler = (event: MouseEvent) => {
    if (calendarRef.current?.contains(event.target as Node)) return
    if (birthInputRef.current?.contains(event.target as Node)) return
    setShowCalendar(false)
  }

  document.addEventListener('mousedown', handler)
  return () => document.removeEventListener('mousedown', handler)
}, [showCalendar, form.birthDate])

function formatDisplayDate(iso?: string | null) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

function handleBirthManual(value: string) {
  const digits = value.replace(/[^\d]/g, '').slice(0, 8)

  if (!digits) {
    setBirthInput('')
    setForm(prev => ({ ...prev, birthDate: '' }))
    return
  }

  let display: string
  if (digits.length <= 2) {
    display = digits.length === 2 ? `${digits}.` : digits
  } else if (digits.length <= 4) {
    const day = digits.slice(0, 2)
    const monthRaw = digits.slice(2)
    const month = monthRaw.padStart(2, '0')
    display = `${day}.${month}`
  } else {
    const day = digits.slice(0, 2)
    const monthRaw = digits.slice(2, 4)
    const month = monthRaw.padStart(2, '0')
    const year = digits.slice(4)
    display = `${day}.${month}.${year}`
  }

  setBirthInput(display)

  if (digits.length === 8) {
    const year = digits.slice(4)
    const month = digits.slice(2, 4).padStart(2, '0')
    const day = digits.slice(0, 2)
    const iso = `${year}-${month}-${day}`
    setForm(prev => ({ ...prev, birthDate: iso }))
    setCalendarMonth(new Date(Number(year), Number(month) - 1, Number(day)))
  } else {
    setForm(prev => ({ ...prev, birthDate: '' }))
  }
}

function capitalizeWords(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => `${sep}${ch.toUpperCase()}`)
    .replace(/^\s+/, '')
}


async function load() {
setLoading(true)
setErr('')
try {
const data = await listClients(q)
setRows(data)
if (selectedClient) {
  const refreshed = data.find(item => item.id === selectedClient.id)
  setSelectedClient(refreshed ?? null)
  setEditForm(refreshed ? createFormFromClient(refreshed) : null)
}
} catch (e) {
setErr('blad pobierania')
} finally {
setLoading(false)
}
}


useEffect(() => { load() }, [])

type PreferenceKey = 'allowEmail' | 'allowSms' | 'allowPhoto'
type TextKey = Exclude<keyof FormState, PreferenceKey>

function handleTextChange(key: TextKey, value: string) {
  setForm(prev => ({ ...prev, [key]: value }))
}

function handlePreferenceChange(key: PreferenceKey, value: boolean) {
  setForm(prev => ({ ...prev, [key]: value }))
}

function handleEditTextChange(key: TextKey, value: string) {
  setEditForm(prev => (prev ? { ...prev, [key]: value } : prev))
}

function handleEditPreferenceChange(key: PreferenceKey, value: boolean) {
  setEditForm(prev => (prev ? { ...prev, [key]: value } : prev))
}

async function submitNew(e: FormEvent) {
  e.preventDefault()
  if (!form.firstName || !form.lastName || !form.phone) {
    setCreateError('Imie, nazwisko i telefon sa wymagane')
    return
  }

  if (!/^\d{9}$/.test(form.phone)) {
    setCreateError('Podaj dokladnie 9 cyfr numeru telefonu')
    return
  }

  setCreating(true)
  setCreateError('')
  try {
    const normalizedFirstName = capitalizeWords(form.firstName)
    const normalizedLastName = capitalizeWords(form.lastName)
    const formattedPhone = `${countryCode} ${form.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`

    await createClient({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      phone: formattedPhone,
      email: form.email || undefined,
      birthDate: form.birthDate || undefined,
      notes: form.notes || undefined,
      street: form.street || undefined,
      city: form.city || undefined,
      postalCode: form.postalCode || undefined,
      allowEmail: form.allowEmail,
      allowSms: form.allowSms,
      allowPhoto: form.allowPhoto
    })
    setForm(createInitialForm())
    setCountryCode('+48')
    setBirthInput('')
    setShowCalendar(false)
    await load()
  } catch (err) {
    console.error(err)
    setCreateError('Nie udalo sie dodac klienta')
  } finally {
    setCreating(false)
  }
}


const filtered = useMemo(() => rows, [rows])
const editHasChanges = useMemo(() => {
  if (!selectedClient || !editForm) return false
  const baseline = createFormFromClient(selectedClient)
  const changed = (Object.keys(baseline) as Array<keyof FormState>).some(key => baseline[key] !== editForm[key])
  const basePrefix = selectedClient.phone.match(/^\+\d+/)?.[0] ?? '+48'
  return changed || basePrefix !== editPrefix
}, [selectedClient, editForm, editPrefix])

function handleCalendarSelect(iso: string) {
  setForm(prev => ({ ...prev, birthDate: iso }))
  setBirthInput(formatDisplayDate(iso))
  setShowCalendar(false)
  const [y, m, d] = iso.split('-').map(Number)
  setCalendarMonth(new Date(y, m - 1, d))
}

function handleRowClick(client: Client) {
  setSelectedClient(client)
  setEditMode(false)
  setEditForm(createFormFromClient(client))
  setConfirmEditOpen(false)
  const prefixMatch = client.phone.match(/^\+\d+/)
  setEditPrefix(prefixMatch ? prefixMatch[0] : '+48')
  setEditError('')
}

function closePreview() {
  setSelectedClient(null)
  setEditMode(false)
  setEditForm(null)
  setConfirmEditOpen(false)
  setEditError('')
}

async function handleDelete(id: string | number) {
  setDeleteError('')
  const idStr = String(id)
  setDeletingId(idStr)
  try {
    await deleteClient(idStr)
    setSelectedClient(prev => {
      if (!prev) return prev
      return String(prev.id) === idStr ? null : prev
    })
    setEditForm(null)
    setEditMode(false)
    await load()
  } catch (err) {
    console.error(err)
    setDeleteError('Nie udalo sie usunac klienta')
  } finally {
    setDeletingId(null)
  }
}

async function saveEditChanges() {
  if (!selectedClient || !editForm) return
  setSavingEdit(true)
  setEditError('')
  const prefix = editPrefix || '+48'
  try {
    const payload = {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      phone: `${prefix} ${editForm.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`,
      email: editForm.email || undefined,
      birthDate: editForm.birthDate || undefined,
      notes: editForm.notes || undefined,
      street: editForm.street || undefined,
      city: editForm.city || undefined,
      postalCode: editForm.postalCode || undefined,
      allowEmail: editForm.allowEmail,
      allowSms: editForm.allowSms,
      allowPhoto: editForm.allowPhoto
    }
    const updated = await updateClient(String(selectedClient.id), payload)
    setSelectedClient(updated)
    setEditForm(createFormFromClient(updated))
    setRows(prev => prev.map(item => (item.id === updated.id ? updated : item)))
    setEditMode(false)
    setConfirmEditOpen(false)
  } catch (err) {
    console.error(err)
    setEditError('Nie udalo sie zapisac zmian')
  } finally {
    setSavingEdit(false)
  }
}

function startEditMode() {
  if (!selectedClient) return
  setEditMode(true)
  setEditForm(createFormFromClient(selectedClient))
  const prefixMatch = selectedClient.phone.match(/^\+\d+/)
  setEditPrefix(prefixMatch ? prefixMatch[0] : '+48')
  setEditError('')
}

function cancelEditMode() {
  if (!selectedClient) return
  setEditMode(false)
  setEditForm(createFormFromClient(selectedClient))
  const prefixMatch = selectedClient.phone.match(/^\+\d+/)
  setEditPrefix(prefixMatch ? prefixMatch[0] : '+48')
  setConfirmEditOpen(false)
  setEditError('')
}

const weekdayLabels = ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So', 'Nd']
const year = calendarMonth.getFullYear()
const monthIndex = calendarMonth.getMonth()
const monthLabel = calendarMonth.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
const firstOfMonth = new Date(year, monthIndex, 1)
const offset = (firstOfMonth.getDay() + 6) % 7
const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7
const today = new Date()
const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const calendarCells = Array.from({ length: totalCells }, (_, index) => {
  const dayNumber = index - offset + 1
  if (dayNumber < 1 || dayNumber > daysInMonth) {
    return <span key={`empty-${index}`} className="date-picker-day empty" />
  }

  const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
  const isSelected = form.birthDate === iso
  const isToday = todayIso === iso

  const className = [
    'date-picker-day',
    isSelected ? 'selected' : '',
    !isSelected && isToday ? 'today' : ''
  ].filter(Boolean).join(' ')

  return (
    <button type="button" key={iso} className={className} onClick={() => handleCalendarSelect(iso)}>
      {dayNumber}
    </button>
  )
})


return (
  <div className="card" style={{ display: 'grid', gap: 24 }}>
    <section>
      <h3 style={{ marginTop: 0 }}>Nowy klient</h3>
      <form onSubmit={submitNew} style={{ display: 'grid', gap: 12 }}>
        <div className="form-grid">
          <input className="input" placeholder="Imie" value={form.firstName} onChange={e => handleTextChange('firstName', e.target.value)} />
          <input className="input" placeholder="Nazwisko" value={form.lastName} onChange={e => handleTextChange('lastName', e.target.value)} />
          <div className="form-phone-group">
            <select className="input" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
              <option value="+48">+48 (PL)</option>
              <option value="+49">+49 (DE)</option>
              <option value="+44">+44 (UK)</option>
              <option value="+420">+420 (CZ)</option>
              <option value="+421">+421 (SK)</option>
            </select>
            <input
              className="input"
              placeholder="123456789"
              value={form.phone}
              onChange={e => handleTextChange('phone', e.target.value.replace(/\D/g, ''))}
              maxLength={9}
            />
          </div>
          <input className="input" placeholder="Email" value={form.email} onChange={e => handleTextChange('email', e.target.value)} />
          <input className="input" placeholder="Ulica i numer" value={form.street} onChange={e => handleTextChange('street', e.target.value)} />
          <input className="input" placeholder="Miasto" value={form.city} onChange={e => handleTextChange('city', e.target.value)} />
          <input className="input" placeholder="Kod pocztowy" value={form.postalCode} onChange={e => handleTextChange('postalCode', e.target.value.replace(/[^0-9-]/g, ''))} maxLength={6} />
          <div className="form-date-group">
            <input
              ref={birthInputRef}
              className="input"
              placeholder="dd.mm.rrrr"
              value={birthInput}
              onChange={e => handleBirthManual(e.target.value)}
              onFocus={() => {
                const base = form.birthDate ? new Date(form.birthDate) : new Date()
                setCalendarMonth(base)
                setShowCalendar(true)
              }}
            />
            <button
              type="button"
              className="button"
              style={{ minWidth: 44 }}
              onClick={() => {
                setShowCalendar(prev => {
                  const next = !prev
                  if (!prev) {
                    const base = form.birthDate ? new Date(form.birthDate) : new Date()
                    setCalendarMonth(base)
                    setBirthInput(prevInput => prevInput || (form.birthDate ? formatDisplayDate(form.birthDate) : ''))
                  }
                  if (!next) {
                    birthInputRef.current?.focus()
                  } else {
                    requestAnimationFrame(() => birthInputRef.current?.focus())
                  }
                  return next
                })
              }}
            >
              📅
            </button>
            {showCalendar && (
              <div
                ref={calendarRef}
                className="date-picker"
                style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0 }}
                onMouseDown={e => e.preventDefault()}
              >
                <div className="date-picker-header">
                  <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>{'<'}</button>
                  <span>{monthLabel}</span>
                  <button type="button" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>{'>'}</button>
                </div>
                <div className="date-picker-weekdays">
                  {weekdayLabels.map(label => <span key={label}>{label}</span>)}
                </div>
                <div className="date-picker-grid">
                  {calendarCells}
                </div>
              </div>
            )}
          </div>
        </div>
        <textarea className="input" placeholder="Notatki" value={form.notes} onChange={e => handleTextChange('notes', e.target.value)} rows={3} />
        <div className="checkbox-row">
          <label>
            <input type="checkbox" checked={form.allowEmail} onChange={e => handlePreferenceChange('allowEmail', e.target.checked)} /> Wysyłaj e-maile
          </label>
          <label>
            <input type="checkbox" checked={form.allowSms} onChange={e => handlePreferenceChange('allowSms', e.target.checked)} /> Wysyłaj SMS
          </label>
          <label>
            <input type="checkbox" checked={form.allowPhoto} onChange={e => handlePreferenceChange('allowPhoto', e.target.checked)} /> Zgoda na publikację zdjęć
          </label>
        </div>
        {createError && <span className="badge">{createError}</span>}
        <button className="button" type="submit" disabled={creating}>
          {creating ? 'Zapisywanie...' : 'Dodaj klienta'}
        </button>
      </form>
    </section>
    <section>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Szukaj" value={q} onChange={e => setQ(e.target.value)} />
        <button className="button" onClick={load}>Wyszukaj</button>
        {loading && <span className="badge">wczytywanie...</span>}
        {err && <span className="badge">{err}</span>}
      </div>
      {deleteError && <div className="badge" style={{ background: '#44263b', color: '#fbcfe8' }}>{deleteError}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imie</th>
            <th>Nazwisko</th>
            <th>Telefon</th>
            <th>Miasto</th>
            <th>Email</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} className="table-row" onClick={() => handleRowClick(c)}>
              <td>{c.id}</td>
              <td>{c.firstName}</td>
              <td>{c.lastName}</td>
              <td>{c.phone}</td>
              <td>{c.city || '-'}</td>
              <td>{c.email || '-'}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="button button-muted"
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/clients/${c.id}`)
                    }}
                  >
                    Szczegóły
                  </button>
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setConfirmTarget(c)
                    }}
                    disabled={deletingId === String(c.id)}
                  >
                    {deletingId === String(c.id) ? 'Usuwanie...' : 'Usuń'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
    {confirmTarget && (
      <div className="modal" role="dialog" aria-modal="true" onClick={() => setConfirmTarget(null)}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <h3>Usuń klienta</h3>
          <p>Czy na pewno chcesz usunąć klienta? <strong>{confirmTarget.firstName} {confirmTarget.lastName}</strong>?</p>
          <p className="detail-label">Ta operacja jest nieodwracalna.</p>
          <div className="modal-actions">
            <button
              className="button button-danger"
              onClick={() => {
                const target = confirmTarget
                setConfirmTarget(null)
                handleDelete(target.id)
              }}
              disabled={deletingId === String(confirmTarget.id)}
            >
              {deletingId === String(confirmTarget.id) ? 'Usuwanie...' : 'Tak, usun'}
            </button>
            <button className="button button-muted" onClick={() => setConfirmTarget(null)}>Anuluj</button>
          </div>
        </div>
      </div>
    )}
    {selectedClient && (
      <div className="overlay" onClick={closePreview}>
        <div className="overlay-card" onClick={e => e.stopPropagation()}>
          <header className="overlay-header">
            <div>
              <h3 style={{ margin: 0 }}>{selectedClient.firstName} {selectedClient.lastName}</h3>
              <span className="detail-label">{selectedClient.email || 'Brak emaila'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {editMode ? (
                <Fragment>
                  <button className="button button-muted" onClick={cancelEditMode}>Anuluj</button>
                  <button className="button" disabled={!editHasChanges || savingEdit} onClick={() => setConfirmEditOpen(true)}>
                    {savingEdit ? 'Zapisywanie...' : 'Zapisz'}
                  </button>
                </Fragment>
              ) : (
                <button className="button button-muted" onClick={startEditMode}>Edytuj dane</button>
              )}
              <button className="button button-muted" onClick={() => navigate(`/clients/${selectedClient.id}`)}>Przejdz do szczegolow</button>
            </div>
          </header>
          {editError && <div className="badge" style={{ background: '#44263b', color: '#fbcfe8' }}>{editError}</div>}
          {editMode && editForm ? (
            <form className="detail-form">
              <label>
                <span>Imie</span>
                <input className="input" value={editForm.firstName} onChange={e => handleEditTextChange('firstName', e.target.value)} />
              </label>
              <label>
                <span>Nazwisko</span>
                <input className="input" value={editForm.lastName} onChange={e => handleEditTextChange('lastName', e.target.value)} />
              </label>
              <label>
                <span>Telefon</span>
                <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ maxWidth: 90 }} value={editPrefix} onChange={e => setEditPrefix(e.target.value)} />
              <input
                className="input"
                style={{ minWidth: 170 }}
                value={editForm.phone}
                maxLength={9}
                onChange={e => handleEditTextChange('phone', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </label>
              <label>
                <span>Email</span>
                <input className="input" value={editForm.email} onChange={e => handleEditTextChange('email', e.target.value)} />
              </label>
              <label>
                <span>Data urodzenia</span>
                <input className="input" type="date" value={editForm.birthDate} onChange={e => handleEditTextChange('birthDate', e.target.value)} />
              </label>
              <label>
                <span>Ulica</span>
                <input className="input" value={editForm.street} onChange={e => handleEditTextChange('street', e.target.value)} />
              </label>
              <label>
                <span>Miasto</span>
                <input className="input" value={editForm.city} onChange={e => handleEditTextChange('city', e.target.value)} />
              </label>
              <label>
                <span>Kod pocztowy</span>
                <input className="input" value={editForm.postalCode} maxLength={6} onChange={e => handleEditTextChange('postalCode', e.target.value.replace(/[^0-9-]/g, ''))} />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Notatki</span>
                <textarea className="input" rows={3} value={editForm.notes} onChange={e => handleEditTextChange('notes', e.target.value)} />
              </label>
              <div className="checkbox-row" style={{ gridColumn: '1 / -1' }}>
                <label><input type="checkbox" checked={editForm.allowEmail} onChange={e => handleEditPreferenceChange('allowEmail', e.target.checked)} /> Wysylaj e-maile</label>
                <label><input type="checkbox" checked={editForm.allowSms} onChange={e => handleEditPreferenceChange('allowSms', e.target.checked)} /> Wysylaj SMS</label>
                <label><input type="checkbox" checked={editForm.allowPhoto} onChange={e => handleEditPreferenceChange('allowPhoto', e.target.checked)} /> Zgoda na publikacje zdjec</label>
              </div>
            </form>
          ) : (
            <div className="overlay-body">
              <div>
                <span className="detail-label">Telefon</span>
                <p className="detail-value">{selectedClient.phone}</p>
              </div>
              <div>
                <span className="detail-label">Adres</span>
                <p className="detail-value">{formatClientAddress(selectedClient)}</p>
              </div>
              <div>
                <span className="detail-label">Data urodzenia</span>
                <p className="detail-value">{formatDisplayDate(selectedClient.birthDate)}</p>
              </div>
              <div>
                <span className="detail-label">Notatki</span>
                <p className="detail-value">{selectedClient.notes || 'Brak notatek'}</p>
              </div>
              <div>
                <span className="detail-label">Zgody</span>
                <div className="consent-row">
                  <span className={selectedClient.allowEmail ? 'consent-chip active' : 'consent-chip'}>E-mail</span>
                  <span className={selectedClient.allowSms ? 'consent-chip active' : 'consent-chip'}>SMS</span>
                  <span className={selectedClient.allowPhoto ? 'consent-chip active' : 'consent-chip'}>Publikacja zdjec</span>
                </div>
              </div>
            </div>
          )}
          <footer className="overlay-footer">
            <button className="button button-danger" onClick={() => setConfirmTarget(selectedClient)} disabled={deletingId === String(selectedClient.id)}>
              {deletingId === String(selectedClient.id) ? 'Usuwanie...' : 'Usun klienta'}
            </button>
            <button className="button button-muted" onClick={closePreview}>Zamknij</button>
          </footer>
        </div>
      </div>
    )}
    {confirmEditOpen && selectedClient && editForm && (
      <div className="modal" role="dialog" aria-modal="true" onClick={() => setConfirmEditOpen(false)}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <h3>Potwierdz zmiany</h3>
          <p>Czy na pewno zapisac zmiany danych klienta?</p>
          <div className="modal-actions">
            <button className="button button-muted" onClick={() => setConfirmEditOpen(false)} disabled={savingEdit}>Anuluj</button>
            <button className="button" onClick={saveEditChanges} disabled={savingEdit}>{savingEdit ? 'Zapisywanie...' : 'Zatwierdz'}</button>
          </div>
        </div>
      </div>
    )}
  </div>
)
}
