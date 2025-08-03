import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Restaurant } from "@shared/schema";
import { formatRating } from "@/lib/utils";

type RestaurantCardProps = {
  restaurant: Restaurant;
};

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [, setLocation] = useLocation();

  const imageUrl = restaurant.photo;

  // Generate categories display
  const categoriesDisplay = restaurant.category && restaurant.category.length > 0 
    ? restaurant.category.join(", ") 
    : "Various Cuisines";

  // Handle click to navigate to restaurant detail
  const handleClick = () => {
    setLocation(`/restaurants/${restaurant.id}`);
  };

  return (
    <Card 
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-full h-36 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={`${restaurant.name} restaurant`} 
            className="w-full h-36 object-cover"
          />
        ) : (
          <div className="w-full h-36 bg-gray-200 flex items-center justify-center text-gray-500">
            No image available
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-heading font-medium text-neutral-dark">{restaurant.name}</h3>
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            {restaurant.rating ? formatRating(restaurant.rating) : "0.0"} ★
          </span>
        </div>
        <p className="text-neutral-medium text-sm mb-2">{categoriesDisplay}</p>
        <p className="text-neutral-medium text-sm flex items-center">
          <span className="text-primary text-xs mr-1">📍</span>
          {restaurant.location}
        </p>
      </CardContent>
    </Card>
  );
}
