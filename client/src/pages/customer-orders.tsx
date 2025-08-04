import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  ArrowLeft,
  X,
  RefreshCw,
} from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";

export default function CustomerOrders() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery<Order[]>({
    queryKey: ["/api/customer/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customer/orders");
      return await res.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, {
        status: "cancelled",
        reason: "Cancelled by customer",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canCancelOrder = (status: string | null) => {
    if (!status) return false;
    return ["pending", "processing"].includes(status);
  };

  if (!user || user.role !== "customer") {
    setLocation("/");
    return null;
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "picked":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return Clock;
    switch (status) {
      case "pending":
      case "processing":
        return Clock;
      case "preparing":
        return ShoppingBag;
      case "ready":
      case "picked":
        return Truck;
      case "delivered":
        return CheckCircle;
      case "cancelled":
        return X;
      default:
        return Clock;
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/customer/home")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-gray-600">Track your food delivery orders</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Updating..." : "Refresh"}
          </Button>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        Order #{order.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status || "unknown"}
                        </Badge>
                        {canCancelOrder(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            disabled={cancelOrderMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-cancel-order-${order.id}`}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Order Details
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>Total:</strong> NPR{" "}
                            {order.total + order.deliveryFee}
                          </p>
                          <p>
                            <strong>Payment:</strong> {order.paymentMethod}
                          </p>
                          <p>
                            <strong>Ordered:</strong>{" "}
                            {formatDateTime(order.createdAt)}
                          </p>
                          {order.estimatedDeliveryTime && (
                            <p>
                              <strong>Est. Delivery:</strong>{" "}
                              {order.estimatedDeliveryTime} mins
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Delivery Address
                        </h4>
                        <p className="text-sm text-gray-600">{order.address}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Phone:</strong> {order.phone}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Order Status
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.status &&
                                [
                                  "pending",
                                  "processing",
                                  "preparing",
                                  "ready",
                                  "picked",
                                  "delivered",
                                ].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span>Order Confirmed</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.status &&
                                [
                                  "processing",
                                  "preparing",
                                  "ready",
                                  "picked",
                                  "delivered",
                                ].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span>Being Prepared</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.status &&
                                ["ready", "picked", "delivered"].includes(
                                  order.status
                                )
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span>Ready for Pickup</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.status &&
                                ["picked", "delivered"].includes(order.status)
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span>Out for Delivery</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                order.status === "delivered"
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span>Delivered</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {order.cancelReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Cancellation Reason:</strong>{" "}
                          {order.cancelReason}
                        </p>
                      </div>
                    )}

                    {order.actualDeliveryTime &&
                      order.status === "delivered" && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Delivered in {order.actualDeliveryTime} minutes
                          </p>
                        </div>
                      )}

                    {order.status === "cancelled" && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <X className="h-4 w-4 inline mr-1" />
                          This order has been cancelled
                          {order.cancelReason && `: ${order.cancelReason}`}
                        </p>
                      </div>
                    )}

                    {order.status === "ready" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Your order is ready for pickup! A delivery partner
                          will be assigned soon.
                        </p>
                      </div>
                    )}

                    {order.status === "picked" && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <Truck className="h-4 w-4 inline mr-1" />
                          Your order is on the way! It should arrive in{" "}
                          {order.estimatedDeliveryTime || 30} minutes.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                When you place orders, they'll appear here
              </p>
              <Button onClick={() => setLocation("/customer/home")}>
                Browse Restaurants
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
