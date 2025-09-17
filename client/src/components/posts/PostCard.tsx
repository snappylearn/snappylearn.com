import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share, 
  MoreHorizontal,
  Clock,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithDetails } from "@shared/schema";
import { BookmarkPopover } from "@/components/BookmarkPopover";
import { AIBadge } from "@/components/ui/ai-badge";

interface PostCardProps {
  post: PostWithDetails;
}

export function PostCard({ post }: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const likePostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/posts/${post.id}/like`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    },
  });

  // Remove the old bookmark mutation since we're using the popover now

  const repostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/posts/${post.id}/repost`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post reposted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to repost",
        variant: "destructive",
      });
    },
  });

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return first + last || 'U';
  };

  const displayName = post.author?.firstName && post.author?.lastName 
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author?.firstName || 'Anonymous User';

  const shouldTruncate = post.content.length > 300;
  const displayContent = shouldTruncate && !showFullContent 
    ? post.content.substring(0, 300) + '...' 
    : post.content;

  return (
    <Card 
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on interactive elements
        if (
          (e.target as HTMLElement).closest('button') ||
          (e.target as HTMLElement).closest('a') ||
          (e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')
        ) {
          return;
        }
        setLocation(`/posts/${post.id}`);
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                {getInitials(post.author?.firstName, post.author?.lastName)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{displayName}</h3>
                {post.author?.userTypeId === 2 && (
                  <AIBadge size="sm" data-testid="ai-badge-post" />
                )}
                {post.userActions?.isFollowing && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Following
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {post.topic && (
                  <>
                    <span>•</span>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        borderColor: post.topic.color || '#6366f1',
                        color: post.topic.color || '#6366f1'
                      }}
                    >
                      {post.topic.name}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {post.title && (
          <h2 className="font-semibold text-lg mb-3 leading-tight">
            {post.title}
          </h2>
        )}
        
        <div className="prose prose-sm max-w-none mb-4">
          <p className="whitespace-pre-wrap text-foreground leading-relaxed">
            {displayContent}
          </p>
          {shouldTruncate && (
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-primary"
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'Show less' : 'Read more'}
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${post.userActions?.isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
              onClick={() => likePostMutation.mutate()}
              disabled={likePostMutation.isPending}
            >
              <Heart className={`w-4 h-4 ${post.userActions?.isLiked ? 'fill-current' : ''}`} />
              {post.stats.likeCount > 0 && (
                <span className="text-sm">{post.stats.likeCount}</span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => setLocation(`/posts/${post.id}`)}
            >
              <MessageCircle className="w-4 h-4" />
              {post.stats.commentCount > 0 && (
                <span className="text-sm">{post.stats.commentCount}</span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={() => repostMutation.mutate()}
              disabled={repostMutation.isPending || post.userActions?.isReposted}
            >
              <Share className="w-4 h-4" />
              {post.stats.repostCount > 0 && (
                <span className="text-sm">{post.stats.repostCount}</span>
              )}
            </Button>
          </div>
          
          <BookmarkPopover
            postId={post.id}
            postTitle={post.title || 'Untitled Post'}
            postContent={post.content}
            isBookmarked={post.userActions?.isBookmarked}
          >
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${post.userActions?.isBookmarked ? 'text-blue-500 hover:text-blue-600' : ''}`}
            >
              <Bookmark className={`w-4 h-4 ${post.userActions?.isBookmarked ? 'fill-current' : ''}`} />
              {post.stats.bookmarkCount > 0 && (
                <span className="text-sm">{post.stats.bookmarkCount}</span>
              )}
            </Button>
          </BookmarkPopover>
        </div>
      </CardContent>
    </Card>
  );
}