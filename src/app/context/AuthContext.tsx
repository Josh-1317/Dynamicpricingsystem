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

    // useEffect(() => {
    //     // Check local storage for persistent session
    //     // const storedUser = localStorage.getItem('user');
    //     // if (storedUser) {
    //     //     setCurrentUser(JSON.parse(storedUser));
    //     // }
    // }, []);

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
        // Simple login without OTP
        if (name && mobile) {
            const user: User = {
                id: 'user-' + Date.now(),
                name: name,
                role: 'client',
                mobile: mobile
            };
            setCurrentUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Login successful');
            return true;
        }
        toast.error('Name and Mobile required');
        return false;
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
