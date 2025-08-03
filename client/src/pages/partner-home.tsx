import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Bell, LogOut, Truck, MapPin, Clock, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Partner, Order } from "@shared/schema";
import DeliveryItem from "@/components/partner/delivery-item";
import PartnerStats from "@/components/partner/partner-stats";
import EarningsChart from "@/components/partner/earnings-chart";

export default function PartnerHome() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [partnerStatus, setPartnerStatus] = useState<string>("available");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-purple-100 text-purple-800";
      case "picked": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Query for partner's orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Mutation to update partner status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", "/api/partners/status", { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: `Your status is now set to ${partnerStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (value: string) => {
    setPartnerStatus(value);
    updateStatusMutation.mutate(value);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user || user.role !== "partner") return null;

  // Filter ongoing and available orders
  const ongoingDeliveries = orders?.filter(order => 
    order.partnerId === (user as any).partnerDetails?.id && 
    order.status && ["preparing", "ready", "picked"].includes(order.status)
  ) || [];
  
  const availableOrders = orders?.filter(order => 
    order.partnerId === null && order.status === "ready"
  ) || [];

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-heading font-semibold partner-text">Delivery Dashboard</h1>
            <div className="flex items-center">
              <button 
                className="p-2 text-neutral-dark rounded-full hover:bg-neutral-light"
                aria-label="Notifications"
              >
                <Bell size={20} />
              </button>
              <div className="relative ml-2">
                <Avatar>
                  <AvatarFallback className="bg-amber-100 text-[hsl(var(--partner))]">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-neutral-light hover:bg-neutral-dark hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut size={10} />
                </Button>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="home">
            <TabsList className="w-full grid grid-cols-4 bg-transparent pb-2">
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:partner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--partner))] rounded-none"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="data-[state=active]:partner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--partner))] rounded-none"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="deliveries"
                className="data-[state=active]:partner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--partner))] rounded-none"
              >
                Deliveries
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:partner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--partner))] rounded-none"
              >
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="home">
              <main className="container mx-auto px-4 py-6">
        {/* Partner Status */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full overflow-hidden flex items-center justify-center text-[hsl(var(--partner))] mr-4">
                <span className="material-icons text-2xl">person</span>
              </div>
              <div>
                <h2 className="font-heading font-medium text-lg text-neutral-dark">{user.name}</h2>
                <p className="text-neutral-medium text-sm">ID: DEL-{(user as any).partnerDetails?.id || user.id}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-2">Status:</span>
              <div className="relative">
                <Select value={partnerStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className={`py-1 pl-3 pr-8 rounded-full text-sm font-medium ${
                    partnerStatus === 'available' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : partnerStatus === 'busy'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Today's Stats */}
        <PartnerStats orders={orders || []} />
        
        {/* Ongoing Deliveries */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="px-5 py-4 border-b border-neutral-light">
            <h2 className="font-heading font-medium text-lg text-neutral-dark">Ongoing Deliveries</h2>
          </div>
          
          {isLoadingOrders ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--partner))]" />
            </div>
          ) : ongoingDeliveries.length > 0 ? (
            <>
              {ongoingDeliveries.map(order => (
                <DeliveryItem 
                  key={order.id}
                  order={order}
                />
              ))}
            </>
          ) : (
            <div className="p-5">
              {availableOrders.length > 0 ? (
                <>
                  <h3 className="font-medium text-neutral-dark mb-4">New Order Available</h3>
                  {availableOrders.map(order => (
                    <DeliveryItem 
                      key={order.id}
                      order={order}
                    />
                  ))}
                </>
              ) : (
                <div id="empty-deliveries-state" className="py-10 text-center">
                  <span className="material-icons text-neutral-medium text-5xl mb-4">delivery_dining</span>
                  <h3 className="font-heading font-medium text-lg text-neutral-dark mb-2">No Active Deliveries</h3>
                  <p className="text-neutral-medium mb-4">You'll see new orders here when they become available.</p>
                  <Button className="bg-[hsl(var(--partner))] hover:bg-[hsl(var(--partner)/0.9)]">Refresh</Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Weekly Earnings */}
        <EarningsChart orders={orders || []} />
              </main>
            </TabsContent>
            <TabsContent value="orders">
              <main className="container mx-auto px-4 py-6">
                <h2 className="text-xl font-heading font-semibold text-neutral-dark mb-6">Available Orders</h2>
                
                {isLoadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : orders && orders.filter(o => o.status === "ready" && !o.partnerId).length > 0 ? (
                  <div className="space-y-4">
                    {orders && orders.filter(o => o.status === "ready" && !o.partnerId).map(order => (
                      <DeliveryItem key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-heading font-medium text-lg text-neutral-dark mb-2">No Available Orders</h3>
                    <p className="text-neutral-medium mb-4">New pickup orders will appear here when restaurants mark them as ready.</p>
                  </div>
                )}
              </main>
            </TabsContent>
            <TabsContent value="deliveries">
              <main className="container mx-auto px-4 py-6">
                <h2 className="text-xl font-heading font-semibold text-neutral-dark mb-6">My Deliveries</h2>
                
                {isLoadingOrders ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Deliveries */}
                    {orders?.filter(o => o.status === "picked" && o.partnerId === (user as any).partnerDetails?.id).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-indigo-600">
                          Active Deliveries ({orders.filter(o => o.status === "picked" && o.partnerId === (user as any).partnerDetails?.id).length})
                        </h3>
                        <div className="space-y-4">
                          {orders.filter(o => o.status === "picked" && o.partnerId === (user as any).partnerDetails?.id).map(order => (
                            <DeliveryItem key={order.id} order={order} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recently Completed */}
                    {orders?.filter(o => {
                      const today = new Date();
                      const orderDate = new Date(o.createdAt || new Date());
                      return o.status === "delivered" && 
                             o.partnerId === (user as any).partnerDetails?.id &&
                             orderDate.toDateString() === today.toDateString();
                    }).length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-600">
                          Completed Today ({orders.filter(o => {
                            const today = new Date();
                            const orderDate = new Date(o.createdAt || new Date());
                            return o.status === "delivered" && 
                                   o.partnerId === (user as any).partnerDetails?.id &&
                                   orderDate.toDateString() === today.toDateString();
                          }).length})
                        </h3>
                        <div className="space-y-4">
                          {orders.filter(o => {
                            const today = new Date();
                            const orderDate = new Date(o.createdAt || new Date());
                            return o.status === "delivered" && 
                                   o.partnerId === (user as any).partnerDetails?.id &&
                                   orderDate.toDateString() === today.toDateString();
                          }).map(order => (
                            <DeliveryItem key={order.id} order={order} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No deliveries */}
                    {(!orders || orders.filter(o => o.partnerId === (user as any).partnerDetails?.id).length === 0) && (
                      <div className="bg-white rounded-xl p-6 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Truck className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="font-heading font-medium text-lg text-neutral-dark mb-2">No Delivery History</h3>
                        <p className="text-neutral-medium mb-4">Your completed deliveries will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </TabsContent>
            <TabsContent value="profile">
              <main className="container mx-auto px-4 py-6">
                <h2 className="text-xl font-heading font-semibold text-neutral-dark mb-6">Partner Profile</h2>
                
                <div className="space-y-6">
                  {/* Profile Info */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <Badge variant="secondary" className="mt-1">Delivery Partner</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <Input 
                          type="text" 
                          value={user.name} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <Input 
                          type="email" 
                          value={user.email} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                        <Input 
                          type="text" 
                          value={`DEL-${(user as any).partnerDetails?.id || user.id}`} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </div>
                      {(user as any).partnerDetails?.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <Input 
                            type="tel" 
                            value={(user as any).partnerDetails.phone} 
                            disabled 
                            className="bg-gray-50"
                          />
                        </div>
                      )}
                      {(user as any).partnerDetails?.vehicleType && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                          <Input 
                            type="text" 
                            value={(user as any).partnerDetails.vehicleType} 
                            disabled 
                            className="bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Statistics */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Delivery Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {orders?.filter(o => o.partnerId === (user as any).partnerDetails?.id).length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Deliveries</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {orders?.filter(o => o.status === "delivered" && o.partnerId === (user as any).partnerDetails?.id).length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Completed Deliveries</p>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">4.8</p>
                        <p className="text-sm text-gray-600">Average Rating</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Account Actions</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        Edit Profile Information
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Update Vehicle Details
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                        Deactivate Account
                      </Button>
                    </div>
                  </div>
                </div>
              </main>
            </TabsContent>
          </Tabs>
        </div>
      </header>
    </div>
  );
}
