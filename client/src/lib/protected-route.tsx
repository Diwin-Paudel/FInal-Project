import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  role
}: {
  path: string;
  component: () => React.JSX.Element | null;
  role: "customer" | "owner" | "admin" | "partner" | Array<"customer" | "owner" | "admin" | "partner">;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    const authRole = Array.isArray(role) ? role[0] : role;
    return (
      <Route path={path}>
        <Redirect to={`/${authRole}/auth`} />
      </Route>
    );
  }

  // Check if the user has the correct role
  const allowedRoles = Array.isArray(role) ? role : [role];
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on the user's actual role
    const redirectPath = user.role === "admin" ? "/admin" : `/${user.role}/home`;
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
