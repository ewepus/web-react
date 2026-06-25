import http from 'http';

const PORT = 3001;

let nextWizardId = 3;
let nextWandId = 5;

const wizards = [
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

const wands = [
    {id: 1, number: 101, maxMana: 3500, manaRecoverySpeed: 22, capacity: 100, wizardId: 1},
    {id: 2, number: 102, maxMana: 5000, manaRecoverySpeed: 35, capacity: 250, wizardId: 2},
    {id: 3, number: 201, maxMana: 7500, manaRecoverySpeed: 50, capacity: 500, wizardId: null},
    {id: 4, number: 202, maxMana: 4200, manaRecoverySpeed: 28, capacity: 150, wizardId: null},
];

function enrichWand(w) {
    return {
        ...w,
        isAssigned: w.wizardId !== null,
        wizard: w.wizardId ? wizards.find((wiz) => wiz.id === w.wizardId) || null : null,
    };
}

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

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;

    if (req.method === 'OPTIONS') return json(res, 204, {});

    // Жезлы
    if (p === '/api/wands' && req.method === 'GET') {
        return json(res, 200, wands.map(enrichWand));
    }

    if (p === '/api/wands' && req.method === 'POST') {
        const body = await readBody(req);
        const wand = {
            id: nextWandId++,
            number: body.number,
            maxMana: Number(body.maxMana),
            manaRecoverySpeed: Number(body.manaRecoverySpeed),
            capacity: Number(body.capacity),
            wizardId: null
        };
        wands.push(wand);
        return json(res, 201, enrichWand(wand));
    }

    const wandMatch = p.match(/^\/api\/wands\/(\d+)$/);
    if (wandMatch) {
        const id = Number(wandMatch[1]);
        const idx = wands.findIndex((w) => w.id === id);
        if (idx === -1) return json(res, 404, {error: 'Wand not found'});

        if (req.method === 'DELETE') {
            wands.splice(idx, 1);
            return json(res, 200, {ok: true});
        }
        if (req.method === 'PUT') {
            const body = await readBody(req);
            wands[idx] = {...wands[idx], ...body, id};
            return json(res, 200, enrichWand(wands[idx]));
        }
    }

    // Волшебники
    if (p === '/api/wizards' && req.method === 'GET') {
        return json(res, 200, wizards);
    }

    if (p === '/api/wizards' && req.method === 'POST') {
        const body = await readBody(req);
        const wizard = {id: nextWizardId++, ...body};
        wizards.push(wizard);
        return json(res, 201, wizard);
    }

    const wizardMatch = p.match(/^\/api\/wizards\/(\d+)$/);
    if (wizardMatch) {
        const id = Number(wizardMatch[1]);
        const idx = wizards.findIndex((w) => w.id === id);
        if (idx === -1) return json(res, 404, {error: 'Wizard not found'});

        if (req.method === 'DELETE') {
            wands.forEach((w) => {
                if (w.wizardId === id) w.wizardId = null;
            });
            wizards.splice(idx, 1);
            return json(res, 200, {ok: true});
        }
        if (req.method === 'PUT') {
            const body = await readBody(req);
            wizards[idx] = {...wizards[idx], ...body, id};
            return json(res, 200, wizards[idx]);
        }
    }

    // Назначение / снятие волшебника с жезла
    const assignMatch = p.match(/^\/api\/wands\/(\d+)\/assign$/);
    if (assignMatch && req.method === 'POST') {
        const wandId = Number(assignMatch[1]);
        const body = await readBody(req);
        const wand = wands.find((w) => w.id === wandId);
        if (!wand) return json(res, 404, {error: 'Wand not found'});
        wand.wizardId = Number(body.wizardId);
        return json(res, 200, enrichWand(wand));
    }

    const unassignMatch = p.match(/^\/api\/wands\/(\d+)\/unassign$/);
    if (unassignMatch && req.method === 'POST') {
        const wandId = Number(unassignMatch[1]);
        const wand = wands.find((w) => w.id === wandId);
        if (!wand) return json(res, 404, {error: 'Wand not found'});
        wand.wizardId = null;
        return json(res, 200, enrichWand(wand));
    }

    json(res, 404, {error: 'Not found'});
});

server.listen(PORT, () => console.log(`Wands API running on http://localhost:${PORT}`));
