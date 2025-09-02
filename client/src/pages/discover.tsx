import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Heart, 
  Eye, 
  Users, 
  FileText,
  FolderOpen,
  UserPlus,
  Grid,
  List
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("communities");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/collections'],
  });

  const { data: communities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['/api/communities'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users/suggested'],
  });

  // Sample community data for demo
  const sampleCommunities = [
    {
      id: 1,
      name: "AI Researchers",
      description: "Discussion group for AI researchers and enthusiasts",
      memberCount: 2400,
      postCount: 156,
      bannerImage: "/community-banners/ai.jpg",
      tags: ["AI", "Research", "Machine Learning"],
      isJoined: false,
      creator: { firstName: "Dr. Sarah", lastName: "Chen", profileImageUrl: "/avatars/sarah.jpg" }
    },
    {
      id: 2,
      name: "Startup Founders",
      description: "Network of startup founders sharing experiences and advice",
      memberCount: 1800,
      postCount: 342,
      bannerImage: "/community-banners/startups.jpg", 
      tags: ["Startups", "Entrepreneurship", "Business"],
      isJoined: true,
      creator: { firstName: "Mark", lastName: "Rodriguez", profileImageUrl: "/avatars/mark.jpg" }
    },
    {
      id: 3,
      name: "Design Systems",
      description: "Community for designers working on design systems",
      memberCount: 950,
      postCount: 89,
      bannerImage: "/community-banners/design.jpg",
      tags: ["Design", "UI/UX", "Systems"],
      isJoined: false,
      creator: { firstName: "Alex", lastName: "Thompson", profileImageUrl: "/avatars/alex.jpg" }
    }
  ];

  // Sample users data for Who To Follow
  const sampleUsers = [
    {
      id: "1",
      firstName: "Emily",
      lastName: "Chen",
      profileImageUrl: "/avatars/emily.jpg",
      followerCount: 1200,
      postCount: 45,
      isFollowing: false,
      bio: "Product designer passionate about accessible interfaces"
    },
    {
      id: "2", 
      firstName: "Marcus",
      lastName: "Johnson",
      profileImageUrl: "/avatars/marcus.jpg",
      followerCount: 850,
      postCount: 67,
      isFollowing: false,
      bio: "Full-stack developer and open source contributor"
    },
    {
      id: "3",
      firstName: "Sophie",
      lastName: "Martinez",
      profileImageUrl: "/avatars/sophie.jpg",
      followerCount: 2100,
      postCount: 123,
      isFollowing: true,
      bio: "Data scientist sharing insights about ML applications"
    }
  ];

  const featuredCollections = [
    {
      id: 1,
      title: "AI Research Highlights",
      description: "Curated insights from latest AI research papers and breakthroughs",
      author: "Dr. Sarah Chen",
      authorAvatar: "/avatars/sarah.jpg",
      tags: ["AI", "Research", "Machine Learning"],
      stats: { documents: 45, highlights: 128, followers: 2400 },
      updated: "2 days ago",
      isFollowing: false
    },
    {
      id: 2,
      title: "Startup Growth Strategies", 
      description: "Real-world strategies and case studies from successful startup founders",
      author: "Mark Rodriguez",
      authorAvatar: "/avatars/mark.jpg",
      tags: ["Startups", "Growth", "Strategy"],
      stats: { documents: 32, highlights: 89, followers: 1800 },
      updated: "1 day ago",
      isFollowing: true
    },
    {
      id: 3,
      title: "Philosophy & Ethics",
      description: "Deep dives into philosophical concepts and ethical frameworks",
      author: "Prof. Elena Vasquez",
      authorAvatar: "/avatars/elena.jpg", 
      tags: ["Ethics", "Philosophy", "Critical Thinking"],
      stats: { documents: 67, highlights: 234, followers: 3200 },
      updated: "3 days ago",
      isFollowing: false
    },
    {
      id: 4,
      title: "Design Systems Guide",
      description: "Comprehensive guide to building and maintaining design systems",
      author: "Alex Thompson",
      authorAvatar: "/avatars/alex.jpg",
      tags: ["Design", "UI/UX", "Systems"],
      stats: { documents: 28, highlights: 156, followers: 950 },
      updated: "1 week ago",
      isFollowing: false
    }
  ];

  // Combine collections with sample data for display
  const allCollections = [
    ...collections.map(col => ({
      id: col.id,
      title: col.name,
      description: col.description || "No description available",
      author: "User",
      authorAvatar: "/avatars/default.jpg",
      tags: ["Notebook"],
      stats: { documents: 0, highlights: 0, followers: 0 },
      updated: "Recently",
      isFollowing: false
    })),
    ...featuredCollections
  ];

  const filteredCommunities = sampleCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = allCollections.filter(collection =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = sampleUsers.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCommunityCard = (community: any) => (
    <Card key={community.id} className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {community.name}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {community.description}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={community.creator.profileImageUrl} />
            <AvatarFallback className="text-xs">
              {community.creator.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700">
            {community.creator.firstName} {community.creator.lastName}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {community.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600 mb-4">
          <div>
            <div className="font-semibold text-gray-900">{community.memberCount}</div>
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3" />
              Members
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{community.postCount}</div>
            <div className="flex items-center justify-center gap-1">
              <FileText className="h-3 w-3" />
              Posts
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant={community.isJoined ? "secondary" : "default"}
            >
              {community.isJoined ? "Joined" : "Join"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
          <p className="text-gray-600">Find communities, notebooks, and people to follow</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search communities, notebooks, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Communities
            </TabsTrigger>
            <TabsTrigger value="notebooks" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Notebooks
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Who To Follow
            </TabsTrigger>
          </TabsList>

          {/* Communities Tab */}
          <TabsContent value="communities" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Communities</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
              : "space-y-4"
            }>
              {filteredCommunities.map(renderCommunityCard)}
            </div>

            {filteredCommunities.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No communities found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </TabsContent>

          {/* Notebooks Tab */}
          <TabsContent value="notebooks" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Notebooks</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredCollections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {collection.title}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {collection.description}
                    </CardDescription>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={collection.authorAvatar} />
                        <AvatarFallback className="text-xs">
                          {collection.author.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700">
                        {collection.author}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {collection.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-600 mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">{collection.stats.documents}</div>
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3 w-3" />
                          Documents
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{collection.stats.highlights}</div>
                        <div className="flex items-center justify-center gap-1">
                          <Heart className="h-3 w-3" />
                          Highlights
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{collection.stats.followers}</div>
                        <div className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          Followers
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={collection.isFollowing ? "secondary" : "default"}
                        >
                          {collection.isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500">
                        Updated {collection.updated}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No notebooks found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </TabsContent>

          {/* Who To Follow Tab */}
          <TabsContent value="people" className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Who To Follow</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="text-center pb-3">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={user.profileImageUrl} />
                      <AvatarFallback className="text-lg">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {user.bio}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-600 mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">{user.followerCount}</div>
                        <div>Followers</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.postCount}</div>
                        <div>Posts</div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={user.isFollowing ? "secondary" : "default"}
                      className="w-full"
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TwitterStyleLayout>
  );
}