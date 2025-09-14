import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bookmark, Plus, Folder, Lock } from "lucide-react";
import type { Collection } from "@shared/schema";

interface BookmarkPopoverProps {
  postId: number;
  postTitle: string;
  postContent: string;
  isBookmarked?: boolean;
  children?: React.ReactNode;
}

export function BookmarkPopover({ 
  postId, 
  postTitle, 
  postContent, 
  isBookmarked = false,
  children 
}: BookmarkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const initialized = useRef(false);
  const userDirty = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's collections
  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
    enabled: open,
  });

  // Fetch collections this post is already saved to
  const { data: existingBookmarks = [] } = useQuery<{ collectionId: number }[]>({
    queryKey: ['/api/bookmarks', postId],
    enabled: open,
  });

  // Create new collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest('/api/collections', 'POST', data);
    },
    onSuccess: (newCollection: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setSelectedCollections(prev => [...prev, newCollection.id]);
      setNewCollectionName("");
      setIsCreatingCollection(false);
      toast({
        title: "Collection created",
        description: `"${newCollection.name}" has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bookmark post mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (data: { postId: number; collectionIds: number[] }) => {
      return await apiRequest('/api/bookmarks', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks', postId] });
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setOpen(false);
      setSelectedCollections([]);
      toast({
        title: "Post saved",
        description: `"${postTitle}" has been saved to your selected collections.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize selected collections when popover opens
  React.useEffect(() => {
    if (open) {
      // Reset tracking when popover opens
      initialized.current = false;
      userDirty.current = false;
      setSelectedCollections([]);
    }
  }, [open]);
  
  // Initialize from existing bookmarks only once per open session
  React.useEffect(() => {
    if (open && !initialized.current && !userDirty.current && Array.isArray(existingBookmarks)) {
      if (existingBookmarks.length > 0) {
        const bookmarkedCollections = existingBookmarks.map(b => b.collectionId);
        setSelectedCollections(bookmarkedCollections);
      }
      initialized.current = true;
    }
  }, [open, existingBookmarks]);

  const handleCollectionToggle = (collectionId: number, checked: boolean) => {
    userDirty.current = true; // Mark as user-modified
    if (checked) {
      setSelectedCollections(prev => [...prev, collectionId]);
    } else {
      setSelectedCollections(prev => prev.filter(id => id !== collectionId));
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    createCollectionMutation.mutate({
      name: newCollectionName.trim(),
      description: `Collection created while saving "${postTitle}"`,
    });
  };

  const handleSaveBookmark = () => {
    if (selectedCollections.length === 0) {
      toast({
        title: "No collections selected",
        description: "Please select at least one collection to save this post.",
        variant: "destructive",
      });
      return;
    }

    bookmarkMutation.mutate({
      postId,
      collectionIds: selectedCollections,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="sm" 
            className={`${isBookmarked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
          >
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="h-4 w-4" />
            <h3 className="font-semibold">Save to Collection</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            "{postTitle}"
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-48 mb-4">
                <div className="space-y-2">
                  {Array.isArray(collections) && collections.map((collection: any) => (
                    <div key={collection.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                      <Checkbox
                        id={`collection-${collection.id}`}
                        checked={selectedCollections.includes(collection.id)}
                        onCheckedChange={(checked) => 
                          handleCollectionToggle(collection.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`collection-${collection.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{collection.name}</span>
                          {(collection.visibilityTypeId === 1 || !collection.visibilityTypeId) && (
                            <Lock className="h-3 w-3 text-gray-400" />
                          )}
                          {collection.isDefault && (
                            <span className="text-xs text-gray-500">(Personal)</span>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}

                  {(!Array.isArray(collections) || collections.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No collections yet. Create your first one below!
                    </p>
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Create new collection */}
              {isCreatingCollection ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCollection();
                      } else if (e.key === 'Escape') {
                        setIsCreatingCollection(false);
                        setNewCollectionName("");
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
                    >
                      Create
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreatingCollection(false);
                        setNewCollectionName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsCreatingCollection(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create new collection
                </Button>
              )}

              <Separator className="my-4" />

              {/* Save button */}
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleSaveBookmark}
                disabled={selectedCollections.length === 0 || bookmarkMutation.isPending}
              >
                {bookmarkMutation.isPending ? "Saving..." : `Save to ${selectedCollections.length} collection(s)`}
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}