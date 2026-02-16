import http from 'http';

const data = JSON.stringify({
    table: 'orders',
    data: {
        order_id: `TEST-${Date.now()}`,
        client_name: 'Test Client',
        mobile: '1234567890',
        status: 'new_inquiry',
        items_json: '[]',
        total_amount: 0,
        is_locked: false,
        audit_log: '[]',
        created_at: new Date().toISOString(),
        payment_status: 'pending',
        meta_json: '{}'
    }
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/data/insert',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
