import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Users, 
  Store, 
  Truck, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle,
  LogOut,
  Bell,
  Search
} from "lucide-react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import RestaurantRequest from "@/components/admin/restaurant-request";
import ActivityItem from "@/components/admin/activity-item";
import StatCard from "@/components/admin/stat-card";
import { Restaurant, Order, User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function AdminHome() {
  const { user, logoutMutation } = useAuth();
  
  // Fetch all data needed for admin dashboard
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });
  
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user || user.role !== "admin") return null;

  // Calculate statistics
  const totalRestaurants = restaurants?.length || 0;
  const pendingRestaurants = restaurants?.filter(r => r.status === "pending").length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const totalCustomers = users?.filter(u => u.role === "customer").length || 0;
  const totalPartners = users?.filter(u => u.role === "partner").length || 0;

  // Recent activity from actual data
  const recentActivities = [
    ...(restaurants?.filter(r => r.status === "pending").slice(0, 2).map(restaurant => ({
      type: "restaurant" as const,
      title: "New Restaurant Application",
      description: `${restaurant.name} submitted registration request`,
      timestamp: new Date(restaurant.createdAt || new Date()),
      status: "pending",
      user: restaurant.name
    })) || []),
    ...(orders?.slice(0, 2).map(order => ({
      type: "order" as const,
      title: "Recent Order",
      description: `Order #${order.id} - NPR ${order.total}`,
      timestamp: new Date(order.createdAt || new Date()),
      status: order.status || "unknown",
      user: `Customer ${order.customerId}`
    })) || [])
  ].slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content - Using fixed margin that works with sidebar transitions */}
      <div className="flex-1 overflow-auto" style={{ marginLeft: '256px' }}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Monitor and manage your food delivery platform</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search anything..." 
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Restaurants"
              value={totalRestaurants}
              icon={Store}
              color="text-blue-600"
              bgColor="bg-blue-50"
              description={pendingRestaurants > 0 ? `${pendingRestaurants} pending approval` : "All approved"}
            />
            <StatCard
              title="Total Orders"
              value={totalOrders}
              icon={ShoppingBag}
              color="text-green-600"
              bgColor="bg-green-50"
              description="All time orders"
            />
            <StatCard
              title="Total Revenue"
              value={formatCurrency(totalRevenue)}
              icon={TrendingUp}
              color="text-purple-600"
              bgColor="bg-purple-50"
              description="Platform earnings"
            />
            <StatCard
              title="Active Users"
              value={totalCustomers + totalPartners}
              icon={Users}
              color="text-orange-600"
              bgColor="bg-orange-50"
              description={`${totalCustomers} customers, ${totalPartners} partners`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-auto">
                  {recentActivities.map((activity, index) => (
                    <ActivityItem key={index} {...activity} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Restaurant Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Pending Restaurant Requests
                  </span>
                  <Badge variant="secondary">
                    {pendingRestaurants}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-auto">
                  {isLoadingRestaurants ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : restaurants && restaurants.filter(r => r.status === "pending").length > 0 ? (
                    <div className="p-4 space-y-4">
                      {restaurants.filter(r => r.status === "pending").map(restaurant => (
                        <RestaurantRequest key={restaurant.id} restaurant={restaurant} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No pending restaurant requests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-20 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Store className="h-6 w-6" />
                <span>View Restaurants</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Truck className="h-6 w-6" />
                <span>Manage Partners</span>
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}