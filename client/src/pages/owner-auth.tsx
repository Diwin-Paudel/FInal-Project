import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Loader2, ArrowLeft } from "lucide-react";
import { loginSchema, restaurantRegisterSchema, type Login, type RestaurantRegister } from "@shared/schema";

export default function OwnerAuth() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, isLoading, loginMutation, ownerRegisterMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect logged-in owners to home page
  useEffect(() => {
    if (user && user.role === "owner") {
      setLocation("/owner/home");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<Login>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RestaurantRegister>({
    resolver: zodResolver(restaurantRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      restaurantName: "",
      location: "",
      phone: "",
    },
  });

  const onLoginSubmit = (data: Login) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RestaurantRegister) => {
    ownerRegisterMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="header-role-owner py-4 shadow-sm">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            className="mr-4 text-white" 
            onClick={() => setLocation("/")}
            aria-label="Go back to role selection"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-heading font-semibold text-white">Restaurant Owner Access</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login" className="data-[state=active]:owner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--owner))] rounded-none">Log In</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:owner-text data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--owner))] rounded-none">Register Restaurant</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardContent className="p-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="restaurant@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <div className="flex justify-end mt-1">
                            <a href="#" className="text-sm owner-text hover:underline">Forgot Password?</a>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full owner-bg hover:bg-[hsl(var(--owner)/0.9)]"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Log In
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardContent className="p-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="restaurantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Nepali Spice House" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Thamel, Kathmandu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="restaurant@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+977 9812345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mb-4">
                      <label className="block text-neutral-dark text-sm font-medium mb-2">Restaurant Photo</label>
                      <div className="border border-dashed border-neutral-medium rounded-md p-4 text-center">
                        <span className="material-icons text-3xl text-neutral-medium">image</span>
                        <p className="text-sm text-neutral-medium mb-2">Upload restaurant photo</p>
                        <Input type="file" className="w-full" accept="image/*" />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-neutral-dark text-sm font-medium mb-2">Owner Photo</label>
                      <div className="border border-dashed border-neutral-medium rounded-md p-4 text-center">
                        <span className="material-icons text-3xl text-neutral-medium">person</span>
                        <p className="text-sm text-neutral-medium mb-2">Upload owner photo</p>
                        <Input type="file" className="w-full" accept="image/*" />
                      </div>
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full owner-bg hover:bg-[hsl(var(--owner)/0.9)]"
                      disabled={ownerRegisterMutation.isPending}
                    >
                      {ownerRegisterMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Register Restaurant
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
