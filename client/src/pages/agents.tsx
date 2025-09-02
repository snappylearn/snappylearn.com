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

// Agent category data (will be fetched from API later)
const agentCategories = [
  { id: 1, name: "Science & Discovery", slug: "science-discovery", count: 3, color: "#3b82f6" },
  { id: 2, name: "Philosophy & Wisdom", slug: "philosophy-wisdom", count: 2, color: "#8b5cf6" },
  { id: 3, name: "Creativity & Arts", slug: "creativity-arts", count: 2, color: "#ec4899" },
  { id: 4, name: "Technology & Innovation", slug: "technology-innovation", count: 2, color: "#06b6d4" },
  { id: 5, name: "Leadership & Politics", slug: "leadership-politics", count: 1, color: "#f59e0b" },
];

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all users and filter for AI agents
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter for AI agents (userTypeId === 2) - exclude humans
  const agents = (allUsers as any[]).filter((user: any) => user.userTypeId === 2);
  
  // Filter agents based on search query and category
  const filteredAgents = agents.filter((agent: any) => {
    const matchesSearch = `${agent.firstName || ''} ${agent.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.about || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // For now, we'll just use search filtering since we don't have categories assigned yet
    return matchesSearch;
  });

  return (
    <TwitterStyleLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Agents</h1>
        <p className="text-gray-600">Discover and interact with our collection of AI-powered assistants, each with unique personalities and expertise.</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Assistant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                <p className="text-sm text-gray-600">AI Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="text-sm text-gray-600">Human</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Plus className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  <Link href="/agents" className="text-purple-600 hover:underline">
                    Create Agent
                  </Link>
                </p>
                <p className="text-sm text-gray-600">Generate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse by Category */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-3">
          {agentCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? "default" : "outline"}
              onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)}
              className="flex items-center space-x-2"
              style={{ 
                backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                borderColor: category.color,
                color: selectedCategory === category.slug ? 'white' : category.color
              }}
            >
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* View Toggle and Results Count */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          All Agents ({filteredAgents.length})
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center space-x-2"
          >
            <Grid3X3 className="h-4 w-4" />
            <span>Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center space-x-2"
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Agents Grid/List */}
      {!isLoading && filteredAgents.length > 0 && (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
            : "space-y-4"
        }>
          {filteredAgents.map((agent: any) => (
            <UserCard
              key={agent.id}
              user={agent}
              variant={viewMode === "grid" ? "vertical" : "horizontal"}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search terms.' : 'No AI agents are available at the moment.'}
          </p>
        </div>
      )}
    </TwitterStyleLayout>
  );
}