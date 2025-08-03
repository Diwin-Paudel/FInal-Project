import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeliveryItemProps {
  order: Order;
}

export default function DeliveryItem({ order }: DeliveryItemProps) {
  const { toast } = useToast();

  const updateOrderMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Delivery updated",
        description: "Order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update delivery",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-purple-100 text-purple-800";
      case "picked": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready": return "Ready for Pickup";
      case "picked": return "Out for Delivery";
      case "delivered": return "Delivered";
      default: return status;
    }
  };

  const canPickup = order.status === "ready";
  const canMarkDelivered = order.status === "picked";

  const handlePickup = () => {
    updateOrderMutation.mutate("picked");
  };

  const handleMarkDelivered = () => {
    updateOrderMutation.mutate("delivered");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">Order #{order.id}</h3>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt || new Date()).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status || "ready")}>
              {getStatusText(order.status || "ready")}
            </Badge>
            <p className="font-bold mt-1">{formatCurrency(order.total)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
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

          <div className="text-sm">
            <span className="font-medium">Delivery Fee:</span> {formatCurrency(order.deliveryFee || 50)}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t flex gap-2">
            {canPickup && (
              <Button 
                onClick={handlePickup}
                disabled={updateOrderMutation.isPending}
                className="flex-1"
              >
                {updateOrderMutation.isPending ? "Picking up..." : "Pick up Order"}
              </Button>
            )}
            
            {canMarkDelivered && (
              <Button 
                onClick={handleMarkDelivered}
                disabled={updateOrderMutation.isPending}
                className="flex-1"
              >
                {updateOrderMutation.isPending ? "Marking delivered..." : "Mark as Delivered"}
              </Button>
            )}

            {order.status === "picked" && (
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Navigation className="h-4 w-4" />
                Navigate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}