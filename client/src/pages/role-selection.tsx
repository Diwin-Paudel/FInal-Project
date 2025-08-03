import { useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import RoleCard from "@/components/ui/role-card";
import { Loader2 } from "lucide-react";

export default function RoleSelection() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect logged-in users to their respective home pages
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "customer":
          setLocation("/customer/home");
          break;
        case "owner":
          setLocation("/owner/home");
          break;
        case "admin":
          setLocation("/admin/home");
          break;
        case "partner":
          setLocation("/partner/home");
          break;
      }
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="bg-white py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-heading font-semibold text-neutral-dark text-center">FoodExpress</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h2 className="text-2xl font-heading font-semibold text-neutral-dark mb-6 text-center">Choose Your Role</h2>
            <p className="text-neutral-medium mb-8 text-center">Log in or register based on how you'll use the platform</p>
            
            <div className="space-y-4">
              <RoleCard 
                role="customer"
                title="Customer"
                description="Order food from your favorite restaurants"
                icon="person"
                onClick={() => setLocation("/customer/auth")}
              />
              
              <RoleCard 
                role="owner"
                title="Restaurant Owner"
                description="Manage your restaurant and food listings"
                icon="restaurant"
                onClick={() => setLocation("/owner/auth")}
              />
              
              <RoleCard 
                role="admin"
                title="Administrator"
                description="Control and manage platform operations"
                icon="admin_panel_settings"
                onClick={() => setLocation("/admin/auth")}
              />
              
              <RoleCard 
                role="partner"
                title="Delivery Partner"
                description="Deliver orders and earn money"
                icon="delivery_dining"
                onClick={() => setLocation("/partner/auth")}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
