import express from 'express';
console.log('!!! IMMEDIATE STARTUP CHECK: mock-server.js is loading !!!');
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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


// Use explicit error handling for process events
process.on('uncaughtException', (err) => {
    structuredLog('error', 'Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    structuredLog('error', 'Unhandled Rejection', { reason: reason instanceof Error ? reason.message : reason });
});

structuredLog('info', 'Mock Server Starting up...');
structuredLog('info', `Node Version: ${process.version}`);
structuredLog('info', `Environment PORT: ${process.env.PORT}`);


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
    let db = { orders: [], products: [] };
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(data);
        }
    } catch (e) {
        structuredLog('error', 'Error reading DB', { error: e.message });
    }

    // Seed default products if missing
    if (!db.products || db.products.length === 0) {
        db.products = [
            {
                id: "prod-1",
                name: "Premium Steel Rods",
                description: "High-grade construction steel rods, 12mm diameter",
                unitOfMeasure: "Ton",
                category: "Steel Products",
                imageUrl: "https://images.unsplash.com/photo-1761479867761-7a8b11f54449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVlbCUyMHJvZHMlMjBjb25zdHJ1Y3Rpb258ZW58MXx8fHwxNzY2MTQxMDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
                unitPrice: 550
            },
            {
                id: "prod-2",
                name: "Cement Bags",
                description: "Portland cement, Grade 53",
                unitOfMeasure: "Bag (50kg)",
                category: "Building Materials",
                imageUrl: "https://images.unsplash.com/photo-1667328951055-43d66e6e87fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZW1lbnQlMjBiYWdzJTIwd2FyZWhvdXNlfGVufDF8fHx8MTc2NjE0MTA4OHww&ixlib=rb-4.1.0&q=80&w=1080",
                unitPrice: 8.5
            },
            {
                id: "prod-3",
                name: "Red Bricks",
                description: "First class red clay bricks",
                unitOfMeasure: "Per 1000",
                category: "Masonry",
                imageUrl: "https://images.unsplash.com/photo-1614896777839-cdec1a580b0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBicmlja3MlMjBzdGFja3xlbnwxfHx8fDE3NjYxNDEwODl8MA&ixlib=rb-4.1.0&q=80&w=1080",
                unitPrice: 120
            }
        ];
        saveDB(db);
    }

    return db;
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
app.get('/health', (req, res) => {
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

// Serve Frontend (last priority)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    structuredLog('info', 'Serving frontend from dist', {
        files: fs.readdirSync(distPath)
    });
} else {
    structuredLog('error', 'DIST FOLDER MISSING - Build failed or path incorrect');
}

app.use(express.static(distPath));

app.get('*', (req, res) => {
    // If request asks for a file that doesn't exist, send index.html (SPA)
    // But skip /data and /auth routes just in case regex matched
    if (!req.path.startsWith('/data') && !req.path.startsWith('/auth')) {
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Frontend not built. Run "npm run build" first.');
        }
    } else {
        res.status(404).json({ success: false, message: 'API route not found' });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    structuredLog('info', `Mock server running on http://0.0.0.0:${PORT}`);
    structuredLog('info', 'OTP Mode: Console Log (1234)');
});
