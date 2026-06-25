import {useState, useEffect} from 'react'

const API = '/api'

function formatPhone(p) {
    return p || '—'
}

function formatDate(d) {
    if (!d) return '—'
    const [y, m, day] = d.split('-')
    return `${day}.${m}.${y}`
}

// ── CheckIn Modal ──────────────────────────────────────────────────────────
function CheckInModal({room, guests, onClose, onCheckin, onCreateGuest}) {
    const [mode, setMode] = useState('select') // 'select' | 'new'
    const [selectedGuestId, setSelectedGuestId] = useState('')
    const [form, setForm] = useState({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})

    function handleSubmit() {
        if (mode === 'select') {
            if (!selectedGuestId) return
            onCheckin(room.id, Number(selectedGuestId))
        } else {
            if (!form.firstName || !form.lastName) return
            onCreateGuest(form, room.id)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Заселение — Комната №{room.number}</h3>

                <div style={{display: 'flex', gap: 10, marginBottom: 14}}>
                    <button className={`btn ${mode === 'select' ? 'btn-primary' : 'btn-archive'} btn-sm`}
                            onClick={() => setMode('select')}>Выбрать постояльца
                    </button>
                    <button className={`btn ${mode === 'new' ? 'btn-primary' : 'btn-archive'} btn-sm`}
                            onClick={() => setMode('new')}>Новый постоялец
                    </button>
                </div>

                {mode === 'select' ? (
                    <div className="form-group">
                        <label>Постоялец</label>
                        <select value={selectedGuestId} onChange={e => setSelectedGuestId(e.target.value)}>
                            <option value="">— выберите —</option>
                            {guests.map(g => (
                                <option key={g.id} value={g.id}>{g.lastName} {g.firstName}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {[
                            ['firstName', 'Имя'],
                            ['lastName', 'Фамилия'],
                            ['email', 'Email'],
                            ['birthDate', 'Дата рождения', 'date'],
                            ['phone', 'Телефон'],
                        ].map(([key, label, type = 'text']) => (
                            <div className="form-group" key={key}>
                                <label>{label}</label>
                                <input type={type} value={form[key]}
                                       onChange={e => setForm(f => ({...f, [key]: e.target.value}))}/>
                            </div>
                        ))}
                    </div>
                )}

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSubmit}>Заселить</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

// ── RoomCard ───────────────────────────────────────────────────────────────
function RoomCard({room, onDelete, onArchive, onCheckin, onCheckout}) {
    return (
        <div className={`room-card ${room.isBooked ? 'booked' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
                <span className="room-number">Комната №{room.number}</span>
                <span className={`badge ${room.isBooked ? 'badge-booked' : 'badge-free'}`}>
          {room.isBooked ? 'Занята' : 'Свободна'}
        </span>
            </div>

            <div className="room-meta">
                <span>💰 {room.price.toLocaleString('ru')} ₽/ночь</span>
                <span>📐 {room.area} м²</span>
            </div>

            {room.guest && (
                <div className="guest-info">
                    <strong>{room.guest.lastName} {room.guest.firstName}</strong><br/>
                    📧 {room.guest.email}<br/>
                    📞 {formatPhone(room.guest.phone)}<br/>
                    🎂 {formatDate(room.guest.birthDate)}
                </div>
            )}

            <div className="room-actions">
                {room.isBooked
                    ? <button className="btn btn-archive btn-sm" onClick={() => onCheckout(room.id)}>Выселить</button>
                    : <button className="btn btn-checkin btn-sm" onClick={() => onCheckin(room)}>Заселить</button>
                }
                <button className="btn btn-archive btn-sm" onClick={() => onArchive(room)}>Архив</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(room.id)}>Удалить</button>
            </div>
        </div>
    )
}

// ── CreateRoomForm ─────────────────────────────────────────────────────────
function CreateRoomForm({onCreated}) {
    const [form, setForm] = useState({number: '', price: '', area: ''})
    const [err, setErr] = useState('')

    async function handle() {
        if (!form.number || !form.price || !form.area) {
            setErr('Заполните все поля');
            return
        }
        setErr('')
        const res = await fetch(`${API}/rooms`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form),
        })
        const room = await res.json()
        onCreated(room)
        setForm({number: '', price: '', area: ''})
    }

    return (
        <div className="section form-section">
            <div className="section-title">Добавить комнату</div>
            <div className="form-body">
                {[
                    ['number', 'Номер комнаты', 'number'],
                    ['price', 'Цена (₽/ночь)', 'number'],
                    ['area', 'Площадь (м²)', 'number'],
                ].map(([key, label, type]) => (
                    <div className="form-group" key={key}>
                        <label>{label}</label>
                        <input
                            type={type}
                            value={form[key]}
                            onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                            placeholder={label}
                        />
                    </div>
                ))}
                {err && <div style={{color: 'var(--red)', fontSize: 13}}>{err}</div>}
                <button className="btn btn-primary" onClick={handle}>Создать</button>
            </div>
        </div>
    )
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
    const [rooms, setRooms] = useState([])
    const [guests, setGuests] = useState([])
    const [archive, setArchive] = useState([])
    const [checkinRoom, setCheckinRoom] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/rooms`).then(r => r.json()),
            fetch(`${API}/guests`).then(r => r.json()),
        ]).then(([r, g]) => {
            setRooms(r)
            setGuests(g)
            setLoading(false)
        })
    }, [])

    async function handleDelete(id) {
        await fetch(`${API}/rooms/${id}`, {method: 'DELETE'})
        setRooms(rs => rs.filter(r => r.id !== id))
    }

    function handleArchive(room) {
        setArchive(a => [...a, room])
        setRooms(rs => rs.filter(r => r.id !== room.id))
    }

    async function handleCheckin(roomId, guestId) {
        const res = await fetch(`${API}/rooms/${roomId}/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({guestId}),
        })
        const updated = await res.json()
        setRooms(rs => rs.map(r => r.id === roomId ? updated : r))
        setCheckinRoom(null)
    }

    async function handleCreateGuestAndCheckin(guestData, roomId) {
        const res = await fetch(`${API}/guests`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(guestData),
        })
        const guest = await res.json()
        setGuests(gs => [...gs, guest])
        await handleCheckin(roomId, guest.id)
    }

    async function handleCheckout(roomId) {
        const res = await fetch(`${API}/rooms/${roomId}/checkout`, {method: 'POST'})
        const updated = await res.json()
        setRooms(rs => rs.map(r => r.id === roomId ? updated : r))
    }

    function handleCreated(room) {
        setRooms(rs => [...rs, room])
    }

    return (
        <>
            <header className="header">🏨 Управление отелем</header>

            <div className="layout">
                {/* LEFT: rooms list */}
                <div className="section rooms-section">
                    <div className="section-title">Комнаты</div>
                    <div className="rooms-list">
                        {loading && <div className="empty-state">Загрузка...</div>}
                        {!loading && rooms.length === 0 && (
                            <div className="empty-state">Нет комнат. Добавьте первую.</div>
                        )}
                        {rooms.map(room => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onDelete={handleDelete}
                                onArchive={handleArchive}
                                onCheckin={setCheckinRoom}
                                onCheckout={handleCheckout}
                            />
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    <CreateRoomForm onCreated={handleCreated}/>

                    <div className="section archive-section">
                        <div className="section-title">Архив</div>
                        <div className="archive-list">
                            {archive.length === 0
                                ? <div className="empty-state" style={{padding: '10px 0'}}>Архив пуст</div>
                                : (
                                    <ul>
                                        {archive.map((r, i) => (
                                            <li key={i}>
                                                Комната №{r.number} — {r.price.toLocaleString('ru')} ₽/ночь, {r.area} м²
                                                {r.guest && ` (постоялец: ${r.guest.lastName} ${r.guest.firstName})`}
                                            </li>
                                        ))}
                                    </ul>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>

            {checkinRoom && (
                <CheckInModal
                    room={checkinRoom}
                    guests={guests}
                    onClose={() => setCheckinRoom(null)}
                    onCheckin={handleCheckin}
                    onCreateGuest={handleCreateGuestAndCheckin}
                />
            )}
        </>
    )
}
