import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCollection } from "@/hooks/use-collections";

interface CreateCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCollectionModal({ open, onOpenChange }: CreateCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibilityType, setVisibilityType] = useState("private"); // Default to private
  const createCollection = useCreateCollection();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCollection.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        privateStatusTypeId: visibilityType,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          setVisibilityType("private");
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setVisibilityType("private");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Notebook</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Notebook Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter notebook name"
              required
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this notebook will contain"
              className="mt-2 resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibilityType} onValueChange={setVisibilityType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private - Only you can see this</SelectItem>
                <SelectItem value="shared">Shared - Invited users can access</SelectItem>
                <SelectItem value="public">Public - Anyone can discover and view</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!name.trim() || createCollection.isPending}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {createCollection.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
