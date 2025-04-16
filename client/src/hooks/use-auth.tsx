import { createContext, ReactNode, useContext, useEffect, useCallback } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Response type from the updated /api/user endpoint
interface AuthResponse {
  authenticated: boolean;
  user?: Omit<SelectUser, 'password'>;
  message?: string;
}

// Context type with better typing
type AuthContextType = {
  user: (SelectUser | Omit<SelectUser, 'password'>) | null;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => void; 
  loginMutation: UseMutationResult<SelectUser | Omit<SelectUser, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser | Omit<SelectUser, 'password'>, Error, RegisterData>;
};

// Login credentials
type LoginData = {
  username: string;
  password: string;
};

// Registration data
type RegisterData = {
  username: string;
  password: string;
  name: string;
  accountId: number;
};

// Create auth context
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication Provider Component
 * Handles user authentication state and operations
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast(); 
  const [location, navigate] = useLocation();

  // Custom query function to handle the new response format
  const authQueryFn = useCallback(async ({ queryKey }: { queryKey: string[] }) => {
    try {
      const timestamp = new Date().getTime();
      const url = `${queryKey[0]}?_t=${timestamp}`;
      
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        cache: "no-cache"
      });
      
      if (res.status === 401) {
        // Return null for unauthorized to prevent loops
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`Auth error: ${res.status} ${res.statusText}`);
      }
      
      const data: AuthResponse = await res.json();
      
      // Check if we got the new response format or the old format
      if (data.hasOwnProperty('authenticated')) {
        return data.authenticated && data.user ? data.user : null;
      } else {
        // Handle the old format which directly returns the user
        return data as unknown as SelectUser;
      }
    } catch (error) {
      console.error("Auth query error:", error);
      return null;
    }
  }, []);

  // User authentication query with the custom function
  const userQuery = useQuery({
    queryKey: ["/api/user"],
    queryFn: authQueryFn,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30 * 1000, // 30 seconds
  });
  
  const user = userQuery.data;
  const error = userQuery.error;
  const isLoading = userQuery.isLoading; 
  const refetchUser = userQuery.refetch;

  // Effect to redirect to login page if unauthenticated and not on auth-related pages
  useEffect(() => {
    // Array of public routes that can be accessed without authentication
    const publicRoutes = ["/auth", "/forgot-password", "/reset-password"];
    const isPublicRoute = publicRoutes.some(route => 
      location === route || location.startsWith(route + "?")
    );
    
    if (!isLoading && !user && !isPublicRoute) {
      console.log("Auth effect: No user detected, redirecting to login");
      navigate("/auth");
    }
  }, [user, isLoading, location, navigate]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Immediately update query cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force a refetch to confirm session is established
      setTimeout(() => {
        refetchUser();
        // Also force refetch of any dependent resources
        queryClient.invalidateQueries({queryKey: ["/api/campaigns"]});
        queryClient.invalidateQueries({queryKey: ["/api/contacts"]});
        queryClient.invalidateQueries({queryKey: ["/api/analytics"]});
      }, 100);
      
      // Navigate and show toast
      navigate("/");
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    },
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Update query cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force a refetch
      setTimeout(() => {
        refetchUser();
      }, 100);
      
      // Navigate and show toast
      navigate("/");
      toast({
        title: "Registration successful",
        description: `Welcome to CampaignHub, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all query cache for security
      queryClient.clear();
      
      // Update user query cache specifically
      queryClient.setQueryData(["/api/user"], null);
      
      // Navigate and show toast
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout issue",
        description: "You've been logged out, but there was an issue: " + error.message,
        variant: "destructive",
      });
      // Force navigate to login even if there's an error
      queryClient.setQueryData(["/api/user"], null);
      navigate("/auth");
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        refetchUser,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
