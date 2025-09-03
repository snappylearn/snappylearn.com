import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { communitiesApi } from "@/lib/api";
import { 
  Search, 
  Eye, 
  Users, 
  FileText,
  Grid,
  List,
  Plus,
  UserPlus,
  X
} from "lucide-react";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import type { CommunityWithStats, Tag } from "@shared/schema";

export default function Communities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    selectedTags: [] as number[],
    visibility: "public"
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch tags for multi-select (using topics as tags)
  const { data: availableTags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/topics'],
  });

  const { data: communities = [], isLoading } = useQuery<CommunityWithStats[]>({
    queryKey: ['/api/communities'],
    queryFn: communitiesApi.getAll,
  });

  // Mutations for join/leave
  const joinCommunityMutation = useMutation({
    mutationFn: (communityId: number) => communitiesApi.join(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Success",
        description: "Successfully joined the community!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: (communityId: number) => communitiesApi.leave(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Success", 
        description: "Successfully left the community.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sample communities data for demo
  const sampleCommunities = [
    {
      id: 1,
      name: "AI Researchers",
      description: "Discussion group for AI researchers and enthusiasts sharing latest papers, insights, and breakthroughs in artificial intelligence",
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
      description: "Network of startup founders sharing experiences, advice, and strategies for building successful companies",
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
      description: "Community for designers working on design systems, component libraries, and design operations",
      memberCount: 950,
      postCount: 89,
      bannerImage: "/community-banners/design.jpg",
      tags: ["Design", "UI/UX", "Systems"],
      isJoined: false,
      creator: { firstName: "Alex", lastName: "Thompson", profileImageUrl: "/avatars/alex.jpg" }
    },
    {
      id: 4,
      name: "Web3 Developers",
      description: "Developers building decentralized applications, smart contracts, and blockchain solutions",
      memberCount: 1650,
      postCount: 234,
      bannerImage: "/community-banners/web3.jpg",
      tags: ["Web3", "Blockchain", "DApps"],
      isJoined: false,
      creator: { firstName: "Elena", lastName: "Vasquez", profileImageUrl: "/avatars/elena.jpg" }
    },
    {
      id: 5,
      name: "Data Science",
      description: "Data scientists, analysts, and ML engineers sharing insights, techniques, and career advice",
      memberCount: 3200,
      postCount: 567,
      bannerImage: "/community-banners/data.jpg",
      tags: ["Data Science", "Analytics", "Python"],
      isJoined: true,
      creator: { firstName: "Michael", lastName: "Zhang", profileImageUrl: "/avatars/michael.jpg" }
    },
    {
      id: 6,
      name: "Remote Workers",
      description: "Community for remote workers sharing tips, tools, and experiences about distributed work",
      memberCount: 2100,
      postCount: 445,
      bannerImage: "/community-banners/remote.jpg",
      tags: ["Remote Work", "Productivity", "Lifestyle"],
      isJoined: false,
      creator: { firstName: "Lisa", lastName: "Park", profileImageUrl: "/avatars/lisa.jpg" }
    }
  ];

  // Use real communities data instead of sample data
  const communitiesData: CommunityWithStats[] = communities.length > 0 ? communities : sampleCommunities;
  
  const filteredCommunities = communitiesData.filter((community: CommunityWithStats) =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (community.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (community.tags || []).some((tag: Tag | any) => 
      (typeof tag === 'string' ? tag : tag.name).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: communitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Success",
        description: "Community created successfully!",
      });
      setCreateDialogOpen(false);
      setNewCommunity({ name: "", description: "", selectedTags: [], visibility: "public" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create community",
        variant: "destructive",
      });
    },
  });

  const handleCreateCommunity = () => {
    if (!newCommunity.name.trim()) {
      toast({
        title: "Error",
        description: "Community name is required",
        variant: "destructive",
      });
      return;
    }

    createCommunityMutation.mutate({
      name: newCommunity.name,
      description: newCommunity.description,
      visibility: newCommunity.visibility,
      tagIds: newCommunity.selectedTags,
    });
  };

  const toggleTag = (tagId: number) => {
    setNewCommunity(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const renderCommunityCard = (community: any) => (
    <Card key={community.id} className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {community.name}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-3">
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
            <div className="font-semibold text-gray-900">{community.memberCount.toLocaleString()}</div>
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
            <Link href={`/communities/${community.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant={community.isJoined ? "secondary" : "default"}
              onClick={() => {
                if (community.isJoined) {
                  leaveCommunityMutation.mutate(community.id);
                } else {
                  joinCommunityMutation.mutate(community.id);
                }
              }}
              disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
            >
              {community.isJoined ? "Joined" : "Join"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListItem = (community: any) => (
    <Card key={community.id} className="hover:shadow-sm transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={community.creator.profileImageUrl} />
              <AvatarFallback>
                {community.creator.firstName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-1">{community.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2 mt-1">{community.description}</p>
              
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {community.memberCount.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {community.postCount} posts
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {community.tags.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Link href={`/communities/${community.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            <Button
              size="sm"
              variant={community.isJoined ? "secondary" : "default"}
              onClick={() => {
                if (community.isJoined) {
                  leaveCommunityMutation.mutate(community.id);
                } else {
                  joinCommunityMutation.mutate(community.id);
                }
              }}
              disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
            >
              {community.isJoined ? "Joined" : "Join"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <TwitterStyleLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </TwitterStyleLayout>
    );
  }

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Communities</h1>
            <p className="text-gray-600">Join public communities and connect with like-minded people</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Community</DialogTitle>
                <DialogDescription>
                  Create a public community for others to discover and join.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Community Name</Label>
                  <Input
                    id="name"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter community name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this community is about"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <div className="space-y-2">
                    {/* Selected tags as pills */}
                    {newCommunity.selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newCommunity.selectedTags.map((tagId) => {
                          const tag = availableTags.find((t: any) => t.id === tagId);
                          return tag ? (
                            <div
                              key={tag.id}
                              className="flex items-center gap-1 px-3 py-1 bg-purple-100 border border-purple-300 text-purple-700 rounded-full text-sm"
                            >
                              <span>{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    {/* Dropdown for selecting tags */}
                    <Select
                      value=""
                      onValueChange={(value) => {
                        const tagId = parseInt(value);
                        if (!newCommunity.selectedTags.includes(tagId)) {
                          toggleTag(tagId);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tags..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTags.length === 0 ? (
                          <SelectItem value="" disabled>No tags available</SelectItem>
                        ) : (
                          availableTags
                            .filter((tag: any) => !newCommunity.selectedTags.includes(tag.id))
                            .map((tag: any) => (
                              <SelectItem key={tag.id} value={tag.id.toString()}>
                                {tag.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={newCommunity.visibility}
                    onValueChange={(value) => setNewCommunity(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can join</SelectItem>
                      <SelectItem value="private">Private - Invitation only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCommunity} 
                  disabled={!newCommunity.name.trim() || createCommunityMutation.isPending}
                >
                  {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search communities by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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

        {/* Communities */}
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
          : "space-y-4"
        }>
          {filteredCommunities.map(viewMode === "grid" ? renderCommunityCard : renderListItem)}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No communities found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search terms or create a new community</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </div>
        )}
      </div>
    </TwitterStyleLayout>
  );
}