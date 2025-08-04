import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Settings,
  Plus,
  Edit,
  Eye,
  Clock,
  MapPin,
  Users,
  LogOut,
} from "lucide-react";
import { useLocation } from "wouter";
import { Restaurant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function OwnerHome() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch restaurant data
  const {
    data: restaurant,
    isLoading,
    error,
  } = useQuery<Restaurant>({
    queryKey: ["/api/owner/restaurant"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/owner/restaurant");
      if (res.status === 404) {
        return null; // No restaurant yet
      }
      return await res.json();
    },
  });

  if (!user || user.role !== "owner") {
    setLocation("/");
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isPendingApproval = user.status === "pending";
  const hasRestaurant = restaurant !== null && restaurant !== undefined;
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Restaurant Owner
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/profile/edit")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alerts */}
        {isPendingApproval && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Account Pending Approval
                </h3>
                <p className="text-sm text-yellow-700">
                  Your restaurant owner account is pending admin approval. You
                  can set up your restaurant profile, but it won't be visible to
                  customers until approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Restaurant Information
                  </span>
                  {hasRestaurant ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/owner/restaurant/edit")}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setLocation("/owner/restaurant/edit")}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Restaurant
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : hasRestaurant ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">
                          {restaurant.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{restaurant.location}</span>
                        </div>
                        <Badge
                          className={getStatusColor(
                            restaurant.status || "pending"
                          )}
                        >
                          {restaurant.status || "pending"}
                        </Badge>
                        {restaurant.blockReason && (
                          <p className="text-sm text-red-600">
                            Reason: {restaurant.blockReason}
                          </p>
                        )}
                      </div>
                      {restaurant.photo && (
                        <img
                          src={restaurant.photo}
                          alt={restaurant.name}
                          className="w-20 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>

                    {restaurant.category && restaurant.category.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Categories:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.category.map((cat, index) => (
                            <Badge key={index} variant="secondary">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Restaurant Found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      You haven't created your restaurant profile yet.
                    </p>
                    <Button
                      onClick={() => setLocation("/owner/restaurant/edit")}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Restaurant
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Restaurant Status</span>
                  <Badge
                    className={
                      hasRestaurant
                        ? getStatusColor(restaurant.status || "pending")
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {hasRestaurant
                      ? restaurant.status || "pending"
                      : "Not Created"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <Badge
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Orders</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Menu Items</span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/owner/restaurant/edit")}
                >
                  <Store className="h-4 w-4 mr-2" />
                  {hasRestaurant ? "Edit Restaurant" : "Create Restaurant"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!hasRestaurant}
                  onClick={() => setLocation("/owner/menu")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Menu
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!hasRestaurant}
                  onClick={() => setLocation("/owner/orders")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Orders
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/profile/edit")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Information */}
        {!hasRestaurant && !isPendingApproval && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Get Started
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your restaurant profile to start accepting orders from
                  customers. Add your restaurant details, menu items, and start
                  building your business.
                </p>
                <Button
                  onClick={() => setLocation("/owner/restaurant/edit")}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your Restaurant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
