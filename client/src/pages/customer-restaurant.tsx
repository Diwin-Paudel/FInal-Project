import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import CartDrawer from "@/components/customer/cart-drawer";

import { Restaurant, FoodItem } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
export default function CustomerRestaurant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { cart, addToCart, itemCount } = useCart();

  const [match, params] = useRoute("/customer/restaurant/:id");
  const restaurantId = params ? parseInt(params.id) : 0;

  const { data: restaurant, isLoading: isLoadingRestaurant } =
    useQuery<Restaurant>({
      queryKey: [`/api/restaurants/${restaurantId}`],
      queryFn: async () => {
        const res = await fetch(`/api/restaurants/${restaurantId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch restaurant");
        return await res.json();
      },
    });

  const { data: foodItems, isLoading: isLoadingFoodItems } = useQuery<
    FoodItem[]
  >({
    queryKey: [`/api/restaurants/${restaurantId}/food-items`],
    enabled: !!restaurantId,
  });

  if (!user || user.role !== "customer") {
    setLocation("/");
    return null;
  }

  const handleAddToCart = (foodItem: FoodItem) => {
    if (!restaurant) return;

    addToCart(foodItem, restaurantId, restaurant.name);
    toast({
      title: "Added to cart",
      description: `${foodItem.name} has been added to your cart.`,
    });
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount}`;
  };

  if (isLoadingRestaurant || isLoadingFoodItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Restaurant not found
          </h2>
          <Button onClick={() => setLocation("/customer/home")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to restaurants
          </Button>
        </div>
      </div>
    );
  }

  // Group food items by category
  const groupedFoodItems =
    foodItems?.reduce((groups, item) => {
      const categories = item.category || ["Other"];
      categories.forEach((category) => {
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
      });
      return groups;
    }, {} as Record<string, FoodItem[]>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/customer/home")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold text-gray-900">
                {restaurant.name}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <CartDrawer>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({itemCount})
                  {itemCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </CartDrawer>
            </div>
          </div>
        </div>
      </header>

      {/* Restaurant Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {restaurant.photo && (
                <img
                  src={restaurant.photo}
                  alt={restaurant.name}
                  className="w-32 h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {restaurant.name}
                </h2>
                <div className="flex items-center gap-4 text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.location}</span>
                  </div>
                  {restaurant.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{restaurant.rating}/5</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <Badge
                      variant={
                        restaurant.status === "open" ? "default" : "secondary"
                      }
                      className={
                        restaurant.status === "open"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {restaurant.status}
                    </Badge>
                  </div>
                </div>
                {restaurant.category && restaurant.category.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {restaurant.category.map((cat, index) => (
                      <Badge key={index} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        {restaurant.status !== "open" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">
              This restaurant is currently {restaurant.status}. You may not be
              able to place orders at this time.
            </p>
          </div>
        )}

        {foodItems && foodItems.length > 0 ? (
          <Tabs
            defaultValue={Object.keys(groupedFoodItems)[0]}
            className="w-full"
          >
            <TabsList
              className="grid w-full mb-6"
              style={{
                gridTemplateColumns: `repeat(${
                  Object.keys(groupedFoodItems).length
                }, minmax(0, 1fr))`,
              }}
            >
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
                            <p className="text-sm text-gray-600 mb-3">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lg">
                              {formatCurrency(item.price)}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="flex items-center gap-1"
                              disabled={restaurant.status !== "open"}
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
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No menu items available
            </h3>
            <p className="text-gray-500">
              This restaurant hasn't added any food items yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
