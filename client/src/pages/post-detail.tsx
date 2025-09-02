import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { PostWithDetails, Comment } from "@shared/schema";
import { BookmarkPopover } from "@/components/BookmarkPopover";

export default function PostDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch post details
  const { data: post, isLoading: postLoading } = useQuery<PostWithDetails>({
    queryKey: [`/api/posts/${id}`],
    enabled: !!id,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/posts/${id}/comments`],
    enabled: !!id,
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/posts/${id}/like`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
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

  // Submit comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/posts/${id}/comments`, "POST", { content });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    submitCommentMutation.mutate(comment.trim());
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return first + last || 'U';
  };

  if (postLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Post not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = post.author?.firstName && post.author?.lastName 
    ? `${post.author.firstName} ${post.author.lastName}`
    : post.author?.firstName || 'Anonymous User';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Button>

      {/* Post content */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  {getInitials(post.author?.firstName, post.author?.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{displayName}</h3>
                  {post.userActions?.isFollowing && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      Following
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => likePostMutation.mutate()}
                disabled={likePostMutation.isPending}
              >
                <Heart className={`w-4 h-4 ${post.userActions?.hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {post.stats.likeCount > 0 && (
                  <span className="text-sm">{post.stats.likeCount}</span>
                )}
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {post.stats.commentCount > 0 && (
                  <span className="text-sm">{post.stats.commentCount}</span>
                )}
              </Button>
              
              <BookmarkPopover postId={post.id} />
              
              <Button variant="ghost" size="sm" className="gap-2">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
        </CardHeader>
        <CardContent>
          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="resize-none"
                rows={3}
              />
              <Button
                type="submit"
                disabled={!comment.trim() || submitCommentMutation.isPending}
                className="h-fit"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                      {getInitials(comment.author?.firstName, comment.author?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {comment.author?.firstName && comment.author?.lastName 
                          ? `${comment.author.firstName} ${comment.author.lastName}`
                          : comment.author?.firstName || 'Anonymous User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}