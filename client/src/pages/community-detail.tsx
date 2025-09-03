import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostForm } from "@/components/posts/CreatePostForm";
import { PostCard } from "@/components/posts/PostCard";
import { 
  Users, 
  FileText,
  MessageSquare,
  UserCheck,
  Settings as SettingsIcon
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function CommunityDetail() {
  const { id } = useParams();
  const [isJoined, setIsJoined] = useState(false);

  // Fetch real community data from API
  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: [`/api/communities/${id}`],
    enabled: !!id,
  });

  // Fetch real posts for this community
  const { data: communityPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: [`/api/posts?communityId=${id}`],
    enabled: !!id,
  });

  // Fetch suggested users for "Who to follow"
  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["/api/users/suggested"],
  });

  // Show loading state while data loads
  if (communityLoading) {
    return (
      <TwitterStyleLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  // Show error state if community not found
  if (!community) {
    return (
      <TwitterStyleLayout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Community Not Found</h2>
          <p className="text-gray-600">The community you're looking for doesn't exist.</p>
        </div>
      </TwitterStyleLayout>
    );
  }


  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
    // TODO: API call to join/leave community
  };


  const formatStats = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto">
        {/* Community Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-2xl font-bold mb-2">{community.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {community.memberCount?.toLocaleString() || 0} members
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {community.postCount || 0} posts
                      </span>
                      <span>Created {new Date(community.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isJoined ? "secondary" : "default"}
                      onClick={handleJoinCommunity}
                      className={isJoined ? "" : "bg-purple-600 hover:bg-purple-700"}
                    >
                      {isJoined ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Joined
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Join Community
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardDescription className="text-base mb-4">
                  {community.description}
                </CardDescription>

                <div className="flex flex-wrap gap-2 mb-4">
                  {community.tags?.map((tag: any) => (
                    <Badge key={tag.id || tag.name || tag} variant="secondary">
                      {tag.name || tag}
                    </Badge>
                  ))}
                </div>

                {/* Creator Info */}
                {community.creator && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={community.creator.profileImageUrl} />
                      <AvatarFallback>
                        {community.creator.firstName?.charAt(0)}{community.creator.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        Created by {community.creator.firstName} {community.creator.lastName}
                      </p>
                      {community.creator.bio && (
                        <p className="text-xs text-gray-600">{community.creator.bio}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Share Your Thoughts */}
        <CreatePostForm 
          isModal={false}
          context={{ 
            type: 'community', 
            id: community.id, 
            name: community.name 
          }}
          isJoined={isJoined}
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Posts Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold">Community Posts</h2>
            
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : communityPosts.length > 0 ? (
              <div className="space-y-4">
                {communityPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-500">Be the first to share something in this community!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Who to Follow */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Who to follow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedUsers.slice(0, 3).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user.email?.split('@')[0]}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty State for Non-Members */}
        {!isJoined && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Join to participate</h3>
            <p className="text-gray-500 mb-4">Join this community to view and create posts</p>
            <Button 
              onClick={handleJoinCommunity}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          </div>
        )}
      </div>
    </TwitterStyleLayout>
  );
}