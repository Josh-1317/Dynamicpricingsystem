import express from 'express';
console.log('!!! IMMEDIATE STARTUP CHECK: mock-server.js is loading !!!');
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE_PATH || 'db.json';

// Structured Logging Helper
const structuredLog = (level, message, extra = {}) => {
    const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...extra
    };
    console.log(JSON.stringify(logEntry));
};

structuredLog('info', 'Mock Server Starting up...');
structuredLog('info', `Node Version: ${process.version}`);

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging Middleware
app.use((req, res, next) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Attach ID to request for potential use in downstream logic
    req.id = requestId;

    structuredLog('info', 'Incoming Request', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        structuredLog('info', 'Request Completed', {
            requestId,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            method: req.method,
            path: req.path
        });
    });

    next();
});

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
        structuredLog('error', 'Error reading DB', { error: e.message });
    }
    return { orders: [] };
};

// Helper to save DB
const saveDB = (data) => {
    try {
        ensureDirectoryExistence(DB_FILE);
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        structuredLog('error', 'Error saving DB', { error: e.message });
    }
    // Note: Removed synchronous logging here to avoid spamming logs on every save
    // or keep it if critical debug is needed:
    // structuredLog('debug', 'DB Saved');
};

// Initialize DB in memory
let db = loadDB();

// Routes

// Health Check
app.get(['/', '/health'], (req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// Create Table
app.post('/data/create-table', (req, res) => {
    const data = req.body;
    if (data.table) {
        if (!db[data.table]) db[data.table] = [];
        saveDB(db);
        res.json({ success: true, message: `Table ${data.table} created` });
    } else {
        res.status(400).json({ success: false, message: 'Table name required' });
    }
});

// Insert Data
app.post('/data/insert', (req, res) => {
    const data = req.body;
    if (data.table && data.data) {
        if (!db[data.table]) db[data.table] = [];
        db[data.table].push(data.data);
        saveDB(db);
        res.json({ success: true, message: 'Data inserted', id: db[data.table].length });
    } else {
        res.status(400).json({ success: false, message: 'Table and data required' });
    }
});

// Read Data
app.get('/data/read', (req, res) => {
    const table = req.query.table;
    if (table && db[table]) {
        res.json({ success: true, data: db[table] });
    } else if (table) {
        res.json({ success: true, data: [] });
    } else {
        res.status(400).json({ success: false, message: 'Table parameter required' });
    }
});

// Update Data
app.put('/data/update', (req, res) => {
    const { table, where, data } = req.body;
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
        res.json({ success: true, message: `${updatedCount} records updated` });
    } else {
        res.status(400).json({ success: false, message: 'Invalid parameters or table not found' });
    }
});

// Delete Data
app.delete('/data/delete', (req, res) => {
    const { table, where } = req.body;
    if (table && where && db[table]) {
        const initialLength = db[table].length;
        db[table] = db[table].filter(item => {
            return !Object.keys(where).every(key => item[key] === where[key]);
        });
        const deletedCount = initialLength - db[table].length;
        saveDB(db);
        res.json({ success: true, message: `${deletedCount} records deleted` });
    } else {
        res.status(400).json({ success: false, message: 'Invalid parameters or table not found' });
    }
});

// Auth: Login
app.post('/auth/login', (req, res) => {
    const data = req.body;
    if (data.mobile || data.email) {
        const otp = '1234';
        structuredLog('info', 'OTP Generated', {
            otp,
            identifier: data.mobile || data.email,
            customAttribute: 'otp_event'
        });
        res.json({ success: true, message: 'OTP sent (logged to console)', debug_otp: otp });
    } else {
        res.status(400).json({ success: false, message: 'Mobile or Email required' });
    }
});

// Auth: Verify OTP
app.post('/auth/verify-otp', (req, res) => {
    const { mobile, email, otp } = req.body;
    if ((mobile || email) && otp) {
        if (otp === '1234') {
            res.json({
                success: true,
                message: 'Verification successful',
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: 'user-' + Date.now(),
                    name: 'Client User',
                    role: 'client',
                    mobile: mobile,
                    email: email
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid OTP' });
        }
    } else {
        res.status(400).json({ success: false, message: 'Mobile/Email and OTP required' });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    structuredLog('info', `Mock server running on http://0.0.0.0:${PORT}`);
    structuredLog('info', 'OTP Mode: Console Log (1234)');
});
