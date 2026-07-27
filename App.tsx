import { useState, useMemo } from 'react'

type ItemStatus = 'lost' | 'found'
type Category = 'All' | 'Electronics' | 'Clothing' | 'Books' | 'Accessories' | 'Sports' | 'Keys' | 'Other'

interface Item {
  id: number
  status: ItemStatus
  title: string
  category: Exclude<Category, 'All'>
  location: string
  date: string
  description: string
  contact: string
  resolved: boolean
}

const SEED_ITEMS: Item[] = [
  { id: 1, status: 'found', title: 'Black HP Laptop', category: 'Electronics', location: 'Library, 2nd Floor', date: '2026-07-25', description: 'Found near the study carrels. Has a small sticker on the lid.', contact: 'library@school.edu', resolved: false },
  { id: 2, status: 'lost', title: 'Blue Hydro Flask', category: 'Other', location: 'Gymnasium', date: '2026-07-24', description: '32oz, denim blue with a few stickers. Name "Jordan" written on the bottom.', contact: 'jordan.m@student.edu', resolved: false },
  { id: 3, status: 'found', title: 'AirPods Pro (White)', category: 'Electronics', location: 'Cafeteria', date: '2026-07-26', description: 'Found on table 7 during lunch. Case included.', contact: 'front.desk@school.edu', resolved: false },
  { id: 4, status: 'lost', title: 'Calculus Textbook', category: 'Books', location: 'Room 204', date: '2026-07-23', description: 'Stewart Calculus, 8th edition. Name written inside front cover.', contact: 'priya.k@student.edu', resolved: false },
  { id: 5, status: 'found', title: 'Set of Keys (3)', category: 'Keys', location: 'Parking Lot B', date: '2026-07-26', description: 'Three keys on a ring with a red lanyard attachment.', contact: 'security@school.edu', resolved: false },
  { id: 6, status: 'lost', title: 'Grey Adidas Hoodie', category: 'Clothing', location: 'PE Locker Room', date: '2026-07-22', description: 'Size M, light grey, Adidas logo on chest. Left after class.', contact: 'alex.w@student.edu', resolved: false },
  { id: 7, status: 'found', title: 'Scientific Calculator', category: 'Electronics', location: 'Room 112', date: '2026-07-25', description: 'TI-84 Plus CE, purple. Left on desk after 3rd period.', contact: 'teacher112@school.edu', resolved: false },
  { id: 8, status: 'lost', title: 'Student ID Card', category: 'Accessories', location: 'Main Hallway', date: '2026-07-26', description: 'Belongs to Sam Rivera, Grade 10. Lost somewhere near the lockers.', contact: 'sam.r@student.edu', resolved: false },
  { id: 9, status: 'found', title: 'Basketball', category: 'Sports', location: 'Gym Storage', date: '2026-07-21', description: 'Spalding basketball, slightly deflated. No markings.', contact: 'gym.staff@school.edu', resolved: false },
  { id: 10, status: 'lost', title: 'Reading Glasses', category: 'Accessories', location: 'Auditorium', date: '2026-07-24', description: 'Brown tortoiseshell frame, prescription lenses. Left during morning assembly.', contact: 'ms.chen@school.edu', resolved: false },
  { id: 11, status: 'found', title: 'Water Polo Cap', category: 'Sports', location: 'Pool Area', date: '2026-07-20', description: 'Team cap, number 7. Found in the pool bleachers.', contact: 'coach.riley@school.edu', resolved: false },
  { id: 12, status: 'lost', title: 'USB-C Charger', category: 'Electronics', location: 'Study Hall', date: '2026-07-25', description: 'Apple 30W charger, white. Left plugged in at station 4.', contact: 'tom.b@student.edu', resolved: false },
]

const CATEGORIES: Category[] = ['All', 'Electronics', 'Clothing', 'Books', 'Accessories', 'Sports', 'Keys', 'Other']

type Tab = 'browse' | 'report'
type BrowseFilter = 'all' | 'lost' | 'found'

interface FormState {
  status: ItemStatus
  title: string
  category: Exclude<Category, 'All'>
  location: string
  description: string
  contact: string
}

const EMPTY_FORM: FormState = {
  status: 'lost',
  title: '',
  category: 'Other',
  location: '',
  description: '',
  contact: '',
}

function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.08em',
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: '3px',
        backgroundColor: status === 'found' ? 'var(--color-found-light)' : 'var(--color-lost-light)',
        color: status === 'found' ? 'var(--color-found)' : 'var(--color-lost)',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  )
}

function CategoryTag({ category }: { category: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.06em',
        padding: '2px 6px',
        borderRadius: '3px',
        backgroundColor: 'var(--color-card)',
        color: 'var(--color-muted)',
        border: '1px solid var(--color-border)',
      }}
    >
      {category}
    </span>
  )
}

function ItemCard({ item }: { item: Item }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: '6px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'box-shadow 0.15s ease',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{item.title}</h3>
        <StatusBadge status={item.status} />
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <CategoryTag category={item.category} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LocationIcon />
          {item.location}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
          {formatDate(item.date)}
        </p>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '13px', lineHeight: 1.55, margin: 0, color: '#3a3a3a' }}>{item.description}</p>
          <a
            href={`mailto:${item.contact}`}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: '12px',
              color: 'var(--color-accent)',
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <MailIcon />
            {item.contact}
          </a>
        </div>
      )}

      <p style={{ fontSize: '11px', color: '#b0b0aa', margin: 0, letterSpacing: '0.02em' }}>
        {expanded ? 'Click to collapse' : 'Click for details & contact'}
      </p>
    </div>
  )
}

function LocationIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ReportForm({ onSubmit }: { onSubmit: (item: Item) => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.location.trim()) e.location = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    if (!form.contact.trim()) e.contact = 'Required'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const newItem: Item = {
      id: Date.now(),
      ...form,
      date: new Date().toISOString().split('T')[0],
      resolved: false,
    }
    onSubmit(newItem)
    setSubmitted(true)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-found-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-found)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 6px' }}>Report submitted</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>Your item has been added to the board. Someone will be in touch if there's a match.</p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            marginTop: '8px',
            padding: '9px 20px',
            fontSize: '13px',
            fontWeight: 500,
            border: '1px solid var(--color-border)',
            borderRadius: '5px',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Submit another
        </button>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid var(--color-border)',
    borderRadius: '5px',
    background: '#fff',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-muted)',
    marginBottom: '5px',
    letterSpacing: '0.04em',
    fontFamily: 'var(--font-mono)',
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '540px' }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>I AM REPORTING A</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['lost', 'found'] as ItemStatus[]).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setForm(f => ({ ...f, status: s }))}
              style={{
                flex: 1,
                padding: '9px',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                borderColor: form.status === s ? (s === 'found' ? 'var(--color-found)' : 'var(--color-lost)') : 'var(--color-border)',
                background: form.status === s ? (s === 'found' ? 'var(--color-found-light)' : 'var(--color-lost-light)') : '#fff',
                color: form.status === s ? (s === 'found' ? 'var(--color-found)' : 'var(--color-lost)') : 'var(--color-muted)',
                fontFamily: 'var(--font-sans)',
                textTransform: 'capitalize',
              }}
            >
              {s === 'lost' ? '🔍 Lost Item' : '📦 Found Item'}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>ITEM NAME *</label>
        <input
          style={{ ...inputStyle, borderColor: errors.title ? 'var(--color-lost)' : 'var(--color-border)' }}
          placeholder="e.g. Black backpack, AirPods case..."
          value={form.title}
          onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: undefined })) }}
          onFocus={e => (e.target.style.borderColor = '#a3a3a3')}
          onBlur={e => (e.target.style.borderColor = errors.title ? 'var(--color-lost)' : 'var(--color-border)')}
        />
        {errors.title && <span style={{ fontSize: '11px', color: 'var(--color-lost)', marginTop: '3px' }}>{errors.title}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>CATEGORY</label>
          <select
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as Exclude<Category, 'All'> }))}
          >
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>LOCATION *</label>
          <input
            style={{ ...inputStyle, borderColor: errors.location ? 'var(--color-lost)' : 'var(--color-border)' }}
            placeholder="e.g. Library, Room 204..."
            value={form.location}
            onChange={e => { setForm(f => ({ ...f, location: e.target.value })); setErrors(er => ({ ...er, location: undefined })) }}
            onFocus={e => (e.target.style.borderColor = '#a3a3a3')}
            onBlur={e => (e.target.style.borderColor = errors.location ? 'var(--color-lost)' : 'var(--color-border)')}
          />
          {errors.location && <span style={{ fontSize: '11px', color: 'var(--color-lost)', marginTop: '3px' }}>{errors.location}</span>}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>DESCRIPTION *</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: '88px', lineHeight: 1.55, borderColor: errors.description ? 'var(--color-lost)' : 'var(--color-border)' }}
          placeholder="Color, size, identifying marks, brand, serial number..."
          value={form.description}
          onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(er => ({ ...er, description: undefined })) }}
          onFocus={e => (e.target.style.borderColor = '#a3a3a3')}
          onBlur={e => (e.target.style.borderColor = errors.description ? 'var(--color-lost)' : 'var(--color-border)')}
        />
        {errors.description && <span style={{ fontSize: '11px', color: 'var(--color-lost)', marginTop: '3px' }}>{errors.description}</span>}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>CONTACT EMAIL *</label>
        <input
          type="email"
          style={{ ...inputStyle, borderColor: errors.contact ? 'var(--color-lost)' : 'var(--color-border)' }}
          placeholder="your@school.edu"
          value={form.contact}
          onChange={e => { setForm(f => ({ ...f, contact: e.target.value })); setErrors(er => ({ ...er, contact: undefined })) }}
          onFocus={e => (e.target.style.borderColor = '#a3a3a3')}
          onBlur={e => (e.target.style.borderColor = errors.contact ? 'var(--color-lost)' : 'var(--color-border)')}
        />
        {errors.contact && <span style={{ fontSize: '11px', color: 'var(--color-lost)', marginTop: '3px' }}>{errors.contact}</span>}
      </div>

      <button
        type="submit"
        style={{
          padding: '11px 24px',
          fontSize: '14px',
          fontWeight: 600,
          background: 'var(--color-foreground)',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'opacity 0.15s',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Submit report
      </button>
    </form>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('browse')
  const [filter, setFilter] = useState<BrowseFilter>('all')
  const [category, setCategory] = useState<Category>('All')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Item[]>(SEED_ITEMS)

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filter !== 'all' && item.status !== filter) return false
      if (category !== 'All' && item.category !== category) return false
      if (search) {
        const q = search.toLowerCase()
        return item.title.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [items, filter, category, search])

  const lostCount = items.filter(i => i.status === 'lost').length
  const foundCount = items.filter(i => i.status === 'found').length

  const handleReport = (item: Item) => {
    setItems(prev => [item, ...prev])
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border)',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '6px',
                background: 'var(--color-foreground)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em' }}>Lost & Found</span>
                <span style={{ fontSize: '12px', color: 'var(--color-muted)', marginLeft: '8px', display: 'none' }} className="sm:inline">Westbrook Academy</span>
              </div>
            </div>
            <nav style={{ display: 'flex', gap: '2px' }}>
              {([['browse', 'Browse'], ['report', 'Report']] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                    background: tab === t ? 'var(--color-card)' : 'transparent',
                    color: tab === t ? 'var(--color-foreground)' : 'var(--color-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        {tab === 'browse' ? (
          <>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {([
                ['all', 'All items', items.length, '#1a1a1a', '#f7f7f5'],
                ['lost', 'Lost', lostCount, 'var(--color-lost)', 'var(--color-lost-light)'],
                ['found', 'Found', foundCount, 'var(--color-found)', 'var(--color-found-light)'],
              ] as [BrowseFilter, string, number, string, string][]).map(([f, label, count, color, bg]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: filter === f ? color : 'var(--color-border)',
                    background: filter === f ? bg : '#fff',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: filter === f ? color : 'var(--color-muted)' }}>{label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: filter === f ? color : 'var(--color-card)',
                    color: filter === f ? '#fff' : 'var(--color-muted)',
                    transition: 'all 0.15s',
                  }}>{count}</span>
                </button>
              ))}
            </div>

            {/* Search + Category filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', position: 'relative', minWidth: '180px' }}>
                <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 32px',
                    fontSize: '13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '5px',
                    background: '#fff',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                  placeholder="Search items, locations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#a3a3a3')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    style={{
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.12s',
                      borderColor: category === c ? 'var(--color-foreground)' : 'var(--color-border)',
                      background: category === c ? 'var(--color-foreground)' : '#fff',
                      color: category === c ? '#fff' : 'var(--color-muted)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'} found
              {search && <> matching "{search}"</>}
            </p>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px',
              }}>
                {filtered.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--color-muted)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 14px', opacity: 0.4 }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p style={{ fontSize: '14px', margin: 0 }}>No items match your filters.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('All'); setFilter('all') }}
                  style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Report an item</h1>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', margin: 0, lineHeight: 1.55 }}>
                Submit a report and we'll add it to the board. If there's a match, the contact email you provide will be shared.
              </p>
            </div>
            <ReportForm onSubmit={(item) => { handleReport(item); setTab('browse') }} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>
          Westbrook Academy · Lost & Found · frontdesk@school.edu
        </p>
      </footer>
    </div>
  )
}
