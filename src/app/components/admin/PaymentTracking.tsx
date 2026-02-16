import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Order } from '../../types/order';
import {
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  BellOff,
  Edit
} from 'lucide-react';
import { format, addDays, isBefore, isToday } from 'date-fns';
import { toast } from 'sonner';

export function PaymentTracking() {
  const { orders, updateOrder, addAuditEntry } = useApp();
  const [editingReminder, setEditingReminder] = useState<string | null>(null);
  const [newReminderDate, setNewReminderDate] = useState('');

  // Get orders with payment terms
  const creditOrders = orders.filter(o =>
    o.paymentType === 'credit' &&
    o.paymentStatus === 'pending' &&
    o.status !== 'closed'
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getPaymentStatus = (order: Order) => {
    if (!order.paymentDueDate) return 'no-date';

    const dueDate = new Date(order.paymentDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const reminderDate = order.paymentReminderDate
      ? new Date(order.paymentReminderDate)
      : dueDate;
    reminderDate.setHours(0, 0, 0, 0);

    if (isBefore(reminderDate, today)) {
      return 'overdue';
    } else if (isToday(reminderDate)) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  const handleMarkPaid = (order: Order) => {
    // Auto-close order if BOTH payment is paid AND goods are received
    const shouldClose = !!order.goodsReceivedDate;

    updateOrder(order.id, {
      paymentStatus: 'paid',
      status: shouldClose ? 'closed' : order.status
    });

    addAuditEntry(order.id, {
      action: 'Payment Received',
      user: 'Admin',
      details: `Payment marked as PAID. Amount: ₹${order.totalAmount?.toFixed(2)}. ${shouldClose ? 'Order CLOSED (payment + goods both confirmed)' : 'Awaiting goods receipt confirmation to close order'}`
    });

    if (shouldClose) {
      toast.success('Payment received! Order automatically closed (goods already received).');
    } else {
      toast.success('Payment marked as received! Order will close once client confirms goods receipt.');
    }
  };

  const handleSnoozeReminder = (order: Order, days: number) => {
    const currentReminder = order.paymentReminderDate
      ? new Date(order.paymentReminderDate)
      : new Date(order.paymentDueDate!);

    const newDate = addDays(currentReminder, days);

    updateOrder(order.id, {
      paymentReminderDate: newDate
    });

    addAuditEntry(order.id, {
      action: 'Payment Reminder Snoozed',
      user: 'Admin',
      details: `Reminder extended to ${format(newDate, 'MMM dd, yyyy')}`
    });

    toast.success(`Reminder snoozed to ${format(newDate, 'MMM dd, yyyy')}`);
  };

  const handleExtendDueDate = (order: Order) => {
    if (!newReminderDate) {
      toast.error('Please select a new date');
      return;
    }

    const newDate = new Date(newReminderDate);

    updateOrder(order.id, {
      paymentReminderDate: newDate
    });

    addAuditEntry(order.id, {
      action: 'Payment Due Date Extended',
      user: 'Admin',
      details: `New reminder date: ${format(newDate, 'MMM dd, yyyy')}`
    });

    toast.success('Payment reminder date updated!');
    setEditingReminder(null);
    setNewReminderDate('');
  };

  const overdueOrders = creditOrders.filter(o => getPaymentStatus(o) === 'overdue');
  const todayOrders = creditOrders.filter(o => getPaymentStatus(o) === 'today');
  const upcomingOrders = creditOrders.filter(o => getPaymentStatus(o) === 'upcoming');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-red-900">Overdue Payments</CardTitle>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{overdueOrders.length}</p>
            <p className="text-sm text-red-700">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-amber-900">Due Today</CardTitle>
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{todayOrders.length}</p>
            <p className="text-sm text-amber-700">Collection reminders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-blue-900">Upcoming</CardTitle>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{upcomingOrders.length}</p>
            <p className="text-sm text-blue-700">Future collections</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments */}
      {overdueOrders.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Overdue Payments - Action Required
          </h3>
          <div className="space-y-3">
            {overdueOrders.map(order => (
              <PaymentCard
                key={order.id}
                order={order}
                status="overdue"
                onMarkPaid={handleMarkPaid}
                onSnooze={handleSnoozeReminder}
                onExtend={handleExtendDueDate}
                editingReminder={editingReminder}
                setEditingReminder={setEditingReminder}
                newReminderDate={newReminderDate}
                setNewReminderDate={setNewReminderDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {todayOrders.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-amber-700">
            <Bell className="w-5 h-5" />
            Payment Collection Due Today
          </h3>
          <div className="space-y-3">
            {todayOrders.map(order => (
              <PaymentCard
                key={order.id}
                order={order}
                status="today"
                onMarkPaid={handleMarkPaid}
                onSnooze={handleSnoozeReminder}
                onExtend={handleExtendDueDate}
                editingReminder={editingReminder}
                setEditingReminder={setEditingReminder}
                newReminderDate={newReminderDate}
                setNewReminderDate={setNewReminderDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {upcomingOrders.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-blue-700">
            <Clock className="w-5 h-5" />
            Upcoming Payment Collections
          </h3>
          <div className="space-y-3">
            {upcomingOrders.map(order => (
              <PaymentCard
                key={order.id}
                order={order}
                status="upcoming"
                onMarkPaid={handleMarkPaid}
                onSnooze={handleSnoozeReminder}
                onExtend={handleExtendDueDate}
                editingReminder={editingReminder}
                setEditingReminder={setEditingReminder}
                newReminderDate={newReminderDate}
                setNewReminderDate={setNewReminderDate}
              />
            ))}
          </div>
        </div>
      )}

      {creditOrders.length === 0 && (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6 text-center py-12">
            <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No pending credit payments to track.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PaymentCardProps {
  order: Order;
  status: 'overdue' | 'today' | 'upcoming';
  onMarkPaid: (order: Order) => void;
  onSnooze: (order: Order, days: number) => void;
  onExtend: (order: Order) => void;
  editingReminder: string | null;
  setEditingReminder: (id: string | null) => void;
  newReminderDate: string;
  setNewReminderDate: (date: string) => void;
}

function PaymentCard({
  order,
  status,
  onMarkPaid,
  onSnooze,
  onExtend,
  editingReminder,
  setEditingReminder,
  newReminderDate,
  setNewReminderDate
}: PaymentCardProps) {
  const isEditing = editingReminder === order.id;

  const statusConfig = {
    overdue: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-300',
      badge: 'bg-red-500 text-white',
      icon: AlertTriangle
    },
    today: {
      bg: 'from-amber-50 to-amber-100',
      border: 'border-amber-300',
      badge: 'bg-amber-500 text-white',
      icon: Bell
    },
    upcoming: {
      bg: 'from-blue-50 to-blue-100',
      border: 'border-blue-300',
      badge: 'bg-blue-500 text-white',
      icon: Clock
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const displayDate = order.paymentReminderDate || order.paymentDueDate;

  return (
    <Card className={`bg-gradient-to-r ${config.bg} border-2 ${config.border}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium">Order #{order.id}</h4>
                <Badge className={`${config.badge} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {status === 'overdue' ? 'OVERDUE' : status === 'today' ? 'DUE TODAY' : 'UPCOMING'}
                </Badge>
              </div>
              <p className="text-sm text-gray-700">Client: {order.clientName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">₹{order.totalAmount?.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Original Due Date:</p>
              <p className="font-medium">
                {order.paymentDueDate && format(new Date(order.paymentDueDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Current Reminder:</p>
              <p className="font-medium">
                {displayDate && format(new Date(displayDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => onMarkPaid(order)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
              <Button
                onClick={() => onSnooze(order, 3)}
                variant="outline"
                className="border-amber-400 hover:bg-amber-50"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Snooze 3 Days
              </Button>
              <Button
                onClick={() => onSnooze(order, 7)}
                variant="outline"
                className="border-blue-400 hover:bg-blue-50"
              >
                <BellOff className="w-4 h-4 mr-2" />
                Snooze 7 Days
              </Button>
              <Button
                onClick={() => setEditingReminder(order.id)}
                variant="outline"
                className="border-purple-400 hover:bg-purple-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Extend
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-white/50 rounded-lg border-2 border-purple-300">
              <Label>Set New Reminder Date</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="flex-1"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
                <Button
                  onClick={() => onExtend(order)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Update
                </Button>
                <Button
                  onClick={() => setEditingReminder(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}