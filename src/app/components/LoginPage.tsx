import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ShieldCheck, User, Smartphone, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const { loginClient, loginAdmin } = useAuth();

  // Client State
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin State
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientMobile) return;

    setIsSubmitting(true);
    await loginClient(clientName, clientMobile);
    setIsSubmitting(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) return;

    setIsSubmitting(true);
    await loginAdmin(adminUsername, adminPassword);
    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1709715357520-5e1047a2b691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzY2MDc4NjY0fDA&ixlib=rb-4.1.0&q=80&w=1080')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="mb-2 text-white text-4xl font-bold">Dynamic Pricing System</h1>
          <p className="text-blue-100 text-lg">Enterprise-grade workflow management</p>
        </div>

        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm border-white/30">
            <TabsTrigger value="client" className="data-[state=active]:bg-white data-[state=active]:text-blue-900">
              <User className="w-4 h-4 mr-2" />
              Client Portal
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-white/50">
              <CardHeader>
                <CardTitle className="text-2xl">Client Access</CardTitle>
                <CardDescription>
                  Safe & Secure Login via OTP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClientLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="client-name"
                        placeholder="Enter your name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-mobile">Mobile Number</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="client-mobile"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={clientMobile}
                        onChange={(e) => setClientMobile(e.target.value)}
                        required
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {isSubmitting ? 'Accessing...' : 'Access Client Portal'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-white/50">
              <CardHeader>
                <CardTitle className="text-2xl">Admin Access</CardTitle>
                <CardDescription>
                  Enter credentials to access admin dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      placeholder="Enter admin username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">Demo Credentials</p>
                    <p>Username: <code className="bg-blue-100 px-2 py-0.5 rounded">admin</code></p>
                    <p>Password: <code className="bg-blue-100 px-2 py-0.5 rounded">admin123</code></p>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                    Login as Admin
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}