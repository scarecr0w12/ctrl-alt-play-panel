import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER' | 'MODERATOR';
  isActive: boolean;
  rootAdmin?: boolean;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('authToken');
      const userData = Cookies.get('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // Store token and user data in secure cookies
        Cookies.set('authToken', token, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set('user', JSON.stringify(userData), { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        toast.success(`Welcome back, ${userData.firstName}!`);
        return true;
      } else {
        toast.error(response.data.message || 'Login failed');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/register`, {
        username,
        email,
        password
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        // Store token and user data in secure cookies
        Cookies.set('authToken', token, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set('user', JSON.stringify(userData), { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        toast.success(`Welcome to Ctrl+Alt+Play, ${userData.firstName}!`);
        return true;
      } else {
        toast.error(response.data.message || 'Registration failed');
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove cookies
    Cookies.remove('authToken');
    Cookies.remove('user');
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
