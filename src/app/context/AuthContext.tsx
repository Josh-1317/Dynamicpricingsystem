import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbQuery } from '../../utils/api';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    role: 'admin' | 'client';
    mobile?: string;
    email?: string;
}

interface AuthContextType {
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (mobile: string, otp: string) => Promise<boolean>;
    loginClient: (name: string, mobile: string) => Promise<boolean>;
    loginAdmin: (username: string, password: string) => Promise<boolean>;
    sendOtp: (mobile: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // Check local storage for persistent session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // FORCE LOGOUT if using old incomplete ID format (crucial fix for user)
                if (parsedUser.id.startsWith('user-')) {
                    console.log('Clearing old session format');
                    localStorage.removeItem('user');
                    return;
                }
                setCurrentUser(parsedUser);
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const sendOtp = async (mobile: string): Promise<boolean> => {
        try {
            const result = await dbQuery('/auth/login', 'POST', { mobile });
            if (result.success) {
                toast.success(`OTP Sent. (Dev: ${result.debug_otp || '1234'})`);
                return true;
            } else {
                toast.error(result.message || 'Failed to send OTP');
                return false;
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            toast.error('Error sending OTP');
            return false;
        }
    };

    const login = async (mobile: string, otp: string): Promise<boolean> => {
        try {
            const result = await dbQuery('/auth/verify-otp', 'POST', { mobile, otp });
            if (result.success && result.user) {
                setCurrentUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                toast.success('Login successful');
                return true;
            } else {
                toast.error(result.message || 'Invalid OTP');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed');
            return false;
        }
    };

    const loginClient = async (name: string, mobile: string): Promise<boolean> => {
        if (!name || !mobile) {
            toast.error('Name and Mobile required');
            return false;
        }

        try {
            // Check if client exists
            // We read all orders/clients to find match (simplified for this architecture)
            // Ideally we'd have a /clients endpoint, assuming we can search via existing data structure
            // Since we can't easily access useApp here, we'll try to use a deterministic ID based on mobile for simplified persistence
            // OR better: search the 'orders' table for this mobile? No, 'clients' table might exist?
            // Let's use a stable hash or search:

            // Attempt to find client in DB (if stored)
            // For now, let's just make sure we don't overwrite if we can help it, 
            // but effectively we need a stable ID. 
            // Let's use mobile as part of ID to make it semi-stable if we re-login?
            // Actually, we should try to fetch the client list.

            // Fallback: Generate ID based on mobile number (simple hash)
            // const stableId = `CLI-${mobile.replace(/\D/g, '')}`; 
            // But we should try to use the actual DB if possible.

            const user: User = {
                id: `CLI-${mobile.replace(/\D/g, '')}`, // Use mobile as stable ID key
                name: name,
                role: 'client',
                mobile: mobile
            };

            setCurrentUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Login successful');
            return true;
        } catch (error) {
            console.error('Login error', error);
            return false;
        }
    };

    const loginAdmin = async (username: string, password: string): Promise<boolean> => {
        // Mock admin login
        if (username === 'admin' && password === 'admin123') {
            const adminUser: User = { role: 'admin', id: 'admin-1', name: 'Admin User' };
            setCurrentUser(adminUser);
            localStorage.setItem('user', JSON.stringify(adminUser));
            toast.success('Admin login successful');
            return true;
        }
        toast.error('Invalid admin credentials');
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('user');
        toast.info('Logged out');
    };

    const checkAuth = async () => {
        // Optional: Validate token with backend if needed
    };

    return (
        <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, login, loginClient, loginAdmin, sendOtp, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
