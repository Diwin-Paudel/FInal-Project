import { useEffect } from "react";
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
import { Loader2, ArrowLeft } from "lucide-react";
import { loginSchema, type Login } from "@shared/schema";

export default function AdminAuth() {
  const { user, isLoading, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect logged-in admins to home page
  useEffect(() => {
    if (user && user.role === "admin") {
      setLocation("/admin/home");
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

  const onLoginSubmit = (data: Login) => {
    loginMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light">
      <header className="header-role-admin py-4 shadow-sm">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            className="mr-4 text-white" 
            onClick={() => setLocation("/")}
            aria-label="Go back to role selection"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-heading font-semibold text-white">Admin Access</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-heading font-semibold text-neutral-dark mb-1">Administrator Login</h2>
              <p className="text-neutral-medium">Access the admin control panel</p>
            </div>
            
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="admin@foodexpress.com" 
                          {...field} 
                        />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full admin-bg hover:bg-[hsl(var(--admin)/0.9)]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Log In
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 pt-6 border-t border-neutral-light">
              <p className="text-sm text-neutral-medium text-center">
                Only authorized administrators can access this panel.<br />
                If you need assistance, please contact IT support.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
