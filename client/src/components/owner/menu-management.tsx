import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FoodItem } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Plus, Edit, Trash2 } from "lucide-react";
import FoodItemForm from "./food-item-form";

interface MenuManagementProps {
  restaurantId: number;
}

export default function MenuManagement({ restaurantId }: MenuManagementProps) {
  const { data: foodItems, isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/restaurants", restaurantId, "foods"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Add New Item Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Menu Items</h3>
        <FoodItemForm restaurantId={restaurantId}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Food Item
          </Button>
        </FoodItemForm>
      </div>

      {Object.keys(groupedFoodItems).length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-lg text-gray-900 mb-2">No Menu Items</h3>
          <p className="text-gray-600 mb-4">Start building your menu by adding food items.</p>
          <FoodItemForm restaurantId={restaurantId}>
            <Button>Add Your First Food Item</Button>
          </FoodItemForm>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFoodItems).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                {category}
                <Badge variant="outline">{items.length} items</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    {item.photo && (
                      <div className="h-32 overflow-hidden">
                        <img 
                          src={item.photo}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold">{item.name}</h5>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}

                        {item.category && item.category.length > 1 && (
                          <div className="flex flex-wrap gap-1">
                            {item.category.slice(1).map((cat, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}