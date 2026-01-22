import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple .env parser since we don't have dotenv
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
let env = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.log('Could not read .env file, using defaults/process.env');
}

const API_KEY = env.VITE_API_KEY || '3044f3a0-0082-4898-896a-00f1d5e2af68';
const API_BASE_URL = env.VITE_API_BASE_URL || 'https://automatic-db.com/api/v1';

async function initDB() {
    console.log('Initializing Database...');
    console.log(`Target: ${API_BASE_URL}`);

    try {
        const response = await fetch(`${API_BASE_URL}/data/create-table`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({
                table: 'orders',
                columns: [
                    { name: 'order_id', type: 'VARCHAR' },
                    { name: 'client_name', type: 'TEXT' },
                    { name: 'mobile', type: 'VARCHAR' },
                    { name: 'status', type: 'VARCHAR' },
                    { name: 'items_json', type: 'TEXT' },
                    { name: 'total_amount', type: 'FLOAT' },
                    { name: 'is_locked', type: 'BOOLEAN' },
                    { name: 'audit_log', type: 'TEXT' },
                    // Additional useful columns we might want, though prompt specified the list above. 
                    // We might need createdAt for cleanup logic, let's stick to prompt strict reqs first 
                    // but 'created_at' is usually automatic or helpful. 
                    // The prompt "Data Cleanup" mentions "older than 30 days". 
                    // Standard DBs usually have created_at, but I'll add it to be safe for the cleanup logic.
                    { name: 'created_at', type: 'DATETIME' },
                    { name: 'payment_status', type: 'VARCHAR' }, // Needed for Module D logic
                    { name: 'goods_received_date', type: 'DATETIME' }, // Needed for Module D logic
                    { name: 'dispatch_date', type: 'DATETIME' },
                    { name: 'meta_json', type: 'TEXT' } // Needed for Module D logic
                ]
            })
        });

        const data = await response.json();
        console.log('Response:', data);

        if (data.success) {
            console.log('✅ Table "orders" created successfully.');
        } else {
            console.error('❌ Failed to create table:', data.message);
        }

    } catch (error) {
        console.error('❌ Connection Error:', error);
    }
}

initDB();
