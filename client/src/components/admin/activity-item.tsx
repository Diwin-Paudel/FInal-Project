import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ActivityItemProps {
  type: "order" | "restaurant" | "partner" | "user";
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  user?: string;
}

export default function ActivityItem({ 
  type, 
  title, 
  description, 
  timestamp, 
  status, 
  user 
}: ActivityItemProps) {
  const getTypeColor = () => {
    switch (type) {
      case "order": return "bg-blue-100 text-blue-600";
      case "restaurant": return "bg-green-100 text-green-600";
      case "partner": return "bg-purple-100 text-purple-600";
      case "user": return "bg-orange-100 text-orange-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected":
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-b-0">
      <Avatar className="h-8 w-8">
        <AvatarFallback className={getTypeColor()}>
          {type.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
            {user && (
              <p className="text-xs text-gray-500 mt-1">by {user}</p>
            )}
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
            {status && (
              <Badge className={`text-xs ${getStatusColor(status)}`}>
                {status}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}