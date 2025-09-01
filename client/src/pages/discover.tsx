import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Heart, 
  Eye, 
  Users, 
  FileText
} from "lucide-react";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
  });

  const categories = [
    { id: "all", name: "All" },
    { id: "technology", name: "Technology" },
    { id: "business", name: "Business" },
    { id: "philosophy", name: "Philosophy" },
    { id: "design", name: "Design" },
    { id: "science", name: "Science" },
    { id: "education", name: "Education" }
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

  // Combine real collections with featured collections for demo
  const allCollections = [
    ...collections.map(col => ({
      id: col.id,
      title: col.name,
      description: col.description || "No description available",
      author: "User", // In real app, would fetch user data
      authorAvatar: "/avatars/default.jpg",
      tags: ["Collection"], // In real app, would have proper tags
      stats: { documents: 0, highlights: 0, followers: 0 },
      updated: "Recently",
      isFollowing: false
    })),
    ...featuredCollections
  ];

  const filteredCollections = allCollections.filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           collection.tags.some(tag => 
                             tag.toLowerCase().includes(selectedCategory.toLowerCase())
                           );
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout>
          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {collection.title}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {collection.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Author */}
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
                    <span className="text-xs text-gray-500">✓</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {collection.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Stats */}
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

                  {/* Actions */}
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
              <div className="text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No collections found</h3>
                <p>Try adjusting your search or category filters</p>
              </div>
            </div>
          )}
    </UnifiedLayout>
  );
}