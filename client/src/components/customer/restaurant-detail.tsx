import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Star, Clock, MapPin, Plus } from "lucide-react";
import { Restaurant, FoodItem } from "@shared/schema";
import { formatCurrency, formatRating } from "@/lib/utils";

interface RestaurantDetailProps {
  restaurantId: number;
  onBack: () => void;
}

export default function RestaurantDetail({ restaurantId, onBack }: RestaurantDetailProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}`);
      if (!res.ok) throw new Error("Failed to fetch restaurant");
      return res.json();
    },
  });

  const { data: foodItems, isLoading: isLoadingFoodItems } = useQuery<FoodItem[]>({
    queryKey: ["/api/restaurants", restaurantId, "foods"],
    queryFn: async () => {
      const res = await fetch(`/api/restaurants/${restaurantId}/foods`);
      if (!res.ok) throw new Error("Failed to fetch food items");
      return res.json();
    },
  });

  const handleAddToCart = (foodItem: FoodItem) => {
    if (!restaurant) return;
    
    addToCart(foodItem, restaurant.id, restaurant.name);
    toast({
      title: "Added to cart",
      description: `${foodItem.name} has been added to your cart.`,
    });
  };

  if (isLoadingRestaurant) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Restaurant not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const imageUrl = restaurant.photo || 
    `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400`;

  // Group food items by category
  const groupedFoodItems = foodItems?.reduce((groups, item) => {
    const categories = item.category || ["Main Course"];
    categories.forEach(category => {
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, {} as Record<string, FoodItem[]>) || {};

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-heading font-semibold">{restaurant.name}</h1>
      </div>

      {/* Restaurant Hero */}
      <div className="relative mb-6">
        <img 
          src={imageUrl}
          alt={restaurant.name}
          className="w-full h-48 object-cover rounded-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl" />
        <div className="absolute bottom-4 left-4 text-white">
          <h2 className="text-2xl font-bold mb-2">{restaurant.name}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{restaurant.rating ? formatRating(restaurant.rating) : "0.0"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>25-35 min</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{restaurant.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="font-semibold">{restaurant.rating ? formatRating(restaurant.rating) : "0.0"}</p>
            <p className="text-sm text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold">25-35 min</p>
            <p className="text-sm text-gray-500">Delivery Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="font-semibold">Free</p>
            <p className="text-sm text-gray-500">Delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      {restaurant.category && restaurant.category.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Cuisines</h3>
          <div className="flex flex-wrap gap-2">
            {restaurant.category.map((category, index) => (
              <Badge key={index} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Food Items */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Menu</h3>
        
        {isLoadingFoodItems ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(groupedFoodItems).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No menu items available</p>
            <p className="text-sm text-gray-400">This restaurant is still setting up their menu.</p>
          </div>
        ) : (
          <Tabs defaultValue={Object.keys(groupedFoodItems)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-auto">
              {Object.keys(groupedFoodItems).map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(groupedFoodItems).map(([category, items]) => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="flex-1 p-4">
                          <h4 className="font-semibold mb-2">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">{formatCurrency(item.price)}</span>
                            <Button 
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add
                            </Button>
                          </div>
                        </div>
                        {item.photo && (
                          <div className="w-24 h-24">
                            <img 
                              src={item.photo}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}