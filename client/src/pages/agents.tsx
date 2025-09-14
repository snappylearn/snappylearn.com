import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { UserCard } from "@/components/user/UserCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Bot, Plus, Grid3X3, List } from "lucide-react";
import { useUsers, useFollowUser } from "@/hooks/use-collections";

// Assistant category mapping
const assistantCategoryMapping: { [key: string]: string } = {
  "agent-einstein": "science-discovery",
  "agent-curie": "science-discovery", 
  "agent-tesla": "science-discovery",
  "agent-socrates": "philosophy-wisdom",
  "agent-davinci": "creativity-arts"
};

// Assistant category data (will be fetched from API later)
const assistantCategories = [
  { id: 1, name: "Science & Discovery", slug: "science-discovery", count: 3, color: "#3b82f6" },
  { id: 2, name: "Philosophy & Wisdom", slug: "philosophy-wisdom", count: 1, color: "#8b5cf6" },
  { id: 3, name: "Creativity & Arts", slug: "creativity-arts", count: 1, color: "#ec4899" },
];

export default function Assistants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all users and filter for AI assistants
  const { data: allUsers = [], isLoading } = useUsers();
  const followUser = useFollowUser();

  // Filter for AI assistants (userTypeId === 2) - exclude humans
  const assistants = (allUsers as any[]).filter((user: any) => user.userTypeId === 2);
  
  // Filter assistants based on search query and category
  const filteredAssistants = assistants.filter((assistant: any) => {
    const matchesSearch = `${assistant.firstName || ''} ${assistant.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (assistant.about || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category if one is selected
    const matchesCategory = selectedCategory === null || assistantCategoryMapping[assistant.id] === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleFollow = (userId: string) => {
    followUser.mutate(userId);
  };

  const handleUnfollow = (userId: string) => {
    followUser.mutate(userId);
  };

  return (
    <TwitterStyleLayout>
      <div>
        {/* Header - Clean and balanced like Communities */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Assistants</h1>
            <p className="text-gray-600">Discover and interact with our collection of AI-powered assistants, each with unique personalities and expertise.</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Assistant
          </Button>
        </div>

        {/* Category Filters - Single line with horizontal scroll */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
            >
              All ({assistants.length})
            </Button>
            {assistantCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)}
                className="whitespace-nowrap"
                style={{ 
                  backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                  borderColor: selectedCategory === category.slug ? category.color : undefined,
                  color: selectedCategory === category.slug ? 'white' : category.color
                }}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search assistants..."
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
              <Grid3X3 className="h-4 w-4" />
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

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Assistants Grid/List */}
        {!isLoading && filteredAssistants.length > 0 && (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
              : "space-y-4"
          }>
            {filteredAssistants.map((assistant: any) => (
              <UserCard
                key={assistant.id}
                user={assistant}
                variant={viewMode === "grid" ? "vertical" : "horizontal"}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAssistants.length === 0 && (
          <div className="text-center py-12">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assistants found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms.' : 'No AI assistants are available at the moment.'}
            </p>
          </div>
        )}
      </div>
    </TwitterStyleLayout>
  );
}