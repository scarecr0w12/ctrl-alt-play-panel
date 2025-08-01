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
  const [isValidating, setIsValidating] = useState(false);

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

  // Debug: Log all auth state changes
  useEffect(() => {
    console.log('🔄 [AUTH] AuthContext state changed:', {
      user: user ? { id: user.id, role: user.role, firstName: user.firstName } : null,
      loading,
      isAuthenticated: !!user
    });
  }, [user, loading]);

  const checkAuth = async () => {
    if (isValidating) {
      console.log('🔄 [AUTH] Validation already in progress, skipping');
      return;
    }
    
    try {
      setIsValidating(true);
      const token = Cookies.get('authToken');
      const userData = Cookies.get('user');
      
      if (token && userData) {
        // Validate token with backend
        try {
          const response = await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            // Token is invalid, clear cookies silently
            console.log('Token validation failed - clearing auth state');
            Cookies.remove('authToken');
            Cookies.remove('user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          }
        } catch (validationError) {
          // Token validation failed, clear cookies silently
          console.error('Token validation failed:', validationError);
          Cookies.remove('authToken');
          Cookies.remove('user');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      } else {
        // No token or user data, ensure clean state
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't call logout() here to avoid unnecessary redirects
      setUser(null);
    } finally {
      setLoading(false);
      setIsValidating(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 [AUTH] AuthContext login function called');
      setLoading(true);
      console.log('⏳ [AUTH] Auth loading set to true');
      
      console.log('📡 [AUTH] Making API call to /api/auth/login');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      console.log('📋 [AUTH] API Response received:', { status: response.status, success: response.data?.success });

      if (response.data.success) {
        console.log('✅ [AUTH] Login API call successful');
        const { token, user: userData } = response.data.data;
        console.log('📋 [AUTH] Extracted data:', { 
          tokenLength: token?.length, 
          userName: userData?.firstName,
          userRole: userData?.role 
        });
        
        console.log('🍪 [AUTH] Setting cookies...');
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
        console.log('✅ [AUTH] Cookies set successfully');

        console.log('🔑 [AUTH] Setting axios Authorization header');
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log('👤 [AUTH] Setting user state');
        setUser(userData);
        console.log('📊 [AUTH] User state set, isAuthenticated should now be:', !!userData);
        
        // Validate token with backend after login
        console.log('🔍 [AUTH] Starting post-login token validation');
        try {
          const validationResponse = await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ [AUTH] Post-login token validation successful:', validationResponse.data?.success);
        } catch (validationError) {
          console.error('❌ [AUTH] Post-login token validation failed:', validationError);
          // Even if validation fails, we'll still consider login successful
          // as the initial login was successful
        }
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
      const response = await axios.post('/api/auth/register', {
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
        // Validate token with backend after registration
        try {
          await axios.get('/api/auth/validate', {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (validationError) {
          console.error('Post-registration token validation failed:', validationError);
          // Even if validation fails, we'll still consider registration successful
          // as the initial registration was successful
        }
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
