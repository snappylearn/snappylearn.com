import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Search, Grid3X3, List, File, Folder, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CollectionCard } from "@/components/collection-card";
import { CreateCollectionModal } from "@/components/create-collection-modal";
import { TwitterStyleLayout } from "@/components/layout/TwitterStyleLayout";
import { useCollections } from "@/hooks/use-collections";
import { useCreateConversation } from "@/hooks/use-conversations";

export default function Collections() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  const { data: collections = [] } = useCollections();
  const createConversation = useCreateConversation();

  // Filter and sort collections
  const filteredCollections = collections
    .filter(collection =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (collection.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "documents":
          return b.documentCount - a.documentCount;
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const handleStartChat = (collectionId: number) => {
    createConversation.mutate(
      {
        message: "Hello! I'd like to explore this collection.",
        type: "collection",
        collectionId,
      },
      {
        onSuccess: (data) => {
          setLocation(`/conversations/${data.conversation.id}`);
        },
      }
    );
  };

  const handleNewChat = () => {
    setSelectedCollectionId(undefined);
    setLocation("/");
  };

  return (
    <TwitterStyleLayout>
      <div>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Collections</h1>
              <p className="text-sm text-gray-600">Organize your knowledge into collections</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6">
          {/* Search and Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="documents">Most Documents</SelectItem>
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

          {/* Collections Display */}
          {filteredCollections.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onStartChat={handleStartChat}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCollections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Folder className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {collection.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {collection.description || "No description provided"}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <File className="w-3 h-3 mr-1" />
                                {collection.documentCount} documents
                              </span>
                              <span>
                                Updated {new Date(collection.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/collections/${collection.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement share functionality
                              console.log("Share collection:", collection.id);
                            }}
                          >
                            <Share className="w-4 h-4" />
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
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No collections found" : "No collections yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create your first collection to start organizing your knowledge"
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              )}
            </div>
          )}
        </div>
        
        <CreateCollectionModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal} 
        />
      </div>
    </TwitterStyleLayout>
  );
}