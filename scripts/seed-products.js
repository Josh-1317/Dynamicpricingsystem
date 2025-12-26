import http from 'http';

const PRODUCTS = [
    {
        name: 'Premium Steel Rods',
        description: 'High-grade construction steel rods, 12mm diameter',
        unitOfMeasure: 'Ton',
        category: 'Steel Products',
        imageUrl: 'https://images.unsplash.com/photo-1761479867761-7a8b11f54449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVlbCUyMHJvZHMlMjBjb25zdHJ1Y3Rpb258ZW58MXx8fHwxNzY2MTQxMDg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 550.00
    },
    {
        name: 'Cement Bags',
        description: 'Portland cement, Grade 53',
        unitOfMeasure: 'Bag (50kg)',
        category: 'Building Materials',
        imageUrl: 'https://images.unsplash.com/photo-1667328951055-43d66e6e87fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZW1lbnQlMjBiYWdzJTIwd2FyZWhvdXNlfGVufDF8fHx8MTc2NjE0MTA4OHww&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 8.50
    },
    {
        name: 'Aggregate Stone',
        description: '20mm crushed aggregate for concrete',
        unitOfMeasure: 'Cubic Meter',
        category: 'Aggregates',
        imageUrl: 'https://images.unsplash.com/photo-1758642367525-56ed355d0bfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnVzaGVkJTIwc3RvbmUlMjBhZ2dyZWdhdGV8ZW58MXx8fHwxNzY2MTQxMDg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 45.00
    },
    {
        name: 'Sand (River)',
        description: 'Washed river sand for construction',
        unitOfMeasure: 'Cubic Meter',
        category: 'Aggregates',
        imageUrl: 'https://images.unsplash.com/photo-1686358244601-f6e65f67d4c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW5kJTIwcGlsZSUyMGNvbnN0cnVjdGlvbnxlbnwxfHx8fDE3NjYxNDEwODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 35.00
    },
    {
        name: 'Bricks (Red)',
        description: 'First class red clay bricks',
        unitOfMeasure: 'Per 1000',
        category: 'Masonry',
        imageUrl: 'https://images.unsplash.com/photo-1614896777839-cdec1a580b0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBicmlja3MlMjBzdGFja3xlbnwxfHx8fDE3NjYxNDEwODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 120.00
    },
    {
        name: 'Concrete Blocks',
        description: '6 inch hollow concrete blocks',
        unitOfMeasure: 'Per 100',
        category: 'Masonry',
        imageUrl: 'https://images.unsplash.com/photo-1559226747-74d0ca875bea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMGJsb2NrcyUyMG1hc29ucnl8ZW58MXx8fHwxNzY2MTQxMDg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 85.00
    },
    {
        name: 'Industrial Paint',
        description: 'Weather-resistant exterior paint, all colors',
        unitOfMeasure: 'Liter',
        category: 'Paints & Coatings',
        imageUrl: 'https://images.unsplash.com/photo-1763741226847-f5ef0c846506?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGNhbnMlMjBpbmR1c3RyaWFsfGVufDF8fHx8MTc2NjE0MTA5MHww&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 15.00
    },
    {
        name: 'Electrical Wires',
        description: 'Copper electrical wires, 2.5mm HOUSE wire',
        unitOfMeasure: 'Meter',
        category: 'Electrical',
        imageUrl: 'https://images.unsplash.com/photo-1563068261-13ebbdf16aa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyZXMlMjBjYWJsZXN8ZW58MXx8fHwxNzY2MTQxMDkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 2.50
    },
    {
        name: 'PVC Pipes',
        description: 'Schedule 40 PVC pipes for plumbing',
        unitOfMeasure: 'Piece (10ft)',
        category: 'Plumbing',
        imageUrl: 'https://images.unsplash.com/photo-1737574990049-264694ce17a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHBpcGVzJTIwcHZjfGVufDF8fHx8MTc2NjE0MTA5MXww&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 12.00
    },
    {
        name: 'Ceramic Floor Tiles',
        description: 'Premium ceramic tiles, 600x600mm',
        unitOfMeasure: 'Square Meter',
        category: 'Tiles',
        imageUrl: 'https://images.unsplash.com/photo-1695191388218-f6259600223f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdGlsZXMlMjBmbG9vcnxlbnwxfHx8fDE3NjYxNDEwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 25.00
    },
    {
        name: 'Timber Planks',
        description: 'Treated hardwood timber planks',
        unitOfMeasure: 'Cubic Foot',
        category: 'Timber',
        imageUrl: 'https://images.unsplash.com/photo-1715534408885-b9e45db5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kJTIwdGltYmVyJTIwcGxhbmtzfGVufDF8fHx8MTc2NjE0MTA5MXww&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 18.00
    },
    {
        name: 'Glass Panels',
        description: 'Tempered glass panels for windows and doors',
        unitOfMeasure: 'Square Foot',
        category: 'Glass & Windows',
        imageUrl: 'https://images.unsplash.com/photo-1654072758089-bdac254f4f90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMHBhbmVscyUyMHdpbmRvd3N8ZW58MXx8fHwxNzY2MTQxMDkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
        unitPrice: 40.00
    }
];

const postData = (path, data) => {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataString.length,
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (e) => reject(e));
        req.write(dataString);
        req.end();
    });
};

const run = async () => {
    console.log('Seeding Database...');

    // Create products table
    await postData('/data/create-table', { table: 'products' });
    console.log('✅ Table "products" ensured.');

    // Insert items
    console.log(`Inserting ${PRODUCTS.length} products...`);
    for (const product of PRODUCTS) {
        const productData = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...product
        };
        await postData('/data/insert', { table: 'products', data: productData });
    }

    console.log('✅ Seeding complete!');
};

run().catch(console.error);
