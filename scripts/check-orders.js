import http from 'http';

const getOrders = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3001/data/read?table=orders', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
};

getOrders().then(data => {
    console.log('Orders API Response:', JSON.stringify(data, null, 2));
    if (data.data && data.data.length > 0) {
        console.log(`✅ Found ${data.data.length} orders.`);
    } else {
        console.log('❌ No orders found.');
    }
}).catch(console.error);
