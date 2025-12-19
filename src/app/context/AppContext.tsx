import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, Product, Client, AuditEntry } from '../types/order';

interface AppContextType {
  // Auth
  currentUser: { role: 'admin' | 'client'; id: string; name: string } | null;
  login: (role: 'admin' | 'client', credentials?: { name: string; mobile: string }) => void;
  logout: () => void;
  
  // Products
  products: Product[];
  
  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  addAuditEntry: (orderId: string, entry: Omit<AuditEntry, 'timestamp'>) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  findClientByMobile: (mobile: string) => Client | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock product catalog
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Steel Rods',
    description: 'High-grade construction steel rods, 12mm diameter',
    unitOfMeasure: 'Ton',
    category: 'Steel Products',
    imageUrl: 'https://images.unsplash.com/photo-1761479867761-7a8b11f54449?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVlbCUyMHJvZHMlMjBjb25zdHJ1Y3Rpb258ZW58MXx8fHwxNzY2MTQxMDg4fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p2',
    name: 'Cement Bags',
    description: 'Portland cement, Grade 53',
    unitOfMeasure: 'Bag (50kg)',
    category: 'Building Materials',
    imageUrl: 'https://images.unsplash.com/photo-1667328951055-43d66e6e87fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZW1lbnQlMjBiYWdzJTIwd2FyZWhvdXNlfGVufDF8fHx8MTc2NjE0MTA4OHww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p3',
    name: 'Aggregate Stone',
    description: '20mm crushed aggregate for concrete',
    unitOfMeasure: 'Cubic Meter',
    category: 'Aggregates',
    imageUrl: 'https://images.unsplash.com/photo-1758642367525-56ed355d0bfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnVzaGVkJTIwc3RvbmUlMjBhZ2dyZWdhdGV8ZW58MXx8fHwxNzY2MTQxMDg4fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p4',
    name: 'Sand (River)',
    description: 'Washed river sand for construction',
    unitOfMeasure: 'Cubic Meter',
    category: 'Aggregates',
    imageUrl: 'https://images.unsplash.com/photo-1686358244601-f6e65f67d4c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW5kJTIwcGlsZSUyMGNvbnN0cnVjdGlvbnxlbnwxfHx8fDE3NjYxNDEwODl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p5',
    name: 'Bricks (Red)',
    description: 'First class red clay bricks',
    unitOfMeasure: 'Per 1000',
    category: 'Masonry',
    imageUrl: 'https://images.unsplash.com/photo-1614896777839-cdec1a580b0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBicmlja3MlMjBzdGFja3xlbnwxfHx8fDE3NjYxNDEwODl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p6',
    name: 'Concrete Blocks',
    description: '6 inch hollow concrete blocks',
    unitOfMeasure: 'Per 100',
    category: 'Masonry',
    imageUrl: 'https://images.unsplash.com/photo-1559226747-74d0ca875bea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jcmV0ZSUyMGJsb2NrcyUyMG1hc29ucnl8ZW58MXx8fHwxNzY2MTQxMDg5fDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p7',
    name: 'Industrial Paint',
    description: 'Weather-resistant exterior paint, all colors',
    unitOfMeasure: 'Liter',
    category: 'Paints & Coatings',
    imageUrl: 'https://images.unsplash.com/photo-1763741226847-f5ef0c846506?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludCUyMGNhbnMlMjBpbmR1c3RyaWFsfGVufDF8fHx8MTc2NjE0MTA5MHww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p8',
    name: 'Electrical Wires',
    description: 'Copper electrical wires, 2.5mm HOUSE wire',
    unitOfMeasure: 'Meter',
    category: 'Electrical',
    imageUrl: 'https://images.unsplash.com/photo-1563068261-13ebbdf16aa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2FsJTIwd2lyZXMlMjBjYWJsZXN8ZW58MXx8fHwxNzY2MTQxMDkwfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p9',
    name: 'PVC Pipes',
    description: 'Schedule 40 PVC pipes for plumbing',
    unitOfMeasure: 'Piece (10ft)',
    category: 'Plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1737574990049-264694ce17a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHBpcGVzJTIwcHZjfGVufDF8fHx8MTc2NjE0MTA5MXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p10',
    name: 'Ceramic Floor Tiles',
    description: 'Premium ceramic tiles, 600x600mm',
    unitOfMeasure: 'Square Meter',
    category: 'Tiles',
    imageUrl: 'https://images.unsplash.com/photo-1695191388218-f6259600223f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwdGlsZXMlMjBmbG9vcnxlbnwxfHx8fDE3NjYxNDEwOTF8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p11',
    name: 'Timber Planks',
    description: 'Treated hardwood timber planks',
    unitOfMeasure: 'Cubic Foot',
    category: 'Timber',
    imageUrl: 'https://images.unsplash.com/photo-1715534408885-b9e45db5fc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b29kJTIwdGltYmVyJTIwcGxhbmtzfGVufDF8fHx8MTc2NjE0MTA5MXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p12',
    name: 'Glass Panels',
    description: 'Tempered glass panels for windows and doors',
    unitOfMeasure: 'Square Foot',
    category: 'Glass & Windows',
    imageUrl: 'https://images.unsplash.com/photo-1654072758089-bdac254f4f90?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMHBhbmVscyUyMHdpbmRvd3N8ZW58MXx8fHwxNzY2MTQxMDkyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p13',
    name: 'Hardware & Fasteners',
    description: 'Nuts, bolts, screws, and construction fasteners',
    unitOfMeasure: 'Kilogram',
    category: 'Hardware',
    imageUrl: 'https://images.unsplash.com/photo-1736155814290-c6f0e87c1544?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXJkd2FyZSUyMHRvb2xzJTIwY29uc3RydWN0aW9ufGVufDF8fHx8MTc2NjE0MTA5Mnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p14',
    name: 'Metal Roofing Sheets',
    description: 'Galvanized corrugated roofing sheets',
    unitOfMeasure: 'Sheet (8ft)',
    category: 'Roofing',
    imageUrl: 'https://images.unsplash.com/photo-1738106099498-1df3c7d8841e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29maW5nJTIwc2hlZXRzJTIwbWV0YWx8ZW58MXx8fHwxNzY2MTQxMDkyfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'p15',
    name: 'Insulation Foam',
    description: 'Polyurethane foam insulation boards',
    unitOfMeasure: 'Square Meter',
    category: 'Insulation',
    imageUrl: 'https://images.unsplash.com/photo-1609089792573-2ec8b9e263ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN1bGF0aW9uJTIwbWF0ZXJpYWxzJTIwZm9hbXxlbnwxfHx8fDE3NjYxNDEwOTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'client'; id: string; name: string } | null>(null);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('orders');
    const savedClients = localStorage.getItem('clients');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const login = (role: 'admin' | 'client', credentials?: { name: string; mobile: string }) => {
    if (role === 'admin') {
      setCurrentUser({ role: 'admin', id: 'admin-1', name: 'Admin User' });
    } else if (credentials) {
      // Find or create client
      let client = findClientByMobile(credentials.mobile);
      if (!client) {
        client = addClient({
          name: credentials.name,
          mobile: credentials.mobile,
          isApproved: true // Auto-approve for demo
        });
      }
      setCurrentUser({ role: 'client', id: client.id, name: client.name });
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      auditLog: [{
        timestamp: new Date(),
        action: 'Order Created',
        user: orderData.clientName,
        details: 'Initial inquiry submitted'
      }]
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return { ...order, ...updates, updatedAt: new Date() };
      }
      return order;
    }));
  };

  const addAuditEntry = (orderId: string, entry: Omit<AuditEntry, 'timestamp'>) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          auditLog: [...order.auditLog, { ...entry, timestamp: new Date() }],
          updatedAt: new Date()
        };
      }
      return order;
    }));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `CLI-${Date.now()}`,
      createdAt: new Date()
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const findClientByMobile = (mobile: string): Client | undefined => {
    return clients.find(c => c.mobile === mobile);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        products,
        orders,
        addOrder,
        updateOrder,
        addAuditEntry,
        clients,
        addClient,
        findClientByMobile
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}