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

export default function Communities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    tags: ""
  });

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['/api/communities'],
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

  const filteredCommunities = sampleCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateCommunity = () => {
    // TODO: Implement API call to create community
    console.log("Creating community:", newCommunity);
    setCreateDialogOpen(false);
    setNewCommunity({ name: "", description: "", tags: "" });
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
                // TODO: Implement join/leave community functionality
                console.log(community.isJoined ? "Leave community:" : "Join community:", community.id);
              }}
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
                // TODO: Implement join/leave community functionality
                console.log(community.isJoined ? "Leave community:" : "Join community:", community.id);
              }}
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
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newCommunity.tags}
                    onChange={(e) => setNewCommunity(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g. Tech, AI, Startups"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCommunity} disabled={!newCommunity.name.trim()}>
                  Create Community
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