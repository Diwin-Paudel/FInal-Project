import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, Clock, CheckCircle, Users, ArrowLeft, Phone, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

export default function OwnerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/owner/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/owner/orders");
      return await res.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "owner") {
    setLocation("/");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-green-100 text-green-800";
      case "picked": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatus = (currentStatus: string): string[] => {
    switch (currentStatus) {
      case "pending": return ["processing", "cancelled"];
      case "processing": return ["preparing", "cancelled"];
      case "preparing": return ["ready", "cancelled"];
      case "ready": return ["cancelled"]; // Ready orders wait for delivery partner
      default: return [];
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders?.filter(order => ["pending", "processing", "preparing"].includes(order.status)) || [];
  const readyOrders = orders?.filter(order => order.status === "ready") || [];
  const completedOrders = orders?.filter(order => ["picked", "delivered", "cancelled"].includes(order.status)) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/owner/home")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Orders</h1>
          <p className="text-gray-600">Manage incoming orders and update their status</p>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready</p>
                  <p className="text-2xl font-bold text-green-600">{readyOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{completedOrders.length}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Sections */}
        <div className="space-y-8">
          {/* Active Orders */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Orders</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order #{order.id}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Order Details</p>
                          <p>Total: NPR {order.total + order.deliveryFee}</p>
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Time: {formatDateTime(order.createdAt)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Customer Info</p>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{order.phone}</span>
                          </div>
                          <div className="flex items-start gap-1 mt-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{order.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Update Status:</span>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => 
                            updateOrderStatusMutation.mutate({ orderId: order.id, status: newStatus })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getNextStatus(order.status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ready for Pickup */}
          {readyOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ready for Pickup</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {readyOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order #{order.id}</span>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Order Details</p>
                          <p>Total: NPR {order.total + order.deliveryFee}</p>
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Ready since: {formatDateTime(order.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Customer Info</p>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{order.phone}</span>
                          </div>
                          <div className="flex items-start gap-1 mt-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{order.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Order is ready! Waiting for delivery partner to pick up.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Completed Orders */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Completed Orders</h2>
              <div className="space-y-2">
                {completedOrders.slice(0, 5).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">Order #{order.id}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            NPR {order.total + order.deliveryFee}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(order.updatedAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {orders && orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders from customers will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}