import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/LoginPage';
import { ClientPortal } from './components/client/ClientPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  if (currentUser.role === 'admin') {
    return <AdminPortal />;
  }

  return <ClientPortal />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Toaster />
    </AppProvider>
  );
}