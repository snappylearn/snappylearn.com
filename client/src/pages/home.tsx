import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, BookOpen, Sparkles } from "lucide-react";
import type { PostWithDetails, Topic } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("feed");

  const { data: posts = [], isLoading: postsLoading } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts"],
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/topics"],
  });

  const trendingTopics = topics.slice(0, 6);

  const PostSkeleton = () => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TwitterStyleLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <CreatePostForm />
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Following
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="feed" className="mt-6">
                {postsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <PostSkeleton key={i} />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Be the first to share something with the community!
                      </p>
                      <Button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        Create First Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="trending" className="mt-6">
                <Card className="text-center py-12">
                  <CardContent>
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Trending Content</h3>
                    <p className="text-muted-foreground">
                      Trending posts will appear here as the community grows.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="following" className="mt-6">
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Following Feed</h3>
                    <p className="text-muted-foreground">
                      Posts from people you follow will appear here.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Topics will appear here as content is created.
                  </p>
                ) : (
                  trendingTopics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className="flex items-center gap-2"
                        style={{ 
                          borderColor: topic.color || '#6366f1',
                          color: topic.color || '#6366f1'
                        }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: topic.color || '#6366f1' }}
                        />
                        {topic.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        New
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            
            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Posts</span>
                  <span className="font-semibold">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Topics</span>
                  <span className="font-semibold">{topics.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Today</span>
                  <span className="font-semibold">1</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/my-collections'}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Collections
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/discover'}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Discover
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/chat'}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TwitterStyleLayout>
  );
}