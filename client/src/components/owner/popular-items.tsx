import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock popular items interface
interface PopularItem {
  id: number;
  name: string;
  price: number;
  image: string;
  orders: number;
  percentage: number;
}

export default function PopularItems() {
  // In a real app, this would fetch popular items from the API
  const { data: popularItems, isLoading } = useQuery({
    queryKey: ["/api/owner/popular-items"],
    queryFn: async () => {
      // Mock data to avoid showing a loading state in the UI
      return [
        {
          id: 1,
          name: "Chicken Momo",
          price: 220,
          image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
          orders: 142,
          percentage: 85
        },
        {
          id: 2,
          name: "Tandoori Chicken",
          price: 380,
          image: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
          orders: 98,
          percentage: 60
        },
        {
          id: 3,
          name: "Chicken Biryani",
          price: 350,
          image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100",
          orders: 76,
          percentage: 45
        }
      ] as PopularItem[];
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-md mb-8">
        <CardContent className="p-5 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary my-8" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md mb-8">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading font-medium text-lg text-neutral-dark">Most Ordered Items</h2>
          <Button variant="link" className="text-secondary text-sm font-medium p-0">View All</Button>
        </div>
        
        <div className="space-y-4">
          {popularItems?.map((item) => (
            <div key={item.id} className="flex items-center">
              <img 
                src={item.image} 
                alt={`${item.name} dish`} 
                className="w-16 h-16 object-cover rounded-lg mr-4" 
              />
              <div className="flex-1">
                <h3 className="font-medium text-neutral-dark">{item.name}</h3>
                <p className="text-neutral-medium text-sm">{formatCurrency(item.price)}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-neutral-dark">{item.orders} orders</p>
                <div className="w-full bg-neutral-light rounded-full h-2 mt-1">
                  <div 
                    className="bg-[hsl(var(--owner))] h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
