import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Agent {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  about: string;
  categoryId: number;
  userTypeId: number;
}

export function useAgents(options?: { includeSnappy?: boolean }) {
  const includeSnappy = options?.includeSnappy ?? false;
  
  return useQuery({
    queryKey: ["/api/users", includeSnappy],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch agents");
      }
      
      const users = await response.json();
      // Filter to get only AI agents (userTypeId = 2)
      // For mentions, exclude Snappy. For attribution, include all agents
      return users.filter((user: any) => 
        user.userTypeId === 2 && (includeSnappy || user.username !== 'snappy')
      ) as Agent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}