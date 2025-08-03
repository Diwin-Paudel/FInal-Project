import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Store, 
  Users, 
  Truck, 
  ShoppingBag, 
  Settings, 
  BarChart3,
  Shield,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Restaurants", href: "/admin/restaurants", icon: Store },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Partners", href: "/admin/partners", icon: Truck },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "bg-white shadow-lg h-screen fixed left-0 top-0 z-30 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <p className="text-xs text-gray-500">Food Delivery Platform</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mx-auto">
            <Shield className="h-5 w-5 text-white" />
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="h-8 w-8 p-0 ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <Avatar>
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
                           (item.href !== "/admin/home" && location.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div 
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "bg-red-50 text-red-600 border border-red-200" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link href="/profile/edit">
          <div 
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Profile" : undefined}
          >
            <User className="h-5 w-5" />
            {!isCollapsed && <span className="font-medium">Profile</span>}
          </div>
        </Link>
        
        <div 
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700",
            isCollapsed && "justify-center px-2"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </div>
      </div>
    </div>
  );
}