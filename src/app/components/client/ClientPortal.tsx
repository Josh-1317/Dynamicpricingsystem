import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CatalogBrowser } from './CatalogBrowser';
import { OrdersList } from './OrdersList';
import { LogOut, ShoppingBag, FileText } from 'lucide-react';

export function ClientPortal() {
  const { orders } = useApp();
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog');

  const myOrdersCount = orders.filter(o => o.clientId === currentUser?.id).length;
  const pendingActions = orders.filter(
    o => o.clientId === currentUser?.id && o.status === 'waiting_approval'
  ).length;

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY2MDYxNDYwfDA&ixlib=rb-4.1.0&q=80&w=1080')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-purple-50/95" />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b sticky top-0 z-20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-xl font-bold text-white">Client Portal</h1>
                <p className="text-sm text-blue-100">Welcome, {currentUser?.name}</p>
              </div>
              <Button onClick={logout} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-white/80 backdrop-blur-sm shadow-md">
              <TabsTrigger value="catalog">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Catalog
              </TabsTrigger>
              <TabsTrigger value="orders">
                <FileText className="w-4 h-4 mr-2" />
                My Orders
                {myOrdersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs">
                    {myOrdersCount}
                  </span>
                )}
                {pendingActions > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse">
                    {pendingActions} pending
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="catalog">
              <CatalogBrowser />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersList />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}