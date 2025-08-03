import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt, Wallet, Star, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Stat card component
const StatCard = ({ 
  icon, 
  title, 
  value, 
  change, 
  iconColor 
}: { 
  icon: React.ReactNode; 
  title: string; 
  value: string; 
  change: string; 
  iconColor: string; 
}) => (
  <Card className="shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center mb-2">
        <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center mr-3`}>
          {icon}
        </div>
        <span className="font-heading text-neutral-dark">{title}</span>
      </div>
      <p className="text-2xl font-heading font-semibold">{value}</p>
      {change && (
        <p className="text-xs text-green-600 flex items-center">
          <span className="text-xs mr-1">↗</span>
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function OverviewStats() {
  const { data: todayOrders } = useQuery({
    queryKey: ["/api/orders/today"],
  });

  const { data: restaurant } = useQuery({
    queryKey: ["/api/owner/restaurant"],
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/owner/stats"],
    queryFn: async () => {
      const ordersArray = Array.isArray(todayOrders) ? todayOrders : [];
      const restaurantData = restaurant || {};
      
      return {
        orders: ordersArray.length,
        revenue: ordersArray.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        rating: (restaurantData as any)?.averageRating || 0,
        customers: new Set(ordersArray.map((order: any) => order.customerId)).size,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard
        icon={<Receipt className="h-5 w-5 text-blue-500" />}
        title="Orders Today"
        value={stats?.orders.toString() || "0"}
        change=""
        iconColor="bg-blue-100"
      />
      
      <StatCard
        icon={<Wallet className="h-5 w-5 text-green-500" />}
        title="Revenue Today"
        value={formatCurrency(stats?.revenue || 0)}
        change=""
        iconColor="bg-green-100"
      />
      
      <StatCard
        icon={<Star className="h-5 w-5 text-amber-500" />}
        title="Rating"
        value={`${stats?.rating}/5` || "0/5"}
        change=""
        iconColor="bg-amber-100"
      />
      
      <StatCard
        icon={<Users className="h-5 w-5 text-purple-500" />}
        title="Customer Count"
        value={stats?.customers.toString() || "0"}
        change=""
        iconColor="bg-purple-100"
      />
    </div>
  );
}
