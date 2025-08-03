import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Store, Save, ArrowLeft, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Restaurant } from "@shared/schema";

export default function OwnerRestaurantEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    photo: "",
    category: [] as string[],
  });
  
  const [newCategory, setNewCategory] = useState("");

  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["/api/owner/restaurant"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/owner/restaurant");
      return await res.json();
    },
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        location: restaurant.location || "",
        photo: restaurant.photo || "",
        category: restaurant.category || [],
      });
    }
  }, [restaurant]);

  const updateRestaurantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = restaurant ? `/api/owner/restaurant/${restaurant.id}` : "/api/owner/restaurant";
      const method = restaurant ? "PUT" : "POST";
      const res = await apiRequest(method, endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: restaurant ? "Restaurant updated successfully" : "Restaurant created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/restaurant"] });
      setLocation("/owner/home");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save restaurant",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurantMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !formData.category.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, newCategory.trim()]
      }));
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.filter(cat => cat !== categoryToRemove)
    }));
  };

  const goBack = () => {
    setLocation("/owner/home");
  };

  if (!user || user.role !== "owner") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading restaurant data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={goBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {restaurant ? "Edit Restaurant" : "Create Restaurant"}
          </h1>
          <p className="text-gray-600">
            {restaurant ? "Update your restaurant information" : "Set up your restaurant profile"}
          </p>
          {user.status === "pending" && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Your account is pending approval. You can edit your restaurant details, but it won't be visible to customers until approved by an admin.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Restaurant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your restaurant name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Enter restaurant location/address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Restaurant Photo URL</Label>
                  <Input
                    id="photo"
                    value={formData.photo}
                    onChange={(e) => handleChange("photo", e.target.value)}
                    placeholder="Enter restaurant photo URL"
                  />
                  {formData.photo && (
                    <div className="mt-2">
                      <img 
                        src={formData.photo} 
                        alt="Restaurant preview" 
                        className="w-32 h-24 rounded-lg object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Food Categories</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Add a category (e.g., Italian, Fast Food)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addCategory}
                      disabled={!newCategory.trim()}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.category.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.category.map((category, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Information */}
              {restaurant && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Restaurant Status</h3>
                  <Badge 
                    className={
                      restaurant.status === "open" ? "bg-green-100 text-green-800" :
                      restaurant.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      restaurant.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {restaurant.status || "pending"}
                  </Badge>
                  {restaurant.blockReason && (
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {restaurant.blockReason}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={goBack}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateRestaurantMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateRestaurantMutation.isPending ? "Saving..." : 
                   restaurant ? "Save Changes" : "Create Restaurant"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}