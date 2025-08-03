import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { UserWithRole, Login, CustomerRegister, RestaurantRegister, PartnerRegister } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: UserWithRole | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserWithRole, Error, Login>;
  logoutMutation: UseMutationResult<void, Error, void>;
  customerRegisterMutation: UseMutationResult<UserWithRole, Error, CustomerRegister>;
  ownerRegisterMutation: UseMutationResult<UserWithRole, Error, RestaurantRegister>;
  partnerRegisterMutation: UseMutationResult<UserWithRole, Error, PartnerRegister>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserWithRole | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Login) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserWithRole) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on user role
      switch (user.role) {
        case "customer":
          setLocation("/customer/home");
          break;
        case "owner":
          setLocation("/owner/home");
          break;
        case "admin":
          setLocation("/admin");
          break;
        case "partner":
          setLocation("/partner/home");
          break;
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const customerRegisterMutation = useMutation({
    mutationFn: async (data: CustomerRegister) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "customer"
      });
      return await res.json();
    },
    onSuccess: (user: UserWithRole) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/customer/home");
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const ownerRegisterMutation = useMutation({
    mutationFn: async (data: RestaurantRegister) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "owner"
      });
      return await res.json();
    },
    onSuccess: (user: UserWithRole) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/owner/home");
      toast({
        title: "Registration successful",
        description: `Your restaurant registration has been submitted for review.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const partnerRegisterMutation = useMutation({
    mutationFn: async (data: PartnerRegister) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "partner"
      });
      return await res.json();
    },
    onSuccess: (user: UserWithRole) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation("/partner/home");
      toast({
        title: "Registration successful",
        description: `Welcome to our delivery partner team, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        customerRegisterMutation,
        ownerRegisterMutation,
        partnerRegisterMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
