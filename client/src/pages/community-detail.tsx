import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  FileText,
  MessageSquare,
  Heart,
  Share,
  MoreHorizontal,
  Send,
  UserCheck,
  Settings as SettingsIcon
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function CommunityDetail() {
  const { id } = useParams();
  const [newPost, setNewPost] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  // Sample community data
  const community = {
    id: parseInt(id || "1"),
    name: "AI Researchers",
    description: "Discussion group for AI researchers and enthusiasts sharing latest papers, insights, and breakthroughs in artificial intelligence. Connect with fellow researchers, share your work, and stay updated on the cutting edge of AI development.",
    memberCount: 2400,
    postCount: 156,
    bannerImage: "/community-banners/ai.jpg",
    tags: ["AI", "Research", "Machine Learning", "Deep Learning", "Neural Networks"],
    isJoined: isJoined,
    creator: { 
      firstName: "Dr. Sarah", 
      lastName: "Chen", 
      profileImageUrl: "/avatars/sarah.jpg",
      bio: "AI Research Scientist at Stanford University"
    },
    createdAt: "March 2024",
    rules: [
      "Keep discussions relevant to AI and machine learning",
      "Share original research and insights",
      "Be respectful and constructive in all interactions",
      "No spam or self-promotion without context"
    ]
  };

  // Sample posts for this community
  const communityPosts = [
    {
      id: 1,
      content: "Just published our latest paper on transformer efficiency! We achieved 40% faster training with minimal accuracy loss. The key insight was optimizing attention computation patterns. Link to paper in comments. #AI #Research",
      author: {
        id: "1",
        firstName: "Dr. Sarah",
        lastName: "Chen",
        profileImageUrl: "/avatars/sarah.jpg"
      },
      createdAt: "2 hours ago",
      stats: {
        likes: 24,
        comments: 8,
        shares: 5
      },
      isLiked: false,
      communityId: 1
    },
    {
      id: 2,
      content: "Has anyone experimented with the new GPT-4 Vision capabilities for medical imaging? I'm curious about performance compared to specialized models. Working on a project and would love to hear experiences.",
      author: {
        id: "2",
        firstName: "Marcus",
        lastName: "Johnson",
        profileImageUrl: "/avatars/marcus.jpg"
      },
      createdAt: "4 hours ago",
      stats: {
        likes: 18,
        comments: 12,
        shares: 3
      },
      isLiked: true,
      communityId: 1
    },
    {
      id: 3,
      content: "Breakthrough in our lab! We've developed a new architecture that reduces hallucinations in language models by 60%. The approach combines retrieval-augmented generation with confidence scoring. Excited to share more details soon!",
      author: {
        id: "3",
        firstName: "Elena",
        lastName: "Vasquez",
        profileImageUrl: "/avatars/elena.jpg"
      },
      createdAt: "1 day ago",
      stats: {
        likes: 67,
        comments: 23,
        shares: 15
      },
      isLiked: false,
      communityId: 1
    }
  ];

  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
    // TODO: API call to join/leave community
  };

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      // TODO: API call to create post
      console.log("Creating post:", newPost);
      setNewPost("");
    }
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
                        {community.memberCount.toLocaleString()} members
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {community.postCount} posts
                      </span>
                      <span>Created {community.createdAt}</span>
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
                  {community.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Creator Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={community.creator.profileImageUrl} />
                    <AvatarFallback>
                      {community.creator.firstName.charAt(0)}{community.creator.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      Created by {community.creator.firstName} {community.creator.lastName}
                    </p>
                    <p className="text-xs text-gray-600">{community.creator.bio}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Post Creation */}
        {isJoined && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Add Post to Community</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Share your thoughts, research, or questions with the community..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {newPost.length}/280 characters
                  </span>
                  <Button 
                    onClick={handlePostSubmit}
                    disabled={!newPost.trim() || newPost.length > 280}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Community Posts</h2>
          
          {communityPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-sm transition-shadow duration-200">
              <CardContent className="p-6">
                {/* Post Header */}
                <div className="flex items-start space-x-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author.profileImageUrl} />
                    <AvatarFallback>
                      {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-sm">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <span className="text-gray-500 text-sm">•</span>
                      <span className="text-gray-500 text-sm">{post.createdAt}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-6">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-gray-500 hover:text-red-500 ${post.isLiked ? 'text-red-500' : ''}`}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                      {formatStats(post.stats.likes)}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {formatStats(post.stats.comments)}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                      <Share className="h-4 w-4 mr-1" />
                      {formatStats(post.stats.shares)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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