import { useQuery, useMutation } from "@tanstack/react-query";
import { collectionsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analytics } from "@/lib/analytics";

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
    enabled: !!id,
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
