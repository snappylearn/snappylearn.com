import { useQuery, useMutation } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Analytics } from "@/lib/analytics";

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: conversationsApi.getAll,
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: ["/api/conversations", id],
    queryFn: () => conversationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: conversationsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Track conversation creation
      Analytics.trackConversationStarted(
        data.conversation.id,
        data.conversation.type as 'independent' | 'collection',
        data.conversation.collectionId || undefined
      );
    },
    onError: (error) => {
      Analytics.trackError("Failed to create conversation", { error: error.message });
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      });
    },
  });
}
