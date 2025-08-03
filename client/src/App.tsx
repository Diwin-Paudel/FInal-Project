import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

// Pages
import RoleSelection from "@/pages/role-selection";
import CustomerAuth from "@/pages/customer-auth";
import CustomerHome from "@/pages/customer-home";
import OwnerAuth from "@/pages/owner-auth";
import OwnerHome from "@/pages/owner-home";
import AdminAuth from "@/pages/admin-auth";
import AdminHome from "@/pages/admin-home";
import AdminRestaurants from "@/pages/admin-restaurants";
import AdminCustomers from "@/pages/admin-customers";
import AdminPartners from "@/pages/admin-partners";
import AdminOrders from "@/pages/admin-orders";
import AdminAnalytics from "@/pages/admin-analytics";
import AdminSettings from "@/pages/admin-settings";
import AdminProfile from "@/pages/admin-profile";
import PartnerAuth from "@/pages/partner-auth";
import PartnerHome from "@/pages/partner-home";
import ProfileEdit from "@/pages/profile-edit";
import OwnerRestaurantEdit from "@/pages/owner-restaurant-edit";

import CustomerOrders from "@/pages/customer-orders";
import CustomerRestaurant from "@/pages/customer-restaurant";
import OwnerMenuManagement from "@/pages/owner-menu-management";
import OwnerOrders from "@/pages/owner-orders";
import PartnerOrders from "@/pages/partner-orders";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={RoleSelection} />
      <Route path="/customer/auth" component={CustomerAuth} />
      <Route path="/owner/auth" component={OwnerAuth} />
      <Route path="/admin/auth" component={AdminAuth} />
      <Route path="/partner/auth" component={PartnerAuth} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/customer/home" component={CustomerHome} role="customer" />
      <ProtectedRoute path="/owner/home" component={OwnerHome} role="owner" />
      <ProtectedRoute path="/admin" component={AdminHome} role="admin" />
      <ProtectedRoute path="/admin/restaurants" component={AdminRestaurants} role="admin" />
      <ProtectedRoute path="/admin/customers" component={AdminCustomers} role="admin" />
      <ProtectedRoute path="/admin/partners" component={AdminPartners} role="admin" />
      <ProtectedRoute path="/admin/orders" component={AdminOrders} role="admin" />
      <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} role="admin" />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} role="admin" />
      <ProtectedRoute path="/admin/profile" component={AdminProfile} role="admin" />
      <ProtectedRoute path="/partner/home" component={PartnerHome} role="partner" />
      <ProtectedRoute path="/profile/edit" component={ProfileEdit} role={["customer", "owner", "admin", "partner"]} />
      <ProtectedRoute path="/owner/restaurant/edit" component={OwnerRestaurantEdit} role="owner" />

      <ProtectedRoute path="/customer/orders" component={CustomerOrders} role="customer" />
      <ProtectedRoute path="/customer/restaurant/:id" component={CustomerRestaurant} role="customer" />
      <ProtectedRoute path="/owner/menu" component={OwnerMenuManagement} role="owner" />
      <ProtectedRoute path="/owner/orders" component={OwnerOrders} role="owner" />
      <ProtectedRoute path="/partner/orders" component={PartnerOrders} role="partner" />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
