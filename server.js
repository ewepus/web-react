import http from 'http';

const PORT = 3001;

let nextGuestId = 3;
let nextRoomId = 5;

const guests = [
    {
        id: 1,
        firstName: 'Иван',
        lastName: 'Петров',
        email: 'ivan@example.com',
        birthDate: '1985-03-12',
        phone: '+7 900 123-45-67'
    },
    {
        id: 2,
        firstName: 'Мария',
        lastName: 'Сидорова',
        email: 'maria@example.com',
        birthDate: '1992-07-24',
        phone: '+7 911 987-65-43'
    },
];

const rooms = [
    {id: 1, number: 101, price: 3500, area: 22, guestId: 1},
    {id: 2, number: 102, price: 5000, area: 35, guestId: 2},
    {id: 3, number: 201, price: 7500, area: 50, guestId: null},
    {id: 4, number: 202, price: 4200, area: 28, guestId: null},
];

function json(res, status, data) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    });
}

const server = http.createServer(async (req,
                                        res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;

    if (req.method === 'OPTIONS') return json(res, 204, {});

    // Комнаты
    if (p === '/api/rooms' && req.method === 'GET') {
        const enriched = rooms.map((r) => ({
            ...r,
            isBooked: r.guestId !== null,
            guest: r.guestId ? guests.find((g) => g.id === r.guestId) || null : null,
        }));
        return json(res, 200, enriched);
    }

    if (p === '/api/rooms' && req.method === 'POST') {
        const body = await readBody(req);
        const room = {
            id: nextRoomId++,
            number: body.number,
            price: Number(body.price),
            area: Number(body.area),
            guestId: null
        };
        rooms.push(room);
        return json(res, 201, {...room, isBooked: false, guest: null});
    }

    const roomMatch = p.match(/^\/api\/rooms\/(\d+)$/);
    if (roomMatch) {
        const id = Number(roomMatch[1]);
        const idx = rooms.findIndex((r) => r.id === id);
        if (idx === -1) return json(res, 404, {error: 'Room not found'});

        if (req.method === 'DELETE') {
            rooms.splice(idx, 1);
            return json(res, 200, {ok: true});
        }
        if (req.method === 'PUT') {
            const body = await readBody(req);
            rooms[idx] = {...rooms[idx], ...body, id};
            const r = rooms[idx];
            return json(res, 200, {
                ...r,
                isBooked: r.guestId !== null,
                guest: r.guestId ? guests.find((g) => g.id === r.guestId) || null : null
            });
        }
    }

    // Постояльцы
    if (p === '/api/guests' && req.method === 'GET') {
        return json(res, 200, guests);
    }

    if (p === '/api/guests' && req.method === 'POST') {
        const body = await readBody(req);
        const guest = {id: nextGuestId++, ...body};
        guests.push(guest);
        return json(res, 201, guest);
    }

    const guestMatch = p.match(/^\/api\/guests\/(\d+)$/);
    if (guestMatch) {
        const id = Number(guestMatch[1]);
        const idx = guests.findIndex((g) => g.id === id);
        if (idx === -1) return json(res, 404, {error: 'Guest not found'});

        if (req.method === 'DELETE') {
            // unlink from rooms
            rooms.forEach((r) => {
                if (r.guestId === id) r.guestId = null;
            });
            guests.splice(idx, 1);
            return json(res, 200, {ok: true});
        }
        if (req.method === 'PUT') {
            const body = await readBody(req);
            guests[idx] = {...guests[idx], ...body, id};
            return json(res, 200, guests[idx]);
        }
    }

    // Заселение/Выселение
    const checkinMatch = p.match(/^\/api\/rooms\/(\d+)\/checkin$/);
    if (checkinMatch && req.method === 'POST') {
        const roomId = Number(checkinMatch[1]);
        const body = await readBody(req);
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return json(res, 404, {error: 'Room not found'});
        room.guestId = Number(body.guestId);
        const guest = guests.find((g) => g.id === room.guestId) || null;
        return json(res, 200, {...room, isBooked: true, guest});
    }

    const checkoutMatch = p.match(/^\/api\/rooms\/(\d+)\/checkout$/);
    if (checkoutMatch && req.method === 'POST') {
        const roomId = Number(checkoutMatch[1]);
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return json(res, 404, {error: 'Room not found'});
        room.guestId = null;
        return json(res, 200, {...room, isBooked: false, guest: null});
    }

    json(res, 404, {error: 'Not found'});
});

server.listen(PORT, () => console.log(`Hotel API running on http://localhost:${PORT}`));
