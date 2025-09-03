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
  TrendingUp,
  BookOpen
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function TopicDetail() {
  const { id } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch real topic data
  const { data: topic } = useQuery({
    queryKey: [`/api/topics/${id}`],
    enabled: !!id,
  });

  // Fetch posts for this topic
  const { data: topicPosts = [] } = useQuery({
    queryKey: [`/api/posts?topicId=${id}`],
    enabled: !!id,
  });

  // Default topic data for when API is loading
  const defaultTopic = {
    id: parseInt(id || "1"),
    name: "Artificial Intelligence",
    description: "Discussions about artificial intelligence, machine learning, deep learning, and the future of AI technology. Share insights, research, and explore the possibilities of intelligent systems.",
    postCount: 156,
    followerCount: 2400,
    isFollowing: isFollowing,
    category: "Technology",
    tags: ["AI", "Machine Learning", "Deep Learning", "Neural Networks", "Computer Science"],
    trending: true,
    createdAt: "January 2024",
    moderators: [
      { 
        firstName: "Dr. Sarah", 
        lastName: "Chen", 
        profileImageUrl: "/avatars/sarah.jpg",
        bio: "AI Research Scientist"
      }
    ]
  };

  const currentTopic = topic || defaultTopic;

  const handleFollowTopic = () => {
    setIsFollowing(!isFollowing);
    // TODO: API call to follow/unfollow topic
  };


  const formatStats = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <TwitterStyleLayout>
      <div className="max-w-3xl mx-auto">
        {/* Topic Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      {currentTopic.name}
                      {currentTopic.trending && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {currentTopic.category} • Created {currentTopic.createdAt}
                    </p>
                  </div>
                </div>
                
                <CardDescription className="text-base mb-4">
                  {currentTopic.description}
                </CardDescription>

                <div className="flex flex-wrap gap-2 mb-4">
                  {currentTopic.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {formatStats(currentTopic.postCount)} posts
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {formatStats(currentTopic.followerCount)} followers
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  variant={currentTopic.isFollowing ? "secondary" : "default"}
                  onClick={handleFollowTopic}
                  className={currentTopic.isFollowing ? "" : "bg-purple-600 hover:bg-purple-700"}
                >
                  {currentTopic.isFollowing ? "Following" : "Follow Topic"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Share Your Thoughts */}
        <CreatePostForm 
          isModal={false}
          context={{ 
            type: 'topic', 
            id: currentTopic.id, 
            name: currentTopic.name 
          }} 
        />

        {/* Topic Posts */}
        <div className="space-y-4">
          {topicPosts.length > 0 ? (
            topicPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-4">
                  Be the first to start a discussion about {currentTopic.name}!
                </p>
                <Button 
                  onClick={() => document.querySelector('textarea')?.focus()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create First Post
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TwitterStyleLayout>
  );
}