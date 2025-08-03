import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Clock, MapPin, Phone, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderManagementProps {
  orders: Order[];
}

export default function OrderManagement({ orders }: OrderManagementProps) {
  const { toast } = useToast();

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-purple-100 text-purple-800";
      case "picked": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending":
        return ["processing", "cancelled"];
      case "processing":
        return ["preparing", "cancelled"];
      case "preparing":
        return ["ready", "cancelled"];
      case "ready":
        return ["picked"];
      case "picked":
        return ["delivered"];
      default:
        return [];
    }
  };

  const handleStatusUpdate = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-lg text-gray-900 mb-2">No Orders Yet</h3>
        <p className="text-gray-600">When customers place orders, they will appear here.</p>
      </div>
    );
  }

  // Group orders by status
  const groupedOrders = orders.reduce((groups, order) => {
    const status = order.status || "pending";
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(order);
    return groups;
  }, {} as Record<string, Order[]>);

  return (
    <div className="space-y-6">
      {/* Active Orders */}
      {["pending", "processing", "preparing", "ready"].map(status => {
        const statusOrders = groupedOrders[status] || [];
        if (statusOrders.length === 0) return null;

        return (
          <div key={status}>
            <h3 className="text-lg font-semibold mb-3 capitalize">
              {status} Orders ({statusOrders.length})
            </h3>
            <div className="grid gap-4">
              {statusOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">Order #{order.id}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt || new Date()).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status || "pending")}>
                          {(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
                        </Badge>
                        <span className="font-bold">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Customer ID: {order.customerId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{order.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{order.phone}</span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Payment:</span> {
                          order.paymentMethod === "cash" ? "Cash on Delivery" : 
                          order.paymentMethod === "esewa" ? "eSewa" : "Khalti"
                        }
                      </div>

                      {order.estimatedDeliveryTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Est. delivery: {order.estimatedDeliveryTime} minutes</span>
                        </div>
                      )}

                      {/* Status Update */}
                      {getAvailableStatuses(order.status || "pending").length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Update Status:</span>
                            <Select 
                              onValueChange={(value) => handleStatusUpdate(order.id, value)}
                              disabled={updateOrderMutation.isPending}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableStatuses(order.status || "pending").map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Completed/Cancelled Orders */}
      {(groupedOrders.delivered || groupedOrders.cancelled) && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Completed Orders ({(groupedOrders.delivered?.length || 0) + (groupedOrders.cancelled?.length || 0)})
          </h3>
          <div className="grid gap-4">
            {[...(groupedOrders.delivered || []), ...(groupedOrders.cancelled || [])].map((order) => (
              <Card key={order.id} className="opacity-75">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Order #{order.id}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt || new Date()).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status || "pending")}>
                        {(order.status || "pending").charAt(0).toUpperCase() + (order.status || "pending").slice(1)}
                      </Badge>
                      <p className="font-bold mt-1">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  {order.cancelReason && (
                    <p className="text-sm text-red-600 mt-2">
                      <span className="font-medium">Cancelled:</span> {order.cancelReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}