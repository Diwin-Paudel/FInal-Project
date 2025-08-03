import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, MapPin, Phone, Clock, CheckCircle, ArrowLeft, Package } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

export default function PartnerOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch available orders (ready for pickup)
  const { data: availableOrders, isLoading: loadingAvailable } = useQuery<Order[]>({
    queryKey: ["/api/partner/available-orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/partner/available-orders");
      return await res.json();
    },
  });

  // Fetch partner's assigned orders
  const { data: myOrders, isLoading: loadingMy } = useQuery<Order[]>({
    queryKey: ["/api/partner/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/partner/orders");
      return await res.json();
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status: "picked" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Accepted",
        description: "You have accepted the delivery order.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Accept Order",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deliverOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status: "delivered" });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Delivered",
        description: "Order has been marked as delivered successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Mark as Delivered",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "partner") {
    setLocation("/");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800";
      case "picked": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const calculateDistance = (address: string) => {
    // Would use real maps API in production
    return "~";
  };

  const isLoading = loadingAvailable || loadingMy;

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

  const activeOrders = myOrders?.filter(order => order.status === "picked") || [];
  const completedOrders = myOrders?.filter(order => order.status === "delivered") || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/partner/home")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Delivery Orders</h1>
          <p className="text-gray-600">Accept and deliver food orders to customers</p>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Orders</p>
                  <p className="text-2xl font-bold text-green-600">{availableOrders?.length || 0}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Deliveries</p>
                  <p className="text-2xl font-bold text-purple-600">{activeOrders.length}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-blue-600">{completedOrders.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Available Orders */}
          {availableOrders && availableOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Available for Pickup</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order #{order.id}</span>
                        <Badge className={getStatusColor(order.status || "ready")}>
                          {order.status || "ready"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Order Details</p>
                          <p>Total: NPR {order.total + order.deliveryFee}</p>
                          <p>Delivery Fee: NPR {order.deliveryFee}</p>
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Ready since: {formatDateTime(order.updatedAt)}</p>
                        </div>
                        <div>
                          <p className="font-medium">Restaurant</p>
                          <p className="text-sm">{(order as any).restaurantName || 'Restaurant'}</p>
                          <p className="text-xs text-gray-500">{(order as any).restaurantLocation || ''}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium">Customer Delivery</p>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="text-sm">{order.phone}</span>
                          </div>
                          <div className="flex items-start gap-1 mt-1">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{order.address}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Distance: {calculateDistance(order.address)} km
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => acceptOrderMutation.mutate(order.id)}
                        disabled={acceptOrderMutation.isPending}
                        className="w-full"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        {acceptOrderMutation.isPending ? "Accepting..." : "Accept Delivery"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active Deliveries */}
          {activeOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Active Deliveries</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order #{order.id}</span>
                        <Badge className={getStatusColor(order.status || "picked")}>
                          Out for Delivery
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Order Details</p>
                          <p>Total: NPR {order.total + order.deliveryFee}</p>
                          <p>Your Fee: NPR {order.deliveryFee}</p>
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Picked up: {formatDateTime(order.updatedAt)}</p>
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

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-purple-800">
                          <Truck className="h-4 w-4 inline mr-1" />
                          Order is with you for delivery
                        </p>
                      </div>

                      <Button
                        onClick={() => deliverOrderMutation.mutate(order.id)}
                        disabled={deliverOrderMutation.isPending}
                        className="w-full"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {deliverOrderMutation.isPending ? "Marking as Delivered..." : "Mark as Delivered"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Completed Deliveries */}
          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Deliveries</h2>
              <div className="space-y-2">
                {completedOrders.slice(0, 5).map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">Order #{order.id}</span>
                          <Badge className={getStatusColor(order.status || "delivered")}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Delivered
                          </Badge>
                          <span className="text-sm text-gray-600">
                            Earned: NPR {order.deliveryFee}
                          </span>
                          {order.actualDeliveryTime && (
                            <span className="text-sm text-gray-500">
                              ({order.actualDeliveryTime} mins)
                            </span>
                          )}
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

        {/* Empty States */}
        {(!availableOrders || availableOrders.length === 0) && activeOrders.length === 0 && completedOrders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders available</h3>
              <p className="text-gray-600">Check back later for delivery opportunities</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}