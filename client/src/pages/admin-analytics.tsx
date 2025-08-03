import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Restaurant, Order, User } from "@shared/schema";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Store,
  Clock
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("30d");

  // Fetch all data needed for analytics
  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    queryFn: async () => {
      const res = await fetch("/api/restaurants", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      return await res.json();
    },
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return await res.json();
    },
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
  });

  if (!user || user.role !== "admin") return null;

  const isLoading = isLoadingRestaurants || isLoadingOrders || isLoadingUsers;

  // Calculate analytics metrics
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
  const totalOrders = orders?.length || 0;
  const totalCustomers = users?.filter(u => u.role === "customer").length || 0;
  const totalRestaurants = restaurants?.length || 0;
  const activeRestaurants = restaurants?.filter(r => r.status === "open").length || 0;
  const pendingRestaurants = restaurants?.filter(r => r.status === "pending").length || 0;

  // Order status distribution
  const ordersByStatus = {
    pending: orders?.filter(o => o.status === "pending").length || 0,
    processing: orders?.filter(o => o.status === "processing").length || 0,
    preparing: orders?.filter(o => o.status === "preparing").length || 0,
    ready: orders?.filter(o => o.status === "ready").length || 0,
    picked: orders?.filter(o => o.status === "picked").length || 0,
    delivered: orders?.filter(o => o.status === "delivered").length || 0,
    cancelled: orders?.filter(o => o.status === "cancelled").length || 0,
  };

  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Top performing metrics
  const deliveryRate = totalOrders > 0 ? (ordersByStatus.delivered / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (ordersByStatus.cancelled / totalOrders) * 100 : 0;

  const analyticsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12.5%",
      changeType: "increase" as const,
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+8.2%",
      changeType: "increase" as const,
    },
    {
      title: "Active Customers",
      value: totalCustomers.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+5.1%",
      changeType: "increase" as const,
    },
    {
      title: "Active Restaurants",
      value: `${activeRestaurants}/${totalRestaurants}`,
      icon: Store,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+2.3%",
      changeType: "increase" as const,
    },
  ];

  const performanceMetrics = [
    {
      title: "Average Order Value",
      value: formatCurrency(averageOrderValue),
      description: "Per order average",
    },
    {
      title: "Delivery Success Rate",
      value: `${deliveryRate.toFixed(1)}%`,
      description: "Orders successfully delivered",
    },
    {
      title: "Cancellation Rate",
      value: `${cancellationRate.toFixed(1)}%`,
      description: "Orders cancelled",
    },
    {
      title: "Restaurant Approval Rate",
      value: totalRestaurants > 0 ? `${((activeRestaurants / totalRestaurants) * 100).toFixed(1)}%` : "0%",
      description: "Restaurants approved",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Platform performance and insights</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {analyticsCards.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                            <p className="text-2xl font-bold">{metric.value}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {metric.changeType === "increase" ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span className={`text-xs ${metric.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
                                {metric.change}
                              </span>
                            </div>
                          </div>
                          <div className={`p-3 rounded-full ${metric.bgColor}`}>
                            <Icon className={`h-6 w-6 ${metric.color}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      Order Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(ordersByStatus).map(([status, count]) => {
                        const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-sm capitalize">{status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{count}</Badge>
                              <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{metric.title}</p>
                            <p className="text-xs text-gray-600">{metric.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{metric.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Restaurant Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Restaurant Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{activeRestaurants}</div>
                      <div className="text-sm text-green-700">Active Restaurants</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{pendingRestaurants}</div>
                      <div className="text-sm text-yellow-700">Pending Approval</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{totalRestaurants}</div>
                      <div className="text-sm text-gray-700">Total Registered</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}