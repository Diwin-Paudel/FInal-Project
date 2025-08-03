import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Package, DollarSign, Star } from "lucide-react";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface PartnerStatsProps {
  orders: Order[];
}

export default function PartnerStats({ orders }: PartnerStatsProps) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const todaysOrders = orders.filter(order => 
    new Date(order.createdAt || new Date()) >= todayStart
  );
  
  const completedOrders = orders.filter(order => order.status === "delivered");
  const todaysCompleted = todaysOrders.filter(order => order.status === "delivered");
  
  const todaysEarnings = todaysCompleted.reduce((sum, order) => 
    sum + (order.deliveryFee || 50), 0
  );
  
  const totalEarnings = completedOrders.reduce((sum, order) => 
    sum + (order.deliveryFee || 50), 0
  );

  const stats = [
    {
      title: "Today's Deliveries",
      value: todaysCompleted.length,
      icon: Truck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Orders",
      value: orders.filter(o => o.status === "picked").length,
      icon: Package,
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
    },
    {
      title: "Today's Earnings",
      value: formatCurrency(todaysEarnings),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Rating",
      value: "0.0",
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}