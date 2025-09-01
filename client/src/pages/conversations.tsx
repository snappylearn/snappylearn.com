import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Search, Grid3X3, List, MessageSquare, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConversationCard } from "@/components/conversation-card";
import { Sidebar } from "@/components/sidebar";
import { useConversations } from "@/hooks/use-conversations";
import { useCollections } from "@/hooks/use-collections";

export default function Conversations() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  
  const { data: conversations = [] } = useConversations();
  const { data: collections = [] } = useCollections();

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter(conversation => {
      const matchesSearch = conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           conversation.preview.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterBy === "all") return matchesSearch;
      if (filterBy === "independent") return matchesSearch && conversation.type === "independent";
      if (filterBy === "collection") return matchesSearch && conversation.type === "collection";
      
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "messages":
          return b.messageCount - a.messageCount;
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const handleNewChat = () => {
    setSelectedCollectionId(undefined);
    setLocation("/");
  };

  const handleCreateConversation = () => {
    // Navigate to dashboard for new chat, same as sidebar New Chat button
    setLocation("/");
  };

  const getCollectionName = (collectionId?: number) => {
    if (!collectionId) return null;
    const collection = collections.find(c => c.id === collectionId);
    return collection?.name;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        selectedCollectionId={selectedCollectionId}
        onSelectCollection={setSelectedCollectionId}
        onNewChat={handleNewChat}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
              <p className="text-sm text-gray-600">All your AI conversations in one place</p>
            </div>
            <Button
              onClick={handleCreateConversation}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Search and Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="independent">Independent</SelectItem>
                  <SelectItem value="collection">Collection-based</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="messages">Most Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`${
                  viewMode === "grid" 
                    ? "bg-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`${
                  viewMode === "list" 
                    ? "bg-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conversations Display */}
          {filteredConversations.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConversations.map((conversation) => (
                  <ConversationCard key={conversation.id} conversation={conversation} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/conversations/${conversation.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {conversation.title}
                              </h3>
                              <Badge 
                                variant={conversation.type === "collection" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {conversation.type === "collection" ? "Collection" : "Independent"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                              {conversation.preview}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <MessageSquare className="w-3 h-3 mr-1" />
                                {conversation.messageCount} messages
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(conversation.updatedAt)}
                              </span>
                              {conversation.collectionId && (
                                <span className="text-blue-600">
                                  {getCollectionName(conversation.collectionId)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/conversations/${conversation.id}`);
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms or filters" 
                  : "Start your first conversation to begin organizing your knowledge"
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreateConversation}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Conversation
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}