import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, refetchUser } = useAuth();
  const [location, setLocation] = useLocation();

  // Always refetch user data when route is accessed to ensure fresh auth state
  useEffect(() => {
    refetchUser();
  }, [refetchUser, path]);

  // If user is loading, show loading indicator
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If no user is found after loading completes, redirect to auth page
  if (!user) {
    console.log("No authenticated user found, redirecting to auth page");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // User is authenticated, render the requested component
  return <Route path={path} component={Component} />;
}
