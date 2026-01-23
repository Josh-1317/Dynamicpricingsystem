import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { InquiryManagement } from './InquiryManagement';
import { PaymentTracking } from './PaymentTracking';
import { ProductManagement } from './ProductManagement';
import { LogOut, LayoutDashboard, FileText, DollarSign, Package } from 'lucide-react';

export function AdminPortal() {
  const { orders } = useApp();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  const newInquiries = orders.filter(o =>
    o.status === 'new_inquiry' || o.status === 'pending_pricing'
  ).length;

  const pendingPayments = orders.filter(o =>
    o.paymentType === 'credit' &&
    o.paymentStatus === 'pending' &&
    o.status !== 'closed'
  ).length;

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1573164713988-8665fc963095?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzY2MDczNzYwfDA&ixlib=rb-4.1.0&q=80&w=1080')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/95 via-indigo-50/95 to-blue-50/95" />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-b sticky top-0 z-20 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-purple-100">Welcome, {currentUser?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {newInquiries > 0 && (
                  <div className="px-4 py-2 bg-red-500 rounded-full text-sm font-medium shadow-lg animate-pulse">
                    🔔 {newInquiries} New Inquiry{newInquiries !== 1 ? 's' : ''}
                  </div>
                )}
                {pendingPayments > 0 && (
                  <div className="px-4 py-2 bg-amber-500 rounded-full text-sm font-medium shadow-lg">
                    💰 {pendingPayments} Pending Payment{pendingPayments !== 1 ? 's' : ''}
                  </div>
                )}
                <Button onClick={logout} variant="secondary" className="bg-white/20 hover:bg-white/30 border-white/30">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-white/80 backdrop-blur-sm shadow-md">
              <TabsTrigger value="orders">
                <FileText className="w-4 h-4 mr-2" />
                Order Management
                {newInquiries > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs animate-pulse">
                    {newInquiries}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-2" />
                Master Catalog
              </TabsTrigger>
              <TabsTrigger value="payments">
                <DollarSign className="w-4 h-4 mr-2" />
                Payment Tracking
                {pendingPayments > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs">
                    {pendingPayments}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <InquiryManagement />
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentTracking />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}