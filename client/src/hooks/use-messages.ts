import { useQuery, useMutation } from "@tanstack/react-query";
import { messagesApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    queryFn: () => messagesApi.getByConversation(conversationId),
    enabled: !!conversationId,
    refetchInterval: 3000, // Refetch every 3 seconds to pick up AI responses
    refetchIntervalInBackground: false, // Only refetch when tab is active
  });
}

export function useSendMessage() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: number; content: string }) =>
      messagesApi.send(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
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
