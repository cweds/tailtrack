import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage and validate against API
    const validateUser = async () => {
      try {
        const savedUser = localStorage.getItem('dog-care-user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            
            // Validate user still exists in database with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`/api/users/${userData.id}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const result = await response.json();
              // Ensure date fields are properly converted to Date objects
              if (result.user) {
                const user = {
                  ...result.user,
                  createdAt: new Date(result.user.createdAt),
                  updatedAt: result.user.updatedAt ? new Date(result.user.updatedAt) : null
                };
                setUser(user);
              }
            } else if (response.status === 404) {
              // User no longer exists, clear localStorage
              localStorage.removeItem('dog-care-user');
              setUser(null);
            } else {
              // Other error, clear user to force re-login
              localStorage.removeItem('dog-care-user');
              setUser(null);
            }
          } catch (error) {
            // User validation failed - clear localStorage and force re-login
            localStorage.removeItem('dog-care-user');
            setUser(null);
          }
        } else {
          // No saved user
          setUser(null);
        }
      } catch (error) {
        // Fallback: always clear user and stop loading on any error
        localStorage.removeItem('dog-care-user');
        setUser(null);
      } finally {
        // Always stop loading, even if there's an error
        setIsLoading(false);
      }
    };

    validateUser();
    
    // Set up periodic user validation to detect when user is removed from household
    const interval = setInterval(() => {
      if (user?.id) {
        refreshUser();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('dog-care-user', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dog-care-user');
  };

  const refreshUser = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          // Force complete state refresh if household status changed
          if (user.householdId !== userData.user.householdId) {
            localStorage.removeItem('dog-care-user');
            setUser(null);
            setTimeout(() => {
              setUser(userData.user);
              localStorage.setItem('dog-care-user', JSON.stringify(userData.user));
            }, 100);
          } else {
            setUser(userData.user);
            localStorage.setItem('dog-care-user', JSON.stringify(userData.user));
          }
        }
      } catch (error) {
        // User refresh failed silently
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}