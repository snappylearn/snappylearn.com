import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareThoughtsBoxProps {
  context?: {
    type: 'community' | 'topic' | 'home';
    id?: number;
    name?: string;
  };
  onPostCreated?: () => void;
}

export function ShareThoughtsBox({ context, onPostCreated }: ShareThoughtsBoxProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch topics for topic selector (only show on home page)
  const { data: topics = [] } = useQuery({
    queryKey: ['/api/topics'],
    enabled: !context || context.type === 'home',
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      return apiRequest('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created!",
      });
      setTitle("");
      setContent("");
      setSelectedTopicId("");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      if (context?.type === 'community') {
        queryClient.invalidateQueries({ queryKey: [`/api/posts?communityId=${context.id}`] });
      }
      if (context?.type === 'topic') {
        queryClient.invalidateQueries({ queryKey: [`/api/posts?topicId=${context.id}`] });
      }
      
      onPostCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please write something to share",
        variant: "destructive",
      });
      return;
    }

    // For home page, require topic selection
    if ((!context || context.type === 'home') && !selectedTopicId) {
      toast({
        title: "Error",
        description: "Please select a topic for your post",
        variant: "destructive",
      });
      return;
    }

    const postData: any = {
      title: title.trim() || null,
      content: content.trim(),
      type: 'text',
    };

    // Add context-specific fields
    if (context?.type === 'community') {
      postData.communityId = context.id;
      postData.topicId = 1; // Default topic - you might want to make this configurable
    } else if (context?.type === 'topic') {
      postData.topicId = context.id;
    } else {
      // Home page
      postData.topicId = parseInt(selectedTopicId);
    }

    createPostMutation.mutate(postData);
  };

  const getPlaceholder = () => {
    if (context?.type === 'community') {
      return `Share your thoughts with the ${context.name} community...`;
    } else if (context?.type === 'topic') {
      return `What's happening in ${context.name}?`;
    }
    return "Share your thoughts...";
  };

  const getContextLabel = () => {
    if (context?.type === 'community') {
      return `Posting to ${context.name}`;
    } else if (context?.type === 'topic') {
      return `Posting to ${context.name}`;
    }
    return null;
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Share your thoughts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {/* Title field (optional) */}
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-none shadow-none text-lg font-medium placeholder:text-gray-400 focus-visible:ring-0 px-0"
              />
              
              {/* Content field */}
              <Textarea
                placeholder={getPlaceholder()}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-none shadow-none focus-visible:ring-0 px-0 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Topic selector - only show on home page */}
          {(!context || context.type === 'home') && (
            <div className="flex items-center gap-3 pl-13">
              <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic: any) => (
                    <SelectItem key={topic.id} value={topic.id.toString()}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-between items-center pl-13">
            <div className="text-sm text-gray-500">
              {getContextLabel()}
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || createPostMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}