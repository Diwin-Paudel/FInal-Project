import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Restaurant } from "@shared/schema";
import { MapPin, Clock, Star, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RestaurantRequestProps {
  restaurant: Restaurant;
}

export default function RestaurantRequest({ restaurant }: RestaurantRequestProps) {
  const { toast } = useToast();

  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ action }: { action: "approve" | "reject" }) => {
      const res = await apiRequest("PATCH", `/api/admin/restaurants/${restaurant.id}/status`, {
        status: action === "approve" ? "approved" : "rejected"
      });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === "approve" ? "Restaurant approved" : "Restaurant rejected",
        description: `${restaurant.name} has been ${variables.action}d successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update restaurant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const imageUrl = restaurant.photo || 
    `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300`;

  return (
    <Card className="mb-4">
      <div className="flex">
        <div className="w-32 h-24">
          <img 
            src={imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>
        <div className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {restaurant.location}
                </p>
              </div>
              <Badge className={getStatusColor(restaurant.status || "pending")}>
                {(restaurant.status || "pending").charAt(0).toUpperCase() + (restaurant.status || "pending").slice(1)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-2">
              {restaurant.category && (
                <div className="flex flex-wrap gap-1">
                  {restaurant.category.slice(0, 3).map((cat, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {restaurant.category.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{restaurant.category.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{restaurant.rating || "New"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Est. 30-45 min</span>
                </div>
              </div>

              {restaurant.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm"
                    onClick={() => updateRestaurantMutation.mutate({ action: "approve" })}
                    disabled={updateRestaurantMutation.isPending}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    {updateRestaurantMutation.isPending ? "Processing..." : "Approve"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateRestaurantMutation.mutate({ action: "reject" })}
                    disabled={updateRestaurantMutation.isPending}
                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}