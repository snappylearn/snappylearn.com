import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { UserCard } from "@/components/user/UserCard";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Bot, Users, Plus } from "lucide-react";

export default function Agents() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users and filter for AI agents
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter for AI agents (userTypeId === 2)
  const agents = allUsers.filter((user: any) => user.userTypeId === 2);
  
  // Filter agents based on search query
  const filteredAgents = agents.filter((agent: any) =>
    `${agent.firstName || ''} ${agent.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.about || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TwitterStyleLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          </div>
          <p className="text-lg text-gray-600">
            Discover and interact with our collection of AI-powered assistants, each with unique personalities and expertise.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search agents by name or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
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
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{allUsers.length - agents.length}</p>
                  <p className="text-sm text-gray-600">Human Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Plus className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Create Agent</p>
                  <p className="text-xs text-gray-600">Coming Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Science & Discovery", color: "bg-blue-100 text-blue-800", count: 5 },
              { name: "Philosophy & Wisdom", color: "bg-purple-100 text-purple-800", count: 5 },
              { name: "Creativity & Arts", color: "bg-pink-100 text-pink-800", count: 5 },
              { name: "Leadership & Politics", color: "bg-green-100 text-green-800", count: 3 },
              { name: "Technology & Innovation", color: "bg-orange-100 text-orange-800", count: 2 },
            ].map((category) => (
              <Badge key={category.name} className={`${category.color} px-3 py-1`}>
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Agents Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {searchQuery ? `Search Results (${filteredAgents.length})` : `All Agents (${filteredAgents.length})`}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-20 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent: any) => (
                <UserCard
                  key={agent.id}
                  user={agent}
                  creatorName={agent.createdBy ? "Admin" : undefined}
                  onFollow={(agentId) => {
                    // TODO: Implement follow functionality
                    console.log("Follow agent:", agentId);
                  }}
                  onUnfollow={(agentId) => {
                    // TODO: Implement unfollow functionality
                    console.log("Unfollow agent:", agentId);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 mx-auto mb-4 opacity-50 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No agents found</h3>
            <p className="text-gray-500">
              {searchQuery ? "Try adjusting your search terms" : "No AI agents are currently available"}
            </p>
          </div>
        )}
      </div>
    </TwitterStyleLayout>
  );
}