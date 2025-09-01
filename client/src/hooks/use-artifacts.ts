import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Artifact, InsertArtifact } from "@shared/schema";

export function useArtifacts(filters?: { type?: string; collectionId?: number }) {
  const params = new URLSearchParams();
  if (filters?.type) params.append("type", filters.type);
  if (filters?.collectionId) params.append("collectionId", filters.collectionId.toString());
  
  const queryString = params.toString();
  const url = `/api/artifacts${queryString ? `?${queryString}` : ""}`;
  
  return useQuery({
    queryKey: ["/api/artifacts", filters],
    queryFn: async () => {
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useArtifact(id: number) {
  return useQuery({
    queryKey: ["/api/artifacts", id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/artifacts/${id}`);
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateArtifact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (artifact: InsertArtifact) => {
      const response = await apiRequest("POST", "/api/artifacts", artifact);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
    },
  });
}

export function useUpdateArtifact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertArtifact>) => {
      const response = await apiRequest("PUT", `/api/artifacts/${id}`, updates);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts", variables.id] });
    },
  });
}

export function useDeleteArtifact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/artifacts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
    },
  });
}