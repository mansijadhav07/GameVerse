import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  walletBalance: number;
  updateUserBalance: (newBalance: number) => void;
  addFunds: (amount: number) => Promise<void>; // Function to add funds
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: { user: User; exp: number } = jwtDecode(token);
        if (Date.now() >= decoded.exp * 1000) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded.user);
          fetchWalletBalance(token);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);
  
  const fetchWalletBalance = async (token: string) => {
      try {
          const response = await axios.get('http://localhost:3001/api/user/wallet', {
              headers: { Authorization: `Bearer ${token}` }
          });
          setWalletBalance(Number(response.data.wallet_balance));
      } catch (error) {
          console.error("Failed to fetch wallet balance", error);
      }
  }

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded: { user: User } = jwtDecode(token);
    setUser(decoded.user);
    fetchWalletBalance(token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setWalletBalance(0);
    window.location.href = '/login';
  };
  
  const updateUserBalance = (newBalance: number) => {
      setWalletBalance(newBalance);
  }

  // NEW: Function to add funds by calling the backend
  const addFunds = async (amount: number) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication token not found.");
      
      const response = await axios.post(
          'http://localhost:3001/api/user/wallet/add',
          { amount },
          { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update the local state with the new balance from the server's response
      setWalletBalance(response.data.newBalance);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, walletBalance, updateUserBalance, addFunds }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

