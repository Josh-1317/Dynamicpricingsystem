import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Star,
  AlertCircle,
  Lock,
  Edit
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { format } from 'date-fns';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { OrderModificationDialog } from './OrderModificationDialog';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  new_inquiry: { label: 'New Inquiry', color: 'bg-blue-100 text-blue-800', icon: Clock },
  pending_pricing: { label: 'Pending Pricing', color: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
  waiting_approval: { label: 'Awaiting Your Approval', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  dispatched: { label: 'Dispatched', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle }
};

export function OrdersList() {
  const { orders, updateOrder, addAuditEntry } = useApp();
  const { currentUser } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [modifyingOrder, setModifyingOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const clientOrders = orders.filter(o => o.clientId === currentUser?.id);

  const handleAcceptQuote = (order: Order) => {
    updateOrder(order.id, {
      status: 'confirmed',
      isLocked: true
    });
    addAuditEntry(order.id, {
      action: 'Quote Accepted',
      user: currentUser?.name || 'Client',
      details: 'Client confirmed the order'
    });
    toast.success('Quote accepted! Order confirmed and locked.');
  };

  const handleConfirmReceipt = (order: Order) => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    // Determine if order should be closed: BOTH payment paid AND goods received
    const shouldClose = order.paymentStatus === 'paid';

    updateOrder(order.id, {
      goodsReceivedDate: new Date(),
      rating,
      feedback,
      status: shouldClose ? 'closed' : order.status
    });

    addAuditEntry(order.id, {
      action: 'Goods Received',
      user: currentUser?.name || 'Client',
      details: `Confirmed receipt with ${rating} stars. ${shouldClose ? 'Order CLOSED (payment received + goods confirmed)' : 'Awaiting payment clearance to close order'}`
    });

    if (shouldClose) {
      toast.success('Thank you! Order completed and closed.');
    } else {
      toast.success('Thank you for confirming receipt! Order will close once payment is cleared.');
    }

    setRating(0);
    setFeedback('');
  };

  if (clientOrders.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
        <CardContent className="pt-6 text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No orders yet. Browse the catalog to submit your first inquiry.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2>My Orders</h2>
        <p className="text-gray-600">Track your inquiries and orders</p>
      </div>

      {clientOrders.map(order => {
        const StatusIcon = statusConfig[order.status].icon;
        const isExpanded = expandedOrder === order.id;

        return (
          <Card key={order.id} className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                    {order.isLocked && <Lock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <CardDescription>
                    Created {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
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
                {/* Items */}
                <div>
                  <p className="font-medium mb-3">Items</p>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="bg-white">Qty: {item.quantity}</Badge>
                          {item.unitPrice && (
                            <>
                              <span className="text-sm text-gray-600">
                                @ ₹{item.unitPrice.toFixed(2)}
                              </span>
                              <span className="font-medium text-green-700">
                                ₹{item.subtotal?.toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                {order.totalAmount && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-300">
                    <span className="font-medium">Total Order Value</span>
                    <span className="font-bold text-2xl text-blue-700">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Payment Info */}
                {order.paymentType && (
                  <div className="space-y-2">
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Type:</span>
                      <Badge variant={order.paymentType === 'cash' ? 'default' : 'secondary'}>
                        {order.paymentType.toUpperCase()}
                      </Badge>
                    </div>
                    {order.paymentDueDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">
                          {format(new Date(order.paymentDueDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Status:</span>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
                        {order.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Closure Status - Show if confirmed or later */}
                {(order.status === 'confirmed' || order.status === 'dispatched' || order.status === 'closed') && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200">
                    <p className="font-medium mb-2 text-purple-900">Order Closure Checklist:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {order.paymentStatus === 'paid' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                        <span className={order.paymentStatus === 'paid' ? 'text-green-700 font-medium' : 'text-gray-700'}>
                          Payment Received
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.goodsReceivedDate ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                        <span className={order.goodsReceivedDate ? 'text-green-700 font-medium' : 'text-gray-700'}>
                          Goods Received & Confirmed
                        </span>
                      </div>
                      {order.status === 'closed' && (
                        <div className="mt-3 pt-3 border-t border-purple-300">
                          <p className="text-green-700 font-medium flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            ✅ Order Successfully Closed
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {order.status === 'waiting_approval' && !order.isLocked && (
                    <>
                      <Button
                        onClick={() => handleAcceptQuote(order)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Quote
                      </Button>
                      <Button
                        onClick={() => setModifyingOrder(order)}
                        variant="outline"
                        className="flex-1 border-blue-300 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modify Order
                      </Button>
                    </>
                  )}

                  {order.status === 'dispatched' && !order.goodsReceivedDate && (
                    <div className="w-full space-y-3">
                      <Separator />
                      <p className="font-medium">Confirm Receipt & Rate Service</p>
                      <div className="flex gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Optional feedback..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={3}
                        className="bg-white"
                      />
                      <Button
                        onClick={() => handleConfirmReceipt(order)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Goods Received
                      </Button>
                    </div>
                  )}
                </div>

                {/* Audit Log */}
                {order.auditLog.length > 0 && (
                  <div className="pt-4">
                    <Button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      variant="ghost"
                      size="sm"
                      className="w-full hover:bg-blue-50"
                    >
                      {isExpanded ? 'Hide' : 'Show'} Activity Log
                    </Button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2">
                        {order.auditLog.map((entry, idx) => (
                          <div key={idx} className="flex gap-3 text-sm p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded border-l-4 border-blue-500">
                            <span className="text-gray-500 text-xs w-32 shrink-0">
                              {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                            </span>
                            <div className="flex-1">
                              <span className="font-medium">{entry.action}</span>
                              {entry.details && (
                                <span className="text-gray-600"> - {entry.details}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Modification Dialog */}
      {modifyingOrder && (
        <OrderModificationDialog
          order={modifyingOrder}
          isOpen={!!modifyingOrder}
          onClose={() => setModifyingOrder(null)}
        />
      )}
    </div>
  );
}