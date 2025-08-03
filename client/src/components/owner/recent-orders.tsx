import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt } from "lucide-react";
import { formatCurrency, formatRelativeTime, generateOrderId } from "@/lib/utils";
import { Order } from "@shared/schema";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-blue-100 text-blue-800";
      case "picked":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready";
      case "picked":
        return "Out for Delivery";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full ${getStatusColor(status)} text-xs font-medium`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default function RecentOrders() {
  // In a real app, this would fetch recent orders from the API
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const handleViewDetails = (orderId: number) => {
    // Navigate to order details
    window.location.href = `/owner/orders?highlight=${orderId}`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-5 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary my-8" />
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-medium text-lg text-neutral-dark">Recent Orders</h2>
            <Button variant="link" className="text-secondary text-sm font-medium p-0">View All</Button>
          </div>
          
          <div id="empty-orders-state" className="py-6 text-center">
            <Receipt className="mx-auto h-12 w-12 text-neutral-medium mb-4" />
            <h3 className="font-heading font-medium text-lg text-neutral-dark mb-2">No Orders Yet</h3>
            <p className="text-neutral-medium">Your orders will appear here once customers start placing them.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-medium text-lg text-neutral-dark">Recent Orders</h2>
          <Button variant="link" className="text-secondary text-sm font-medium p-0">View All</Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Order ID</TableHead>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Customer</TableHead>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Items</TableHead>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Total</TableHead>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Status</TableHead>
                <TableHead className="text-left text-sm text-neutral-medium font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 3).map((order) => (
                <TableRow key={order.id} className="border-b">
                  <TableCell className="py-3 text-sm font-medium">{generateOrderId(order.id)}</TableCell>
                  <TableCell className="py-3 text-sm">{order.customer?.name || `Customer ${order.customerId}`}</TableCell>
                  <TableCell className="py-3 text-sm">{order.items?.length || 0} items</TableCell>
                  <TableCell className="py-3 text-sm">{formatCurrency(order.total)}</TableCell>
                  <TableCell className="py-3 text-sm">
                    <StatusBadge status={order.status || "unknown"} />
                  </TableCell>
                  <TableCell className="py-3 text-sm">
                    <Button 
                      variant="link" 
                      className="text-secondary font-medium text-sm p-0"
                      onClick={() => handleViewDetails(order.id)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
