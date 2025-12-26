import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, Product, Client, AuditEntry, OrderStatus, PaymentStatus } from '../types/order';
import { dbQuery } from '../../utils/api';

interface AppContextType {
  // Products
  products: Product[];

  // Orders
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  addAuditEntry: (orderId: string, entry: Omit<AuditEntry, 'timestamp'>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  findClientByMobile: (mobile: string) => Client | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Load from localStorage on mount (Clients only)
  useEffect(() => {
    const savedClients = localStorage.getItem('clients');
    if (savedClients) setClients(JSON.parse(savedClients));
  }, []);

  // Fetch orders and products from API
  const fetchData = async () => {
    console.log('Fetching data...');
    // Orders
    const resOrders = await dbQuery<any[]>('/data/read?table=orders', 'GET');
    if (resOrders.success && resOrders.data) {
      const mappedOrders: Order[] = resOrders.data.map(row => {
        const items = JSON.parse(row.items_json || '[]');
        const auditLog = JSON.parse(row.audit_log || '[]');
        const meta = JSON.parse(row.meta_json || '{}');

        return {
          id: row.order_id,
          clientId: meta.clientId || 'unknown',
          clientName: row.client_name,
          clientMobile: row.mobile,
          items: items,
          status: row.status as OrderStatus,
          totalAmount: row.total_amount,
          isLocked: Boolean(row.is_locked),
          auditLog: auditLog.map((entry: any) => ({ ...entry, timestamp: new Date(entry.timestamp) })),
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.created_at),
          paymentStatus: (row.payment_status as PaymentStatus) || 'pending',
          dispatchDate: row.dispatch_date ? new Date(row.dispatch_date) : undefined,
          goodsReceivedDate: row.goods_received_date ? new Date(row.goods_received_date) : undefined,
          ...meta
        };
      });
      setOrders(mappedOrders);
    }

    // Products
    const resProducts = await dbQuery<Product[]>('/data/read?table=products', 'GET');
    if (resProducts.success && resProducts.data) {
      console.log(`Loaded ${resProducts.data.length} products`);
      setProducts(resProducts.data);
    } else {
      console.error('Failed to load products:', resProducts.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Save clients to localStorage
  useEffect(() => {
    localStorage.setItem('clients', JSON.stringify(clients));
  }, [clients]);

  const addOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'auditLog'>) => {
    console.log('[AppContext] addOrder called with:', orderData);
    const orderId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id: orderId,
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

    const itemsContent = JSON.stringify(newOrder.items);
    const auditContent = JSON.stringify(newOrder.auditLog);
    const metaContent = JSON.stringify({
      clientId: newOrder.clientId,
      paymentType: newOrder.paymentType,
      paymentDueDate: newOrder.paymentDueDate,
      rating: newOrder.rating,
      feedback: newOrder.feedback
    });

    const res = await dbQuery('/data/insert', 'POST', {
      table: 'orders',
      data: {
        order_id: orderId,
        client_name: newOrder.clientName,
        mobile: newOrder.clientMobile,
        status: newOrder.status,
        items_json: itemsContent,
        total_amount: newOrder.totalAmount || 0,
        is_locked: false,
        audit_log: auditContent,
        created_at: newOrder.createdAt.toISOString(),
        payment_status: newOrder.paymentStatus,
        meta_json: metaContent
      }
    });
    console.log('[AppContext] addOrder DB response:', res);

    await fetchData();
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const updatedOrder = { ...currentOrder, ...updates, updatedAt: new Date() };
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
    if (updates.dispatchDate) dbUpdates.dispatch_date = updates.dispatchDate.toISOString();
    if (updates.goodsReceivedDate) dbUpdates.goods_received_date = updates.goodsReceivedDate.toISOString();
    if (updates.items) dbUpdates.items_json = JSON.stringify(updates.items);
    if (updates.auditLog) dbUpdates.audit_log = JSON.stringify(updates.auditLog);

    if (updates.paymentType || updates.paymentDueDate || updates.rating || updates.feedback) {
      const currentMeta = {
        clientId: currentOrder.clientId,
        paymentType: currentOrder.paymentType,
        paymentDueDate: currentOrder.paymentDueDate,
        rating: currentOrder.rating,
        feedback: currentOrder.feedback
      };
      const newMeta = {
        ...currentMeta,
        ...(updates.paymentType && { paymentType: updates.paymentType }),
        ...(updates.paymentDueDate && { paymentDueDate: updates.paymentDueDate }),
        ...(updates.rating && { rating: updates.rating }),
        ...(updates.feedback && { feedback: updates.feedback })
      };
      dbUpdates.meta_json = JSON.stringify(newMeta);
    }

    if (updatedOrder.paymentStatus === 'paid' && updatedOrder.goodsReceivedDate && updatedOrder.status !== 'closed') {
      updatedOrder.status = 'closed';
      dbUpdates.status = 'closed';
      const closingAudit = {
        timestamp: new Date(),
        action: 'Order Closed',
        user: 'System',
        details: 'Auto-closed after payment and delivery'
      };
      const newAuditLog = [...(updatedOrder.auditLog || []), closingAudit];
      dbUpdates.audit_log = JSON.stringify(newAuditLog);
    }

    await dbQuery('/data/update', 'PUT', {
      table: 'orders',
      where: { order_id: orderId },
      data: dbUpdates
    });

    await fetchData();
  };

  const addAuditEntry = async (orderId: string, entry: Omit<AuditEntry, 'timestamp'>) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const newEntry = { ...entry, timestamp: new Date() };
    const newAuditLog = [...order.auditLog, newEntry];
    await updateOrder(orderId, { auditLog: newAuditLog });
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    await dbQuery('/data/delete', 'DELETE', {
      table: 'orders',
      where: { order_id: orderId }
    });
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
        products,
        orders,
        addOrder,
        updateOrder,
        addAuditEntry,
        deleteOrder,
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