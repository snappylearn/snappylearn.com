import { Folder, MoreHorizontal, Share, User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CollectionWithStats } from "@shared/schema";
import { useLocation } from "wouter";
import { useDeleteCollection, useUpdateCollection } from "@/hooks/use-collections";
import { useState } from "react";

interface CollectionCardProps {
  collection: CollectionWithStats;
  onStartChat?: (collectionId: number) => void;
}

export function CollectionCard({ collection, onStartChat }: CollectionCardProps) {
  const [, setLocation] = useLocation();
  const deleteCollection = useDeleteCollection();
  const updateCollection = useUpdateCollection();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const [editDescription, setEditDescription] = useState(collection.description || "");

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

  const handleEdit = () => {
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateCollection.mutate(
      {
        id: collection.id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
        },
      }
    );
  };

  const handleEditCancel = () => {
    setEditName(collection.name);
    setEditDescription(collection.description || "");
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this notebook? This will also delete all associated documents and conversations.")) {
      deleteCollection.mutate({ id: collection.id, name: collection.name });
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
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Notebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete Notebook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{collection.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{collection.description || "No description provided"}</p>
        
        {/* Owner Details */}
        <div className="flex items-center space-x-2 mb-2">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">
            {collection.visibilityTypeId === 1 ? 'Private' : 
             collection.visibilityTypeId === 2 ? 'Shared' :
             'Public'} • Created by you
          </span>
        </div>
        
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
          <Button onClick={handleViewCollection} variant="outline" className="flex-1">
            View
          </Button>
          <Button onClick={() => {
            // TODO: Implement share functionality
            console.log("Share collection:", collection.id);
          }} variant="outline" className="px-3">
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notebook</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Notebook Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter notebook name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleEditCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCollection.isPending}>
                {updateCollection.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
