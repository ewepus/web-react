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

function validateWandFields(form, setErr) {
    if (!form.number || form.maxMana === '' || form.manaRecoverySpeed === '' || form.capacity === '') {
        setErr('Заполните все поля');
        return false
    }
    if (Number(form.number) <= 0) {
        setErr('Номер жезла должен быть больше 0');
        return false
    }
    if (Number(form.maxMana) <= 0) {
        setErr('Максимальная мана должна быть больше 0');
        return false
    }
    if (Number(form.manaRecoverySpeed) <= 0) {
        setErr('Скорость восстановления маны должна быть больше 0');
        return false
    }
    const capacity = Number(form.capacity)
    if (capacity < 0 || capacity > 999) {
        setErr('Вместимость должна быть от 0 до 999');
        return false
    }
    return true
}

const WAND_FIELDS = [
    ['number', 'Номер жезла', 'number', {min: 1}],
    ['maxMana', 'Максимальная мана', 'number', {min: 1}],
    ['manaRecoverySpeed', 'Скорость восстановления маны', 'number', {min: 1}],
    ['capacity', 'Вместимость', 'number', {min: 0, max: 999}],
]

function WandFieldInputs({form, setForm}) {
    return WAND_FIELDS.map(([key, label, type, attrs = {}]) => (
        <div className="form-group" key={key} style={{marginBottom: 8}}>
            <label>{label}</label>
            <input type={type} value={form[key]}
                   min={attrs.min}
                   max={attrs.max}
                   onChange={e => setForm(f => ({...f, [key]: e.target.value}))}/>
        </div>
    ))
}

function AssignWizardModal({wand, wizards, onClose, onAssign, onCreateWizard}) {
    const [mode, setMode] = useState('select')
    const [selectedWizardId, setSelectedWizardId] = useState('')
    const [form, setForm] = useState({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})

    function handleSubmit() {
        if (mode === 'select') {
            if (!selectedWizardId) return
            onAssign(wand.id, Number(selectedWizardId))
        } else {
            if (!form.firstName || !form.lastName) return
            onCreateWizard(form, wand.id)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Назначение — Жезл №{wand.number}</h3>
                <div style={{display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap'}}>
                    <button className={`btn ${mode === 'select' ? 'btn-primary' : 'btn-archive'} btn-sm`}
                            onClick={() => setMode('select')}>Выбрать волшебника
                    </button>
                    <button className={`btn ${mode === 'new' ? 'btn-primary' : 'btn-archive'} btn-sm`}
                            onClick={() => setMode('new')}>Новый волшебник
                    </button>
                </div>
                {mode === 'select' ? (
                    <div className="form-group">
                        <label>Волшебник</label>
                        <select value={selectedWizardId} onChange={e =>
                            setSelectedWizardId(e.target.value)}>
                            <option value="">— выберите —</option>
                            {wizards.map(w => <option key={w.id} value={w.id}>{w.lastName} {w.firstName}</option>)}
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
                    <button className="btn btn-primary" onClick={handleSubmit}>Арендовать</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

function EditWandModal({wand, onClose, onSave}) {
    const [form, setForm] = useState({
        number: wand.number,
        maxMana: wand.maxMana,
        manaRecoverySpeed: wand.manaRecoverySpeed,
        capacity: wand.capacity,
    })
    const [err, setErr] = useState('')

    async function handleSave() {
        if (!validateWandFields(form, setErr)) return
        if (!validateWandFields(form, setErr)) return
        setErr('')
        const res = await fetch(`${API}/wands/${wand.id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                number: Number(form.number),
                maxMana: Number(form.maxMana),
                manaRecoverySpeed: Number(form.manaRecoverySpeed),
                capacity: Number(form.capacity),
            })
        })
        const updated = await res.json()
        onSave(updated)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Редактировать жезл №{wand.number}</h3>
                <WandFieldInputs form={form} setForm={setForm}/>
                {err && <div style={{color: 'var(--purple-dark)', fontSize: 13, marginBottom: 8}}>{err}</div>}
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

function EditWizardModal({wizard, onClose, onSave}) {
    const [form, setForm] = useState({
        firstName: wizard.firstName || '',
        lastName: wizard.lastName || '',
        email: wizard.email || '',
        birthDate: wizard.birthDate || '',
        phone: wizard.phone || ''
    })
    const [err, setErr] = useState('')

    async function handleSave() {
        if (!form.firstName || !form.lastName) {
            setErr('Заполните имя и фамилию');
            return
        }
        setErr('')
        const res = await fetch(`${API}/wizards/${wizard.id}`, {
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
                <h3>Редактировать волшебника</h3>
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
                {err && <div style={{color: 'var(--purple-dark)', fontSize: 13, marginBottom: 8}}>{err}</div>}
                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    <button className="btn btn-archive" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    )
}

function WizardCard({wizard, occupiedWandNumber, onDelete, onEdit}) {
    return (
        <div className="wizard-card">
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap'}}>
                <span className="wizard-card-name">{wizard.lastName} {wizard.firstName}</span>
                {occupiedWandNumber
                    ? <span className="badge badge-assigned">Жезл №{occupiedWandNumber}</span>
                    : <span className="badge badge-free">Без жезла</span>
                }
            </div>
            <div className="wizard-card-meta">
                {wizard.email && (
                    <div className="info-pill info-pill-email">
                        <span className="info-pill-label">Почта</span>
                        <span className="info-pill-value">{wizard.email}</span>
                    </div>
                )}
                {wizard.phone && (
                    <div className="info-pill info-pill-phone">
                        <span className="info-pill-label">Телефон</span>
                        <span className="info-pill-value">{wizard.phone}</span>
                    </div>
                )}
                {wizard.birthDate && (
                    <div className="info-pill info-pill-date">
                        <span className="info-pill-label">Дата рождения</span>
                        <span className="info-pill-value">{formatDate(wizard.birthDate)}</span>
                    </div>
                )}
            </div>
            <div className="wand-actions">
                <button className="btn btn-edit btn-sm" onClick={() => onEdit(wizard)}>Редактировать</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(wizard.id)}>Удалить</button>
            </div>
        </div>
    )
}

function WandCard({wand, onDelete, onArchive, onAssign, onUnassign, onEdit}) {
    return (
        <div className={`wand-card ${wand.isAssigned ? 'assigned' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap'}}>
                <span className="wand-number">Жезл №{wand.number}</span>
                <span className={`badge ${wand.isAssigned ? 'badge-assigned' : 'badge-free'}`}>
                    {wand.isAssigned ? 'Занят' : 'Свободен'}
                </span>
            </div>
            <div className="wand-meta">
                <span>Макс. мана: {wand.maxMana.toLocaleString('ru')}</span>
                <span>Скор. восстановления: {wand.manaRecoverySpeed}</span>
                <span>Вместимость: {wand.capacity}</span>
            </div>
            {wand.wizard && (
                <div className="wizard-info">
                    <strong>{wand.wizard.lastName} {wand.wizard.firstName}</strong>
                    <div style={{marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4}}>
                        {wand.wizard.email && (
                            <div className="info-pill info-pill-email">
                                <span className="info-pill-label">Почта</span>
                                <span className="info-pill-value">{wand.wizard.email}</span>
                            </div>
                        )}
                        {wand.wizard.phone && (
                            <div className="info-pill info-pill-phone">
                                <span className="info-pill-label">Телефон</span>
                                <span className="info-pill-value">{formatPhone(wand.wizard.phone)}</span>
                            </div>
                        )}
                        {wand.wizard.birthDate && (
                            <div className="info-pill info-pill-date">
                                <span className="info-pill-label">Дата рождения</span>
                                <span className="info-pill-value">{formatDate(wand.wizard.birthDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="wand-actions">
                {wand.isAssigned
                    ? <button className="btn btn-archive btn-sm" onClick={() => onUnassign(wand.id)}>Снять</button>
                    : <button className="btn btn-assign btn-sm" onClick={() => onAssign(wand)}>Арендовать</button>
                }
                <button className="btn btn-edit btn-sm" onClick={() => onEdit(wand)}>Редактировать</button>
                <button className="btn btn-archive btn-sm" onClick={() => onArchive(wand)}>Архив</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(wand.id)}>Удалить</button>
            </div>
        </div>
    )
}

function CreateWandForm({onCreated}) {
    const [form, setForm] = useState({number: '', maxMana: '', manaRecoverySpeed: '', capacity: ''})
    const [err, setErr] = useState('')

    async function handle() {
        if (!validateWandFields(form, setErr)) return
        setErr('')
        const res = await fetch(`${API}/wands`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        })
        const wand = await res.json()
        onCreated(wand)
        setForm({number: '', maxMana: '', manaRecoverySpeed: '', capacity: ''})
    }

    return (
        <div className="section">
            <div className="section-title">Добавить жезл</div>
            <div className="form-body">
                {WAND_FIELDS.map(([key, label, type, attrs = {}]) => (
                    <div className="form-group" key={key}>
                        <label>{label}</label>
                        <input type={type} value={form[key]}
                               min={attrs.min}
                               max={attrs.max}
                               onChange={e =>
                                   setForm(f => ({...f, [key]: e.target.value}))} placeholder={label}/>
                    </div>
                ))}
                {err && <div style={{color: 'var(--purple-dark)', fontSize: 13}}>{err}</div>}
                <button className="btn btn-primary" onClick={handle}>Создать</button>
            </div>
        </div>
    )
}

function CreateWizardForm({onCreated}) {
    const [form, setForm] = useState({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})
    const [err, setErr] = useState('')

    async function handle() {
        if (!form.firstName || !form.lastName) {
            setErr('Заполните имя и фамилию');
            return
        }
        setErr('')
        const res = await fetch(`${API}/wizards`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(form)
        })
        const wizard = await res.json()
        onCreated(wizard)
        setForm({firstName: '', lastName: '', email: '', birthDate: '', phone: ''})
    }

    return (
        <div className="section">
            <div className="section-title">Добавить волшебника</div>
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
                {err && <div style={{color: 'var(--purple-dark)', fontSize: 13}}>{err}</div>}
                <button className="btn btn-primary" onClick={handle}>Создать</button>
            </div>
        </div>
    )
}

export default function App() {
    const [tab, setTab] = useState('wands')
    const [wands, setWands] = useState([])
    const [wizards, setWizards] = useState([])
    const [archive, setArchive] = useState([])
    const [assignWand, setAssignWand] = useState(null)
    const [editWand, setEditWand] = useState(null)
    const [editWizard, setEditWizard] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/wands`).then(r => r.json()),
            fetch(`${API}/wizards`).then(r => r.json()),
        ]).then(([w, wiz]) => {
            setWands(w);
            setWizards(wiz);
            setLoading(false)
        })
    }, [])

    async function handleDeleteWand(id) {
        await fetch(`${API}/wands/${id}`, {method: 'DELETE'})
        setWands(ws => ws.filter(w => w.id !== id))
    }

    async function handleDeleteWizard(id) {
        await fetch(`${API}/wizards/${id}`, {method: 'DELETE'})
        setWizards(wiz => wiz.filter(w => w.id !== id))
        setWands(ws => ws.map(w => w.wizard?.id === id ? {...w, isAssigned: false, wizard: null, wizardId: null} : w))
    }

    function handleArchive(wand) {
        setArchive(a => [...a, wand])
        setWands(ws => ws.filter(w => w.id !== wand.id))
    }

    async function handleAssign(wandId, wizardId) {
        const res = await fetch(`${API}/wands/${wandId}/assign`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({wizardId})
        })
        const updated = await res.json()
        setWands(ws => ws.map(w => w.id === wandId ? updated : w))
        setAssignWand(null)
    }

    async function handleCreateWizardAndAssign(wizardData, wandId) {
        const res = await fetch(`${API}/wizards`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(wizardData)
        })
        const wizard = await res.json()
        setWizards(wiz => [...wiz, wizard])
        await handleAssign(wandId, wizard.id)
    }

    async function handleUnassign(wandId) {
        const res = await fetch(`${API}/wands/${wandId}/unassign`, {method: 'POST'})
        const updated = await res.json()
        setWands(ws => ws.map(w => w.id === wandId ? updated : w))
    }

    function handleWandSaved(updated) {
        setWands(ws => ws.map(w => w.id === updated.id ? {...w, ...updated} : w))
        setEditWand(null)
    }

    function handleWizardSaved(updated) {
        setWizards(wiz => wiz.map(w => w.id === updated.id ? updated : w))
        setEditWizard(null)
    }

    const occupiedMap = {}
    wands.forEach(w => {
        if (w.wizard) occupiedMap[w.wizard.id] = w.number
    })

    return (
        <>
            <header className="header">Аренда волшебных жезлов</header>

            <nav className="tab-nav">
                <button className={`tab-btn ${tab === 'wands' ? 'active' : ''}`} onClick={() => setTab('wands')}>🪄
                    Жезлы
                </button>
                <button className={`tab-btn ${tab === 'wizards' ? 'active' : ''}`} onClick={() => setTab('wizards')}>🧙
                    Волшебники
                </button>
            </nav>

            <div className="layout">
                {tab === 'wands' ? (
                    <div className="section wands-section">
                        <div className="section-title">Жезлы</div>
                        <div className="wands-list">
                            {loading && <div className="empty-state">Загрузка...</div>}
                            {!loading && wands.length === 0 &&
                                <div className="empty-state">Нет жезлов. Добавьте первый.</div>}
                            {wands.map(wand => (
                                <WandCard key={wand.id} wand={wand}
                                          onDelete={handleDeleteWand}
                                          onArchive={handleArchive}
                                          onAssign={setAssignWand}
                                          onUnassign={handleUnassign}
                                          onEdit={setEditWand}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="section wands-section">
                        <div className="section-title">Волшебники</div>
                        <div className="wizards-list">
                            {loading && <div className="empty-state">Загрузка...</div>}
                            {!loading && wizards.length === 0 && <div className="empty-state">Нет волшебников.</div>}
                            {wizards.map(w => (
                                <WizardCard key={w.id} wizard={w}
                                           occupiedWandNumber={occupiedMap[w.id]}
                                           onDelete={handleDeleteWizard}
                                           onEdit={setEditWizard}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="right-panel">
                    {tab === 'wands' ? (
                        <>
                            <CreateWandForm onCreated={w => setWands(ws => [...ws, w])}/>
                            <div className="section">
                                <div className="section-title">Архив</div>
                                <div className="archive-list">
                                    {archive.length === 0
                                        ? <div className="empty-state" style={{padding: '10px 0'}}>Архив пуст</div>
                                        : <ul>{archive.map((w, i) => (
                                            <li key={i}>Жезл
                                                №{w.number} — мана {w.maxMana.toLocaleString('ru')}, скор. {w.manaRecoverySpeed}, вместимость {w.capacity}
                                                {w.wizard && ` (${w.wizard.lastName} ${w.wizard.firstName})`}
                                            </li>
                                        ))}</ul>
                                    }
                                </div>
                            </div>
                        </>
                    ) : (
                        <CreateWizardForm onCreated={w => setWizards(wiz => [...wiz, w])}/>
                    )}
                </div>
            </div>

            {assignWand && (
                <AssignWizardModal wand={assignWand} wizards={wizards} onClose={() => setAssignWand(null)}
                              onAssign={handleAssign} onCreateWizard={handleCreateWizardAndAssign}/>
            )}
            {editWand && (
                <EditWandModal wand={editWand} onClose={() => setEditWand(null)} onSave={handleWandSaved}/>
            )}
            {editWizard && (
                <EditWizardModal wizard={editWizard} onClose={() => setEditWizard(null)} onSave={handleWizardSaved}/>
            )}
        </>
    )
}
