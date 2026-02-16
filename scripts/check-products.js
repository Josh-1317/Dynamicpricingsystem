import http from 'http';

const getProducts = () => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3001/data/read?table=products', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
};

getProducts().then(data => {
    console.log('API Response:', JSON.stringify(data, null, 2));
    if (data.data && data.data.length > 0) {
        console.log(`✅ Found ${data.data.length} products.`);
    } else {
        console.log('❌ No products found.');
    }
}).catch(console.error);
