import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User as SelectUser } from "@shared/schema";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Direct user check with each protected route
  const { data: user, isLoading } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
  });

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
