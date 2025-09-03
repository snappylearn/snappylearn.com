import { useQuery, useMutation } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    queryFn: () => messagesApi.getByConversation(conversationId),
    enabled: !!conversationId,
    refetchInterval: 1000, // Refetch every 1 second for faster AI response updates
    refetchIntervalInBackground: false, // Only refetch when tab is active
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });
}

export function useSendMessage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      messagesApi.send(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      // Force immediate refetch by invalidating and refetching
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
      // Force an immediate refetch to get the updated messages
      queryClient.refetchQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });
}
