import { useQuery, useMutation } from "@tanstack/react-query";
import { collectionsApi, usersApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analytics } from "@/lib/analytics";
import type { InsertCollection } from "@shared/schema";

export function useCollections() {
  return useQuery({
    queryKey: ["/api/collections"],
    queryFn: collectionsApi.getAll,
  });
}

export function useCollection(id: number) {
  return useQuery({
    queryKey: ["/api/collections", id],
    queryFn: () => collectionsApi.getById(id),
    enabled: !!id && id > 0,
  });
}

export function useCreateCollection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: collectionsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
      // Track collection creation
      Analytics.trackCollectionCreated(data.id, data.name);
      
      toast({
        title: "Success",
        description: "Collection created successfully",
      });
    },
    onError: (error) => {
      Analytics.trackError("Failed to create collection", { error: error.message });
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCollection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<Omit<InsertCollection, "userId">>) => 
      collectionsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/collections", data.id] });
      
      // Track collection update
      Analytics.trackCollectionCreated(data.id, data.name);
      
      toast({
        title: "Success",
        description: "Collection updated successfully",
      });
    },
    onError: (error) => {
      Analytics.trackError("Failed to update collection", { error: error.message });
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCollection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: { id: number; name: string }) => collectionsApi.delete(params.id),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      
      // Track collection deletion
      Analytics.trackCollectionDeleted(params.id, params.name);
      
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
    },
    onError: (error) => {
      Analytics.trackError("Failed to delete collection", { error: error.message });
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive",
      });
    },
  });
}

// Users and Follow hooks
export function useUsers() {
  return useQuery({
    queryKey: ["/api/users"],
    queryFn: usersApi.getAll,
  });
}

export function useFollowUser() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: usersApi.follow,
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      
      toast({
        title: "Success",
        description: data.following ? "User followed successfully" : "User unfollowed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });
}
