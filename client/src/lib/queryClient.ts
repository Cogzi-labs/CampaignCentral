import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const timestamp = new Date().getTime(); // Add timestamp for cache busting
    
    // Check if queryKey[0] exists and is a string
    if (!queryKey || !queryKey[0] || typeof queryKey[0] !== 'string') {
      throw new Error(`Invalid query key: ${JSON.stringify(queryKey)}`);
    }
    
    const queryKeyString = queryKey[0] as string;
    const url = `${queryKeyString}${queryKeyString.includes('?') ? '&' : '?'}_t=${timestamp}`;
    
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      // Add a cache-busting parameter to prevent browser caching
      cache: "no-cache"
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30 * 1000, // 30 seconds - reduce stale time for more frequent refreshes
      retry: 1, // Allow one retry
      retryDelay: 1000, // 1 second delay before retrying
    },
    mutations: {
      retry: 1, // Allow one retry for mutations too
      retryDelay: 1000,
    },
  },
});
