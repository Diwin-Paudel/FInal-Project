import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { FoodItem } from "@shared/schema";

type FoodItemCardProps = {
  name: string;
  restaurant: string;
  price: number;
  image: string;
  id?: number;
  foodItem?: FoodItem;
  restaurantId?: number;
};

export default function FoodItemCard({ name, restaurant, price, image, id, foodItem, restaurantId }: FoodItemCardProps) {
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (foodItem && restaurantId) {
      addToCart(foodItem, restaurantId, restaurant);
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
      });
    } else {
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
      });
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow transition-shadow">
      <div className="w-full h-28 overflow-hidden">
        <img 
          src={image} 
          alt={`${name} dish`} 
          className="w-full h-28 object-cover"
        />
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm text-neutral-dark mb-1">{name}</h3>
        <p className="text-neutral-medium text-xs mb-2">{restaurant}</p>
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">{formatCurrency(price)}</span>
          <Button 
            size="icon" 
            className="bg-primary text-white rounded-full w-6 h-6"
            onClick={handleAddToCart}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
