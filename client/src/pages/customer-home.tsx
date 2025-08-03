import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Search, Star, MapPin, Clock, ShoppingCart, User, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: number;
  name: string;
  location: string;
  photo?: string;
  rating?: number;
  category?: string[];
  status: string;
}

export default function CustomerHome() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  if (!user || user.role !== "customer") {
    setLocation("/");
    return null;
  }

  // Filter restaurants that are open and match search query
  const availableRestaurants = restaurants?.filter(restaurant => 
    restaurant.status === "open" && 
    (restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     restaurant.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
     restaurant.category?.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Food Express</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/customer/cart")}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation("/customer/orders")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Orders
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation("/profile/edit")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600">Discover delicious food from the best restaurants near you.</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Restaurants</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : availableRestaurants && availableRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setLocation(`/customer/restaurant/${restaurant.id}`)}>
                  {restaurant.photo && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={restaurant.photo}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg text-gray-900 truncate">
                        {restaurant.name}
                      </h4>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm truncate">{restaurant.location}</span>
                    </div>
                    
                    {restaurant.category && restaurant.category.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {restaurant.category.slice(0, 3).map((cat, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {restaurant.category.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{restaurant.category.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <Button className="w-full" size="sm">
                      View Menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h4>
                <p className="text-gray-600">
                  {searchQuery 
                    ? "Try adjusting your search terms or check back later."
                    : "No restaurants are currently available. Check back later!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}