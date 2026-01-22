// Core types for the order management system

export type OrderStatus =
  | 'new_inquiry'
  | 'pending_pricing'
  | 'waiting_approval'
  | 'confirmed'
  | 'dispatched'
  | 'closed';

export type PaymentType = 'cash' | 'credit';
export type PaymentStatus = 'pending' | 'paid';

export interface Product {
  id: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  category?: string;
  imageUrl?: string;
  unitPrice?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface Client {
  id: string;
  name: string;
  mobile: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  user: string;
  details?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientMobile: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount?: number;
  paymentType?: PaymentType;
  paymentStatus: PaymentStatus;
  paymentDueDate?: Date;
  paymentReminderDate?: Date; // For snoozing payment reminders
  dispatchDate?: Date;
  goodsReceivedDate?: Date;
  rating?: number;
  feedback?: string;
  auditLog: AuditEntry[];
  createdAt: Date;
  updatedAt: Date;
  isLocked: boolean;
}