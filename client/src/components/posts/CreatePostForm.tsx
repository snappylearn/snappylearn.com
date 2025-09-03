import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import type { Topic } from "@shared/schema";

interface CreatePostFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
  context?: {
    type: 'community' | 'topic' | 'home';
    id?: number;
    name?: string;
  };
  isJoined?: boolean; // For community membership status
}

export function CreatePostForm({ onSuccess, onCancel, isModal = true, context, isJoined = true }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(!isModal);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title?: string; content: string; topicId?: number }) => {
      return await apiRequest("/api/posts", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created!",
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setTopicId("");
      setIsExpanded(!isModal);
      
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is trying to post to a community without being joined
    if (context?.type === 'community' && !isJoined) {
      toast({
        title: "Join Community First",
        description: `You need to join ${context.name} before you can post.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your post",
        variant: "destructive",
      });
      return;
    }

    // Automatically set topic if posting from topic detail page
    let finalTopicId = topicId ? parseInt(topicId) : undefined;
    if (context?.type === 'topic' && context.id) {
      finalTopicId = context.id;
    }

    createPostMutation.mutate({
      title: title.trim() || undefined,
      content: content.trim(),
      topicId: finalTopicId,
    });
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setTopicId("");
    setIsExpanded(!isModal);
    onCancel?.();
  };

  if (!isExpanded) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Button
            onClick={() => setIsExpanded(true)}
            className="w-full justify-start text-left h-12 bg-muted hover:bg-muted/80"
            variant="ghost"
          >
            <Plus className="w-4 h-4 mr-2" />
            Share your thoughts...
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Create Post</CardTitle>
        {isModal && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Post title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          
          <Textarea
            placeholder="What's on your mind? Share your thoughts, insights, or questions..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={2000}
          />
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Only show topic selector on home page */}
            {(!context || context.type === 'home') && (
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Select topic (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: topic.color || '#6366f1' }}
                        />
                        {topic.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Show context info for topic/community pages */}
            {context && context.type !== 'home' && (
              <div className="text-sm text-gray-500 sm:w-[200px] flex items-center">
                Posting to: <span className="font-medium ml-1">{context.name}</span>
              </div>
            )}
            
            <div className="flex gap-2 sm:ml-auto">
              {isModal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createPostMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createPostMutation.isPending || !content.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {content.length}/2000 characters
            {!topicId && (
              <span className="ml-2">• AI will suggest a topic if none selected</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}