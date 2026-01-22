import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import {
  DollarSign,
  Send,
  Calendar,
  CheckCircle,
  Package,
  Lock,
  Clock,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, PaymentType, Product } from '../../types/order';
import { dbQuery } from '../../../utils/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AdminOrderModification } from './AdminOrderModification';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  new_inquiry: { label: 'New Inquiry', color: 'bg-blue-100 text-blue-800', icon: Clock },
  pending_pricing: { label: 'Pending Pricing', color: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
  waiting_approval: { label: 'Waiting Client', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
};

export function InquiryManagement() {
  const { orders, updateOrder, addAuditEntry, deleteOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [modifyingOrder, setModifyingOrder] = useState<Order | null>(null);
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [dueDate, setDueDate] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      const result = await dbQuery<Product[]>('/data/read?table=products', 'GET');
      if (result.success && result.data) {
        setCatalogProducts(result.data);
      }
    };
    fetchCatalog();
  }, []);

  const getCatalogPrice = (productId: string, productName: string) => {
    const product = catalogProducts.find(p => p.id === productId || p.name === productName);
    return product?.unitPrice || 0;
  };

  const handleSetPricing = (order: Order) => {
    const updatedItems = order.items.map(item => {
      const unitPrice = prices.get(item.productId) || 0;
      return {
        ...item,
        unitPrice,
        subtotal: unitPrice * item.quantity
      };
    });

    const total = updatedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    updateOrder(order.id, {
      items: updatedItems,
      totalAmount: total,
      status: 'waiting_approval'
    });

    addAuditEntry(order.id, {
      action: 'Pricing Set',
      user: 'Admin',
      details: `Total: ₹${total.toFixed(2)}`
    });

    setPrices(new Map());
    setSelectedOrder(null);
    toast.success('Quote sent to client for approval');
  };

  const handleSetPaymentTerms = (order: Order) => {
    updateOrder(order.id, {
      paymentType,
      paymentDueDate: paymentType === 'credit' && dueDate ? new Date(dueDate) : undefined
    });

    addAuditEntry(order.id, {
      action: 'Payment Terms Set',
      user: 'Admin',
      details: `${paymentType.toUpperCase()}${paymentType === 'credit' ? ` - Due: ${dueDate}` : ''}`
    });

    toast.success('Payment terms updated');
  };

  const handleDispatch = (order: Order) => {
    updateOrder(order.id, {
      status: 'dispatched',
      dispatchDate: new Date()
    });

    addAuditEntry(order.id, {
      action: 'Order Dispatched',
      user: 'Admin',
      details: 'Materials in transit'
    });

    toast.success('Order marked as dispatched');
  };

  const handleMarkPaid = (order: Order) => {
    const newStatus = order.goodsReceivedDate ? 'closed' : order.status;

    updateOrder(order.id, {
      paymentStatus: 'paid',
      status: newStatus
    });

    addAuditEntry(order.id, {
      action: 'Payment Received',
      user: 'Admin',
      details: 'Payment marked as paid'
    });

    toast.success(newStatus === 'closed' ? 'Order closed successfully' : 'Payment recorded');
  };

  const handleCleanup = () => {
    const staleOrders = orders.filter(o =>
      (o.status === 'new_inquiry' || o.status === 'pending_pricing') &&
      (new Date().getTime() - new Date(o.createdAt).getTime() > 30 * 24 * 60 * 60 * 1000)
    );

    if (staleOrders.length === 0) {
      toast.info('No stale orders found (older than 30 days)');
      return;
    }

    if (window.confirm(`Found ${staleOrders.length} stale orders. Delete them permanently?`)) {
      staleOrders.forEach(o => deleteOrder(o.id));
      toast.success(`Cleaned up ${staleOrders.length} orders`);
    }
  };

  const needsPricing = orders.filter(o =>
    o.status === 'new_inquiry' || o.status === 'pending_pricing'
  );
  const activeOrders = orders.filter(o =>
    o.status !== 'closed'
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>New Inquiries</CardDescription>
            <CardTitle className="text-3xl">{needsPricing.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Orders</CardDescription>
            <CardTitle className="text-3xl">{activeOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Payment</CardDescription>
            <CardTitle className="text-3xl">
              {orders.filter(o => o.paymentStatus === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {orders.filter(o => o.status === 'closed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>Order Management</h2>
          <Button onClick={handleCleanup} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup Stale Orders
          </Button>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          orders.map(order => {
            const StatusIcon = statusConfig[order.status].icon;
            const isPricing = selectedOrder === order.id;
            const showLogFor = expandedLog === order.id;

            return (
              <Card key={order.id}>
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        {order.isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                      </div>
                      <CardDescription>
                        Client: {order.clientName} | Created {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig[order.status].color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Items with Pricing */}
                    <div>
                      <p className="font-medium mb-3">Order Items</p>
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div key={item.productId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <Badge variant="outline" className="mt-1">Qty: {item.quantity}</Badge>
                            </div>
                            {(order.status === 'new_inquiry' || order.status === 'pending_pricing') && isPricing ? (
                              <div className="flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">Unit Price:</Label>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={prices.get(item.productId) || ''}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setPrices(prev => {
                                        const next = new Map(prev);
                                        next.set(item.productId, value);
                                        return next;
                                      });
                                    }}
                                    className="w-32"
                                    step="0.01"
                                    min="0"
                                  />
                                  {prices.get(item.productId) && (
                                    <span className="text-sm font-medium">
                                      = ₹{(prices.get(item.productId)! * item.quantity).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {isPricing && (
                                  <div className="text-xs text-gray-500">
                                    Catalog Price: ₹{getCatalogPrice(item.productId, item.productName).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            ) : item.unitPrice ? (
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">@ ₹{item.unitPrice.toFixed(2)}</span>
                                <span className="font-medium">₹{item.subtotal?.toFixed(2)}</span>
                              </div>
                            ) : (
                              <Badge variant="secondary">Awaiting Price</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    {order.totalAmount && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <span className="font-medium">Total Order Value</span>
                        <span className="font-bold text-xl">₹{order.totalAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Pricing Action */}
                    {(order.status === 'new_inquiry' || order.status === 'pending_pricing') && (
                      <div className="flex gap-2">
                        {!isPricing ? (
                          <>
                            <Button onClick={() => setSelectedOrder(order.id)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Set Pricing
                            </Button>
                            <Button onClick={() => setModifyingOrder(order)} variant="outline" className="border-purple-300 hover:bg-purple-50">
                              <Edit className="w-4 h-4 mr-2" />
                              Modify Items
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button onClick={() => handleSetPricing(order)} className="flex-1">
                              <Send className="w-4 h-4 mr-2" />
                              Send Quote to Client
                            </Button>
                            <Button onClick={() => setSelectedOrder(null)} variant="outline" className="flex-1">
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Payment Terms */}
                    {order.status === 'confirmed' && (
                      <div className="space-y-3">
                        <Separator />
                        <p className="font-medium">Set Payment Terms</p>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash (Immediate)</SelectItem>
                                <SelectItem value="credit">Credit (Approved)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {paymentType === 'credit' && (
                            <div className="space-y-2">
                              <Label>Payment Due Date</Label>
                              <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSetPaymentTerms(order)} className="flex-1">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Set Terms & Dispatch
                          </Button>
                          {order.paymentStatus === 'pending' && (
                            <Button onClick={() => handleMarkPaid(order)} variant="outline" className="flex-1">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Info Display */}
                    {order.paymentType && (
                      <div className="space-y-2">
                        <Separator />
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Payment:</span>
                            <Badge variant="outline" className="ml-2">
                              {order.paymentType.toUpperCase()}
                            </Badge>
                          </div>
                          {order.paymentDueDate && (
                            <div>
                              <span className="text-gray-600">Due:</span>
                              <span className="ml-2 font-medium">
                                {format(new Date(order.paymentDueDate), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <Badge
                              variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                              className="ml-2"
                            >
                              {order.paymentStatus.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dispatch Action */}
                    {order.status === 'confirmed' && order.paymentType && !order.dispatchDate && (
                      <Button onClick={() => handleDispatch(order)} className="w-full">
                        <Package className="w-4 h-4 mr-2" />
                        Mark as Dispatched
                      </Button>
                    )}

                    {/* Mark Paid for Dispatched Orders */}
                    {order.status === 'dispatched' && order.paymentStatus === 'pending' && (
                      <Button onClick={() => handleMarkPaid(order)} variant="outline" className="w-full">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Mark Payment as Received
                      </Button>
                    )}

                    {/* Receipt Confirmation Status */}
                    {order.goodsReceivedDate && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Goods Received</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Confirmed on {format(new Date(order.goodsReceivedDate), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {order.rating && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            <span className="text-yellow-500">{'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}</span>
                          </div>
                        )}
                        {order.feedback && (
                          <p className="mt-2 text-sm italic text-gray-700">"{order.feedback}"</p>
                        )}
                      </div>
                    )}

                    {/* Audit Log */}
                    <div className="pt-2">
                      <Button
                        onClick={() => setExpandedLog(showLogFor ? null : order.id)}
                        variant="ghost"
                        size="sm"
                        className="w-full"
                      >
                        {showLogFor ? 'Hide' : 'Show'} Audit Log ({order.auditLog.length} entries)
                      </Button>

                      {showLogFor && (
                        <div className="mt-3 space-y-2">
                          {order.auditLog.map((entry, idx) => (
                            <div key={idx} className="flex gap-3 text-sm p-3 bg-gray-50 rounded border-l-2 border-blue-500">
                              <span className="text-gray-500 text-xs w-32 shrink-0">
                                {format(new Date(entry.timestamp), 'MMM dd, HH:mm:ss')}
                              </span>
                              <div className="flex-1">
                                <span className="font-medium">{entry.action}</span>
                                <span className="text-gray-600 mx-2">by</span>
                                <span className="text-blue-600">{entry.user}</span>
                                {entry.details && (
                                  <p className="text-gray-600 mt-1">{entry.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Order Modification Dialog */}
      {modifyingOrder && (
        <AdminOrderModification
          order={modifyingOrder}
          isOpen={!!modifyingOrder}
          onClose={() => setModifyingOrder(null)}
        />
      )}
    </div>
  );
}