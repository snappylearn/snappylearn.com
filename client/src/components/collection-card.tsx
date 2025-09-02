import { Folder, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CollectionWithStats } from "@shared/schema";
import { useLocation } from "wouter";
import { useDeleteCollection } from "@/hooks/use-collections";

interface CollectionCardProps {
  collection: CollectionWithStats;
  onStartChat?: (collectionId: number) => void;
}

export function CollectionCard({ collection, onStartChat }: CollectionCardProps) {
  const [, setLocation] = useLocation();
  const deleteCollection = useDeleteCollection();

  const getCollectionColor = (id: number) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600", 
      "bg-purple-100 text-purple-600",
      "bg-orange-100 text-orange-600",
      "bg-pink-100 text-pink-600",
      "bg-cyan-100 text-cyan-600"
    ];
    return colors[id % colors.length];
  };

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(collection.id);
    }
  };

  const handleViewCollection = () => {
    setLocation(`/collections/${collection.id}`);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this notebook? This will also delete all associated documents and conversations.")) {
      deleteCollection.mutate(collection.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCollectionColor(collection.id)}`}>
            <Folder className="w-6 h-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewCollection}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete Notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{collection.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{collection.description || "No description provided"}</p>
        
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-gray-500">{collection.documentCount} documents</span>
          <span className="text-gray-500">
            {collection.lastUsed && collection.lastUsed !== "Invalid Date" 
              ? (() => {
                  const date = new Date(collection.lastUsed);
                  return !isNaN(date.getTime()) ? date.toLocaleDateString() : "Never used";
                })()
              : "Never used"
            }
          </span>
        </div>
        
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <Button onClick={handleStartChat} className="flex-1 bg-primary hover:bg-primary/90 text-white">
            Open Chat
          </Button>
          <Button onClick={handleViewCollection} variant="outline" className="px-3">
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
