
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/integrations/supabase/admin-client";
import { toast } from "@/components/ui/use-toast";

// Define constants for Supabase URL
const SUPABASE_URL = "https://tzihqfnkuyfgsjpetfzs.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWhxZm5rdXlmZ3NqcGV0ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzYzNjUsImV4cCI6MjA2MDMxMjM2NX0.aFvEeLvuOJ--JoRITqsKeety96Qcvl46aT1rHL1A7Ko";

// Define the user type
type User = {
  id: string;
  nationalNumber: string;
  fullName: string;
  profileComplete: boolean;
  isAdmin?: boolean; // Admin flag
};

// Define the auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (nationalNumber: string, password: string) => Promise<{ success: boolean; message: string }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('egov-user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Set the current user ID in Supabase session using fetch directly
        fetch(`${SUPABASE_URL}/functions/v1/set_claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({ 
            name: 'app.current_user_id', 
            value: parsedUser.nationalNumber 
          })
        }).catch(error => {
          console.error("Failed to set user claim", error);
        });
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('egov-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (nationalNumber: string, password: string) => {
    setLoading(true);
    
    try {
      // Call the Supabase function for custom login
      const { data, error } = await supabase.rpc('custom_login', {
        p_national_number: nationalNumber,
        p_password: password
      });
      
      if (error) {
        setLoading(false);
        return { success: false, message: error.message || 'Login failed' };
      }
      
      if (data && typeof data === 'object' && 'success' in data && data.success === true) {
        const userData: User = {
          id: data.national_number as string,
          nationalNumber: data.national_number as string,
          fullName: data.full_name as string,
          profileComplete: true,
        };
        
        setUser(userData);
        
        // Save user to localStorage
        localStorage.setItem('egov-user', JSON.stringify(userData));
        
        // Set the current user ID in Supabase session using fetch directly
        await fetch(`${SUPABASE_URL}/functions/v1/set_claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({ 
            name: 'app.current_user_id', 
            value: nationalNumber 
          })
        }).catch(error => {
          console.error("Failed to set user claim", error);
        });
        
        setLoading(false);
        return { success: true, message: 'Login successful' };
      } else {
        setLoading(false);
        return { 
          success: false, 
          message: data && typeof data === 'object' && 'message' in data 
            ? String(data.message) 
            : 'Invalid credentials' 
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  // Updated admin login function to use the new admin_users table
  const adminLogin = async (username: string, password: string) => {
    setLoading(true);
    
    try {
      // Check admin credentials against admin_users table
      const { data, error } = await adminSupabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.error("Admin login error:", error);
        setLoading(false);
        return { success: false, message: 'Login failed. Please try again.' };
      }
      
      if (data) {
        // Admin login successful
        const adminData: User = {
          id: username,
          nationalNumber: username, // Using username as ID for admins
          fullName: data.full_name,
          profileComplete: true,
          isAdmin: true
        };
        
        setUser(adminData);
        
        // Save admin user to localStorage
        localStorage.setItem('egov-user', JSON.stringify(adminData));
        
        // Set admin claim in Supabase session
        await fetch(`${SUPABASE_URL}/functions/v1/set_claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
          },
          body: JSON.stringify({ 
            name: 'app.is_admin', 
            value: true 
          })
        }).catch(error => {
          console.error("Failed to set admin claim", error);
        });
        
        setLoading(false);
        toast({
          title: "Admin Login Successful",
          description: `Welcome, ${data.full_name}!`,
        });
        return { success: true, message: 'Admin login successful' };
      } else {
        setLoading(false);
        return { success: false, message: 'Invalid admin credentials' };
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setLoading(false);
      return { success: false, message: 'Admin login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('egov-user');
    
    // Clear the current user ID in Supabase session using fetch directly
    fetch(`${SUPABASE_URL}/functions/v1/set_claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ 
        name: 'app.current_user_id', 
        value: null 
      })
    }).catch(error => {
      console.error("Failed to clear user claim", error);
    });
    
    // Clear admin claim if present
    fetch(`${SUPABASE_URL}/functions/v1/set_claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({ 
        name: 'app.is_admin', 
        value: null 
      })
    }).catch(error => {
      console.error("Failed to clear admin claim", error);
    });
  };

  const value = {
    user,
    loading,
    login,
    adminLogin,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
