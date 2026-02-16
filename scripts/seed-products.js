import http from 'http';

const PRODUCTS = [
    {
        id: 'RM01',
        name: 'WEIGHTLESS CHARCOAL',
        description: 'Ash: 15-20%, Bulk Density: 0.25-0.32. #RM01',
        unitOfMeasure: 'Pack (40kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm01.png',
        unitPrice: 0 // Price not specified, setting placeholder
    },
    {
        id: 'RM02',
        name: 'FLORA BATHI CHARCOAL',
        description: 'Ash: 20-30%, Bulk Density: 0.4-0.5. #RM02',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm02.png',
        unitPrice: 0
    },
    {
        id: 'RM03',
        name: 'COCONUT SHELL CHARCOAL',
        description: 'Ash: 25-35%, Bulk Density: 0.4-0.5. #RM03',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm03.png',
        unitPrice: 0
    },
    {
        id: 'RM04',
        name: 'RAW BATHI CHARCOAL',
        description: 'Ash: 20-30%, Bulk Density: 0.4-0.5. #RM04',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1624641477726-53896bc35688?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    },
    {
        id: 'RM05',
        name: 'RAW BATHI CHARCOAL (Grade 2)',
        description: 'Ash: 40-50%, Bulk Density: 0.45-0.55. #RM05',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1624641477726-53896bc35688?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    },
    {
        id: 'RM06',
        name: 'BROWN SAW DUST',
        description: 'Ash: 0-5%, Bulk Density: 0.35-0.45. #RM06',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1616782352125-9c988a215324?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    },
    {
        id: 'RM07',
        name: 'WHITE SAW DUST',
        description: 'Ash: 0-5%, Bulk Density: 0.25-0.35. #RM07',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm07.png',
        unitPrice: 0
    },
    {
        id: 'RM08',
        name: 'KUPPAM SAW DUST',
        description: 'Ash: 5-15%, Bulk Density: 0.4-0.55. #RM08',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1616782352125-9c988a215324?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    },
    {
        id: 'RM09',
        name: 'T1 WOOD POWDER',
        description: 'Ash: 0-5%, Bulk Density: 0.3-0.4. #RM09',
        unitOfMeasure: 'Pack (40kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm09.png',
        unitPrice: 0
    },
    {
        id: 'RM10',
        name: 'JOSS POWDER',
        description: 'Ash: 0-5%, Viscosity: 42 Cups. #RM10',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1615671040825-998845c43232?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    },
    {
        id: 'RM11',
        name: 'BAMBOO STICKS',
        description: 'Types: 8", 9", 12". Dia: 1.3mm, Wastage: 0-2%. #RM11',
        unitOfMeasure: 'Pack (30kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm11.png',
        unitPrice: 0
    },
    {
        id: 'RM12',
        name: 'MODIFIED STARCH',
        description: 'Ash: 0-5%, Viscosity: Upto 12000 cps. #RM12',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: '/products/rm12.png',
        unitPrice: 0
    },
    {
        id: 'RM13',
        name: 'POTASSIUM NITRATE',
        description: 'Solubility: 100% in Water, Grade: Fire House. #RM13',
        unitOfMeasure: 'Pack (50kg)',
        category: 'chemicals',
        imageUrl: '/products/rm13.png',
        unitPrice: 0
    },
    {
        id: 'RM14',
        name: 'GUAR GUM',
        description: 'Ash: 0-5%, Viscosity Types: 2000cps, 8000cps. #RM14',
        unitOfMeasure: 'Pack (50kg)',
        category: 'chemicals',
        imageUrl: '/products/rm14.png',
        unitPrice: 0
    },
    {
        id: 'RM15',
        name: 'ACRYLIC POLIMER',
        description: 'Origin: China. #RM15',
        unitOfMeasure: 'Pack (50kg)',
        category: 'chemicals',
        imageUrl: '/products/rm15.png',
        unitPrice: 0
    },
    {
        id: 'RM16',
        name: 'DAMAR BATTU POWDER',
        description: 'Ash: 0-5%, Bulk Density: 0.35-0.4. #RM16',
        unitOfMeasure: 'Pack (50kg)',
        category: 'Raw Materials',
        imageUrl: 'https://images.unsplash.com/photo-1615671040825-998845c43232?w=800&auto=format&fit=crop&q=60',
        unitPrice: 0
    }
];

const postData = (path, data) => {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
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
            id: product.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...product
        };
        await postData('/data/insert', { table: 'products', data: productData });
    }

    console.log('✅ Seeding complete!');
};

run().catch(console.error);
