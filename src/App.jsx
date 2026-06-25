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

// Заселение
function CheckInModal({room, guests, onClose, onCheckin, onCreateGuest}) {
    const [mode, setMode] = useState('select')
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
                <div style={{display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap'}}>
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
                        <select value={selectedGuestId} onChange={e =>
                            setSelectedGuestId(e.target.value)}>
                            <option value="">— выберите —</option>
                            {guests.map(g => <option key={g.id} value={g.id}>{g.lastName} {g.firstName}</option>)}
                        </select>
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {[['firstName', 'Имя'], ['lastName', 'Фамилия'], ['email', 'Email'],
                            ['birthDate', 'Дата рождения', 'date'], ['phone', 'Телефон']]
                            .map(([key, label, type = 'text']) => (
                                <div className="form-group" key={key}>
                                    <label>{label}</label>
                                    <input type={type} value={form[key]}
                                           onChange={e =>
                                               setForm(f => ({...f, [key]: e.target.value}))}/>
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

// Редактирование комнаты
function EditRoomModal({room, onClose, onSave}) {
    const [form, setForm] = useState({number: room.number, price: room.price, area: room.area})
    const [err, setErr] = useState('')

    async function handleSave() {
        if (!form.number || !form.price || !form.area) {
            setErr('Заполните все поля');
            return
        }
        setErr('')
        const res = await fetch(`${API}/rooms/${room.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({number: Number(form.number), price: Number(form.price), area: Number(form.area)})
        })
        const updated = await res.json()
        onSave(updated)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Редактировать комнату №{room.number}</h3>
                {[['number', 'Номер комнаты', 'number'], ['price', 'Цена (₽/ночь)', 'number'],
                    ['area', 'Площадь (м²)', 'number']].map(([key, label, type]) => (
                    <div className="form-group" key={key} style={{marginBottom: 8}}>
                        <label>{label}</label>
                        <input type={type} value={form[key]}
                               onChange={e =>
                                   setForm(f => ({...f, [key]: e.target.value}))}/>
                    </div>
                ))}
                {err && <div style={{color: 'var(--red)', fontSize: 13, marginBottom: 8}}>{err}</div>}
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

// Редактирование постояльца
function EditGuestModal({guest, onClose, onSave}) {
    const [form, setForm] = useState({
        firstName: guest.firstName || '',
        lastName: guest.lastName || '',
        email: guest.email || '',
        birthDate: guest.birthDate || '',
        phone: guest.phone || ''
    })
    const [err, setErr] = useState('')

    async function handleSave() {
        if (!form.firstName || !form.lastName) {
            setErr('Заполните имя и фамилию');
            return
        }
        setErr('')
        const res = await fetch(`${API}/guests/${guest.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        })
        const updated = await res.json()
        onSave(updated)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Редактировать постояльца</h3>
                {[['firstName', 'Имя'], ['lastName', 'Фамилия'], ['email', 'Email'],
                    ['birthDate', 'Дата рождения', 'date'], ['phone', 'Телефон']]
                    .map(([key, label, type = 'text']) => (
                        <div className="form-group" key={key} style={{marginBottom: 8}}>
                            <label>{label}</label>
                            <input type={type} value={form[key]}
                                   onChange={e =>
                                       setForm(f => ({...f, [key]: e.target.value}))}/>
                        </div>
                    ))}
                {err && <div style={{color: 'var(--red)', fontSize: 13, marginBottom: 8}}>{err}</div>}
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

// Карточка постояльца
function GuestCard({guest, occupiedRoomNumber, onDelete, onEdit}) {
    return (
        <div className="guest-card">
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap'}}>
                <span className="guest-card-name">{guest.lastName} {guest.firstName}</span>
                {occupiedRoomNumber
                    ? <span className="badge badge-booked">Комната №{occupiedRoomNumber}</span>
                    : <span className="badge badge-free">Без комнаты</span>
                }
            </div>
            <div className="guest-card-meta">
                {guest.email && <span>Почта: {guest.email}</span>}
                {guest.phone && <span>Номер телефона: {guest.phone}</span>}
                {guest.birthDate && <span>Дата рождения: {formatDate(guest.birthDate)}</span>}
            </div>
            <div className="room-actions">
                <button className="btn btn-edit btn-sm" onClick={() => onEdit(guest)}>Редактировать</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(guest.id)}>Удалить</button>
            </div>
        </div>
    )
}

// Карточка комнаты
function RoomCard({room, onDelete, onArchive, onCheckin, onCheckout, onEdit}) {
    return (
        <div className={`room-card ${room.isBooked ? 'booked' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap'}}>
                <span className="room-number">Комната №{room.number}</span>
                <span className={`badge ${room.isBooked ? 'badge-booked' : 'badge-free'}`}>
                    {room.isBooked ? 'Занята' : 'Свободна'}
                </span>
            </div>
            <div className="room-meta">
                <span>Стоимость: {room.price.toLocaleString('ru')} ₽/ночь</span>
                <span>Площадь: {room.area} м²</span>
            </div>
            {room.guest && (
                <div className="guest-info">
                    <strong>{room.guest.lastName} {room.guest.firstName}</strong><br/>
                    Почта: {room.guest.email}<br/>
                    Номер телефона: {formatPhone(room.guest.phone)}<br/>
                    Дата рождения: {formatDate(room.guest.birthDate)}
                </div>
            )}
            <div className="room-actions">
                {room.isBooked
                    ? <button className="btn btn-archive btn-sm" onClick={() => onCheckout(room.id)}>Выселить</button>
                    : <button className="btn btn-checkin btn-sm" onClick={() => onCheckin(room)}>Заселить</button>
                }
                <button className="btn btn-edit btn-sm" onClick={() => onEdit(room)}>Редактировать</button>
                <button className="btn btn-archive btn-sm" onClick={() => onArchive(room)}>Архив</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(room.id)}>Удалить</button>
            </div>
        </div>
    )
}

// Форма создания комнаты
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
            body: JSON.stringify(form)
        })
        const room = await res.json()
        onCreated(room)
        setForm({number: '', price: '', area: ''})
    }

    return (
        <div className="section">
            <div className="section-title">Добавить комнату</div>
            <div className="form-body">
                {[['number', 'Номер комнаты', 'number'], ['price', 'Цена (₽/ночь)', 'number'],
                    ['area', 'Площадь (м²)', 'number']].map(([key, label, type]) => (
                    <div className="form-group" key={key}>
                        <label>{label}</label>
                        <input type={type} value={form[key]}
                               onChange={e =>
                                   setForm(f => ({...f, [key]: e.target.value}))} placeholder={label}/>
                    </div>
                ))}
                {err && <div style={{color: 'var(--red)', fontSize: 13}}>{err}</div>}
                <button className="btn btn-primary" onClick={handle}>Создать</button>
            </div>
        </div>
    )
}

// Форма создания постояльца
function CreateGuestForm({onCreated}) {
    const [form, setForm] = useState({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})
    const [err, setErr] = useState('')

    async function handle() {
        if (!form.firstName || !form.lastName) {
            setErr('Заполните имя и фамилию');
            return
        }
        setErr('')
        const res = await fetch(`${API}/guests`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        })
        const guest = await res.json()
        onCreated(guest)
        setForm({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})
    }

    return (
        <div className="section">
            <div className="section-title">Добавить постояльца</div>
            <div className="form-body">
                {[['firstName', 'Имя'], ['lastName', 'Фамилия'], ['email', 'Email'],
                    ['birthDate', 'Дата рождения', 'date'], ['phone', 'Телефон']]
                    .map(([key, label, type = 'text']) => (
                        <div className="form-group" key={key}>
                            <label>{label}</label>
                            <input type={type} value={form[key]}
                                   onChange={e =>
                                       setForm(f => ({...f, [key]: e.target.value}))} placeholder={label}/>
                        </div>
                    ))}
                {err && <div style={{color: 'var(--red)', fontSize: 13}}>{err}</div>}
                <button className="btn btn-primary" onClick={handle}>Создать</button>
            </div>
        </div>
    )
}

export default function App() {
    const [tab, setTab] = useState('rooms') // 'rooms' | 'guests'
    const [rooms, setRooms] = useState([])
    const [guests, setGuests] = useState([])
    const [archive, setArchive] = useState([])
    const [checkinRoom, setCheckinRoom] = useState(null)
    const [editRoom, setEditRoom] = useState(null)
    const [editGuest, setEditGuest] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/rooms`).then(r => r.json()),
            fetch(`${API}/guests`).then(r => r.json()),
        ]).then(([r, g]) => {
            setRooms(r);
            setGuests(g);
            setLoading(false)
        })
    }, [])

    async function handleDeleteRoom(id) {
        await fetch(`${API}/rooms/${id}`, {method: 'DELETE'})
        setRooms(rs => rs.filter(r => r.id !== id))
    }

    async function handleDeleteGuest(id) {
        await fetch(`${API}/guests/${id}`, {method: 'DELETE'})
        setGuests(gs => gs.filter(g => g.id !== id))
        setRooms(rs => rs.map(r => r.guest?.id === id ? {...r, isBooked: false, guest: null, guestId: null} : r))
    }

    function handleArchive(room) {
        setArchive(a => [...a, room])
        setRooms(rs => rs.filter(r => r.id !== room.id))
    }

    async function handleCheckin(roomId, guestId) {
        const res = await fetch(`${API}/rooms/${roomId}/checkin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({guestId})
        })
        const updated = await res.json()
        setRooms(rs => rs.map(r => r.id === roomId ? updated : r))
        setCheckinRoom(null)
    }

    async function handleCreateGuestAndCheckin(guestData, roomId) {
        const res = await fetch(`${API}/guests`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(guestData)
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

    function handleRoomSaved(updated) {
        setRooms(rs => rs.map(r => r.id === updated.id ? {...r, ...updated} : r))
        setEditRoom(null)
    }

    function handleGuestSaved(updated) {
        setGuests(gs => gs.map(g => g.id === updated.id ? updated : g))
        setEditGuest(null)
    }

    const occupiedMap = {}
    rooms.forEach(r => {
        if (r.guest) occupiedMap[r.guest.id] = r.number
    })

    return (
        <>
            <header className="header">Управление отелем</header>

            <nav className="tab-nav">
                <button className={`tab-btn ${tab === 'rooms' ? 'active' : ''}`} onClick={() => setTab('rooms')}>🛏
                    Комнаты
                </button>
                <button className={`tab-btn ${tab === 'guests' ? 'active' : ''}`} onClick={() => setTab('guests')}>👤
                    Постояльцы
                </button>
            </nav>

            <div className="layout">
                {/* LEFT: main list */}
                {tab === 'rooms' ? (
                    <div className="section rooms-section">
                        <div className="section-title">Комнаты</div>
                        <div className="rooms-list">
                            {loading && <div className="empty-state">Загрузка...</div>}
                            {!loading && rooms.length === 0 &&
                                <div className="empty-state">Нет комнат. Добавьте первую.</div>}
                            {rooms.map(room => (
                                <RoomCard key={room.id} room={room}
                                          onDelete={handleDeleteRoom}
                                          onArchive={handleArchive}
                                          onCheckin={setCheckinRoom}
                                          onCheckout={handleCheckout}
                                          onEdit={setEditRoom}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="section rooms-section">
                        <div className="section-title">Постояльцы</div>
                        <div className="guests-list">
                            {loading && <div className="empty-state">Загрузка...</div>}
                            {!loading && guests.length === 0 && <div className="empty-state">Нет постояльцев.</div>}
                            {guests.map(g => (
                                <GuestCard key={g.id} guest={g}
                                           occupiedRoomNumber={occupiedMap[g.id]}
                                           onDelete={handleDeleteGuest}
                                           onEdit={setEditGuest}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    {tab === 'rooms' ? (
                        <>
                            <CreateRoomForm onCreated={r => setRooms(rs => [...rs, r])}/>
                            <div className="section">
                                <div className="section-title">Архив</div>
                                <div className="archive-list">
                                    {archive.length === 0
                                        ? <div className="empty-state" style={{padding: '10px 0'}}>Архив пуст</div>
                                        : <ul>{archive.map((r, i) => (
                                            <li key={i}>Комната
                                                №{r.number} — {r.price.toLocaleString('ru')} ₽/ночь, {r.area} м²
                                                {r.guest && ` (${r.guest.lastName} ${r.guest.firstName})`}
                                            </li>
                                        ))}</ul>
                                    }
                                </div>
                            </div>
                        </>
                    ) : (
                        <CreateGuestForm onCreated={g => setGuests(gs => [...gs, g])}/>
                    )}
                </div>
            </div>

            {checkinRoom && (
                <CheckInModal room={checkinRoom} guests={guests} onClose={() => setCheckinRoom(null)}
                              onCheckin={handleCheckin} onCreateGuest={handleCreateGuestAndCheckin}/>
            )}
            {editRoom && (
                <EditRoomModal room={editRoom} onClose={() => setEditRoom(null)} onSave={handleRoomSaved}/>
            )}
            {editGuest && (
                <EditGuestModal guest={editGuest} onClose={() => setEditGuest(null)} onSave={handleGuestSaved}/>
            )}
        </>
    )
}
