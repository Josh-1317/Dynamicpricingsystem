import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { ClientPortal } from './components/client/ClientPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { currentUser } = useAuth();

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
    <AuthProvider>
      <AppProvider>
        <AppContent />
        <Toaster />
      </AppProvider>
    </AuthProvider>
  );
}