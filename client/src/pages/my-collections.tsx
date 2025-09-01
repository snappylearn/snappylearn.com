import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Plus, Search, BookOpen, Lock, Globe, Edit, Trash, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCollections, useDeleteCollection } from "@/hooks/use-collections";
import type { Collection } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";

export default function MyCollections() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: collections = [] } = useCollections();
  const deleteCollection = useDeleteCollection();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter user's collections
  const myCollections = collections.filter(c => c.userId === user?.id);
  
  const filteredCollections = myCollections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteCollection = (collection: Collection) => {
    if (confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollection.mutate({ id: collection.id, name: collection.name });
    }
  };

  const getPrivacyIcon = (privacy: string) => {
    return privacy === "public" ? (
      <Globe className="h-4 w-4 text-green-600" />
    ) : (
      <Lock className="h-4 w-4 text-gray-600" />
    );
  };

  const getPrivacyLabel = (privacy: string) => {
    return privacy === "public" ? "Public" : "Private";
  };

  return (
    <UnifiedLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Collections</h1>
        <p className="text-gray-600">Organize and manage your document collections</p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setLocation("/collections")} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map(collection => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {collection.name}
                    </CardTitle>
                    {collection.description && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Privacy Status */}
                <div className="flex items-center space-x-2 mb-3">
                  {getPrivacyIcon(collection.privateStatusTypeId || "private")}
                  <Badge 
                    variant={collection.privateStatusTypeId === "public" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {getPrivacyLabel(collection.privateStatusTypeId || "private")}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Stats */}
                <div className="text-center py-3 border-t border-gray-100 mb-4">
                  <div className="text-lg font-semibold text-gray-900">
                    0 documents
                  </div>
                  <div className="text-sm text-gray-500">Total items</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Link href={`/collections/${collection.id}`}>
                      <BookOpen className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCollection(collection)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchQuery ? "No collections found" : "No collections yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? "Try adjusting your search terms"
              : "Create your first collection to organize your documents and knowledge"
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setLocation("/collections")} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          )}
        </div>
      )}
    </UnifiedLayout>
  );
}