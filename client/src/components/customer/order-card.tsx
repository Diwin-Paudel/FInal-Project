import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Clock, Phone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { toast } = useToast();

  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/orders/${order.id}/status`, {
        status: "cancelled",
        reason: "Cancelled by customer"
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel order",
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Order Placed";
      case "processing": return "Processing";
      case "preparing": return "Being Prepared";
      case "ready": return "Ready for Pickup";
      case "picked": return "Out for Delivery";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  const canCancelOrder = order.status === "pending" || order.status === "processing";

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">Order #{order.id}</h3>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt || new Date()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
          <Badge className={getStatusColor(order.status || "pending")}>
            {getStatusText(order.status || "pending")}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="font-bold">{formatCurrency(order.total)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{order.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{order.phone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Payment: {order.paymentMethod === "cash" ? "Cash on Delivery" : 
                       order.paymentMethod === "esewa" ? "eSewa" : "Khalti"}
            </span>
          </div>

          {order.estimatedDeliveryTime && (
            <div className="text-sm text-gray-600">
              <span>Estimated delivery: {order.estimatedDeliveryTime} minutes</span>
            </div>
          )}

          {order.cancelReason && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              <span className="font-medium">Cancellation reason:</span> {order.cancelReason}
            </div>
          )}

          {canCancelOrder && (
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => cancelOrderMutation.mutate()}
                disabled={cancelOrderMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}