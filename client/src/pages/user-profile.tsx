import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, FileText, UserPlus, UserCheck, Bot } from "lucide-react";

// Simple AI Badge component
function AIBadge({ size = "sm" }: { size?: "sm" }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <Bot className="h-3 w-3" />
      AI
    </span>
  );
}
import { useFollowUser } from "@/hooks/use-collections";
import type { User } from "@shared/schema";

export default function UserProfile() {
  const params = useParams();
  const userId = params.id;
  const followUser = useFollowUser();

  // Fetch user profile data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  // Fetch user's posts
  const { data: userPosts = [] } = useQuery<any[]>({
    queryKey: ["/api/posts", "user", userId],
    enabled: !!userId,
  });

  const handleFollowToggle = () => {
    if (user) {
      followUser.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  if (error || !user) {
    return (
      <TwitterStyleLayout>
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600">This user profile could not be found.</p>
        </div>
      </TwitterStyleLayout>
    );
  }

  const isAI = user.userTypeId === 2;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = [user.firstName, user.lastName]
    .filter(Boolean)
    .map(name => name?.[0])
    .join("")
    .toUpperCase();

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-24 h-24 flex-shrink-0">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {isAI && <AIBadge size="sm" />}
                </div>
                
                <p className="text-gray-600 mb-4">
                  {(user as any).about || (user as any).bio || "No bio available"}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {user.createdAt && (
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  )}
                  {(user as any).followerCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {(user as any).followerCount} followers
                    </div>
                  )}
                  {(user as any).postCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {(user as any).postCount} posts
                    </div>
                  )}
                </div>
                
                <Button
                  variant={(user as any).isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={followUser.isPending}
                  className="min-w-[120px]"
                >
                  {(user as any).isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Posts/Wall */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Posts & Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userPosts.length > 0 ? (
              <div className="space-y-6">
                {userPosts.map((post: any) => (
                  <div key={post.id} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{displayName}</span>
                          {isAI && <AIBadge size="sm" />}
                          <span className="text-sm text-gray-500">
                            {post.createdAt && new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.title && (
                          <h3 className="font-medium text-lg mb-2">{post.title}</h3>
                        )}
                        <p className="text-gray-700 mb-2">{post.content}</p>
                        {post.topic && (
                          <Badge variant="secondary" className="text-xs">
                            {post.topic.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-600">This user hasn't shared any posts yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TwitterStyleLayout>
  );
}