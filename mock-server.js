import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';

console.log('[Mock Server] Starting up...');
console.log('[Mock Server] Node Version:', process.version);
const PORT = process.env.PORT || 3001;
const DB_FILE = process.env.DB_FILE_PATH || 'db.json';

// Helper to ensure directory exists
const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    try {
        fs.mkdirSync(dirname);
    } catch (e) {
        // Ignore error if it was created in the meantime
    }
};

// Helper to load DB
const loadDB = () => {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading DB:', e);
    }
    return { orders: [] };
};

// Helper to save DB
const saveDB = (data) => {
    try {
        ensureDirectoryExistence(DB_FILE);
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error saving DB:', e);
    }
};

// Initialize DB in memory
let db = loadDB();

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Helper to send JSON
    const sendJson = (data, status = 200) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper to read body
    const readBody = (callback) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const json = body ? JSON.parse(body) : {};
                callback(json);
            } catch (e) {
                sendJson({ success: false, message: 'Invalid JSON' }, 400);
            }
        });
    };

    console.log(`${req.method} ${pathname}`);

    if (pathname === '/data/create-table' && req.method === 'POST') {
        readBody((data) => {
            if (data.table) {
                if (!db[data.table]) db[data.table] = [];
                saveDB(db);
                sendJson({ success: true, message: `Table ${data.table} created` });
            } else {
                sendJson({ success: false, message: 'Table name required' }, 400);
            }
        });
    } else if (pathname === '/data/insert' && req.method === 'POST') {
        readBody((data) => {
            if (data.table && data.data) {
                if (!db[data.table]) db[data.table] = [];
                db[data.table].push(data.data);
                saveDB(db);
                sendJson({ success: true, message: 'Data inserted', id: db[data.table].length });
            } else {
                sendJson({ success: false, message: 'Table and data required' }, 400);
            }
        });
    } else if (pathname === '/data/read' && req.method === 'GET') {
        const table = parsedUrl.query.table;
        if (table && db[table]) {
            sendJson({ success: true, data: db[table] });
        } else if (table) {
            sendJson({ success: true, data: [] });
        } else {
            sendJson({ success: false, message: 'Table parameter required' }, 400);
        }
    } else if (pathname === '/data/update' && req.method === 'PUT') {
        readBody((body) => {
            const { table, where, data } = body;
            if (table && where && data && db[table]) {
                let updatedCount = 0;
                db[table] = db[table].map(item => {
                    const isMatch = Object.keys(where).every(key => item[key] === where[key]);
                    if (isMatch) {
                        updatedCount++;
                        return { ...item, ...data };
                    }
                    return item;
                });
                saveDB(db);
                sendJson({ success: true, message: `${updatedCount} records updated` });
            } else {
                sendJson({ success: false, message: 'Invalid parameters or table not found' }, 400);
            }
        });
    } else if (pathname === '/auth/login' && req.method === 'POST') {
        readBody((data) => {
            if (data.mobile || data.email) {
                const otp = '1234';
                console.log(`[Mock Auth] OTP for ${data.mobile || data.email}: ${otp}`);
                sendJson({ success: true, message: 'OTP sent (logged to console)', debug_otp: otp });
            } else {
                sendJson({ success: false, message: 'Mobile or Email required' }, 400);
            }
        });
    } else if (pathname === '/auth/verify-otp' && req.method === 'POST') {
        readBody((data) => {
            const { mobile, email, otp } = data;
            if ((mobile || email) && otp) {
                if (otp === '1234') {
                    sendJson({
                        success: true,
                        message: 'Verification successful',
                        token: 'mock-jwt-token-' + Date.now(),
                        user: {
                            id: 'user-' + Date.now(),
                            name: 'Client User',
                            role: 'client', // ENSURE CLIENT ROLE
                            mobile: mobile,
                            email: email
                        }
                    });
                } else {
                    sendJson({ success: false, message: 'Invalid OTP' }, 401);
                }
            } else {
                sendJson({ success: false, message: 'Mobile/Email and OTP required' }, 400);
            }
        });
    } else if (pathname === '/data/delete' && req.method === 'DELETE') {
        readBody((body) => {
            const { table, where } = body;
            if (table && where && db[table]) {
                const initialLength = db[table].length;
                db[table] = db[table].filter(item => {
                    return !Object.keys(where).every(key => item[key] === where[key]);
                });
                const deletedCount = initialLength - db[table].length;
                saveDB(db);
                sendJson({ success: true, message: `${deletedCount} records deleted` });
            } else {
                sendJson({ success: false, message: 'Invalid parameters or table not found' }, 400);
            }
        });
    } else if (pathname === '/' || pathname === '/health' && req.method === 'GET') {
        sendJson({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
    } else {
        sendJson({ success: false, message: 'Not Found' }, 404);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock server running on http://0.0.0.0:${PORT}`);
    console.log('OTP Mode: Console Log (1234)');
});
